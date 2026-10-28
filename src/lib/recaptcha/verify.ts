import "server-only";

import { RECAPTCHA_ACTION, RECAPTCHA_MIN_SCORE } from "./config";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const TIMEOUT_MS = 5000;

export type RecaptchaResult =
  /** No `RECAPTCHA_SECRET_KEY` — the check is switched off. */
  | { status: "disabled" }
  | { status: "passed"; score: number }
  /** `reason` is for the log only; it never reaches the response. */
  | { status: "failed"; reason: string };

interface SiteverifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
}

/**
 * Checks a reCAPTCHA v3 token with Google.
 *
 * Switched on by `RECAPTCHA_SECRET_KEY` alone. Once it is set a submission
 * without a token fails — so a build made without
 * `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` shows up as every enquiry being rejected
 * with "missing token" in the log, rather than as spam protection that is
 * silently not there.
 *
 * Fails closed: if Google cannot be reached the submission is refused. The
 * honeypot and rate limits still stand behind it, but a check that waves
 * everything through whenever it errors is one an attacker can switch off.
 */
export async function verifyRecaptcha(
  token: string | undefined,
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) return { status: "disabled" };
  if (!token) return { status: "failed", reason: "missing token" };

  let result: SiteverifyResponse;
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      return { status: "failed", reason: `siteverify HTTP ${response.status}` };
    }
    result = (await response.json()) as SiteverifyResponse;
  } catch (error) {
    return {
      status: "failed",
      reason: `siteverify unreachable: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  if (!result.success) {
    return {
      status: "failed",
      reason: `rejected by Google (${
        result["error-codes"]?.join(", ") || "no error code"
      })`,
    };
  }

  // A token minted for another action on the same key must not count here.
  if (result.action !== RECAPTCHA_ACTION) {
    return {
      status: "failed",
      reason: `wrong action "${result.action ?? ""}"`,
    };
  }

  const score = result.score ?? 0;
  if (score < RECAPTCHA_MIN_SCORE) {
    return { status: "failed", reason: `score ${score} below threshold` };
  }

  return { status: "passed", score };
}
