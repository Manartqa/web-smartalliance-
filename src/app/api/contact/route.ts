import { NextResponse } from "next/server";

import { sendContactMail } from "@/lib/mail";
import { clientKey, rateLimit, GLOBAL_KEY } from "@/lib/rate-limit";
import { EMAIL_PATTERN } from "@/lib/validation";
import type { ApiErrorResponse } from "@/types/api/main/common";
import type { ContactRequest, ContactResponse } from "@/types/api/main/contact";

/** Nodemailer needs Node APIs, so this route cannot run on the Edge runtime. */
export const runtime = "nodejs";

/** Per-caller submission budget. */
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };

/**
 * Whole-site ceiling, counted on top of the per-caller budget.
 *
 * The per-caller key is only as good as the deployment's proxy configuration
 * (see `clientKey`), so this is the number that actually bounds the damage if
 * that key is ever forgeable: no more than this many enquiries reach the
 * mailbox in an hour, from anyone, by any route. Set well above real traffic —
 * this site takes a handful of enquiries a week.
 */
const GLOBAL_LIMIT = { max: 60, windowMs: 60 * 60 * 1000 };

const MAX_LENGTH = {
  name: 120,
  email: 200,
  company: 160,
  phone: 40,
  subject: 200,
  message: 5000,
} as const;

const fail = (
  error: ApiErrorResponse["error"],
  status: number,
  headers?: HeadersInit,
) => NextResponse.json<ApiErrorResponse>({ error }, { status, headers });

export async function POST(request: Request) {
  let body: Partial<ContactRequest>;
  try {
    body = await request.json();
  } catch {
    return fail("invalid_json", 400);
  }

  // Bots fill every input they find. Accept the request so they get no signal
  // to retry differently, but drop it on the floor.
  if (body.website?.trim()) {
    // Logged because the visitor is told the message was sent: without this
    // line a honeypot tripped by browser autofill looks identical to mail that
    // never arrived, with nothing anywhere to explain the difference.
    console.warn(
      `[contact] honeypot filled — submission dropped (from ${
        body.email?.trim() || "no email"
      }).`,
    );
    return NextResponse.json<ContactResponse>({ ok: true });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const company = body.company?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const subject = body.subject?.trim() ?? "";

  const tooLong =
    name.length > MAX_LENGTH.name ||
    email.length > MAX_LENGTH.email ||
    company.length > MAX_LENGTH.company ||
    phone.length > MAX_LENGTH.phone ||
    subject.length > MAX_LENGTH.subject ||
    message.length > MAX_LENGTH.message;

  if (!name || !email || !message || !EMAIL_PATTERN.test(email) || tooLong) {
    return fail("validation_failed", 400);
  }

  // Rate limited only after the payload is known-good, so malformed spam
  // cannot burn a legitimate visitor's budget.
  const limit = rateLimit(clientKey(request), RATE_LIMIT);
  if (!limit.allowed) {
    return fail("rate_limited", 429, { "Retry-After": String(limit.retryAfter) });
  }

  // Checked second so a caller inside its own budget still cannot push the site
  // past the hourly ceiling.
  const global = rateLimit(GLOBAL_KEY, GLOBAL_LIMIT);
  if (!global.allowed) {
    console.error(
      "[contact] hourly site-wide submission ceiling reached — further enquiries " +
        "are being rejected. Investigate before raising GLOBAL_LIMIT.",
    );
    return fail("rate_limited", 429, {
      "Retry-After": String(global.retryAfter),
    });
  }

  const result = await sendContactMail({
    name,
    email,
    message,
    ...(company ? { company } : {}),
    ...(phone ? { phone } : {}),
    ...(subject ? { subject } : {}),
  });

  if (result.status === "not_configured") {
    console.error(
      `[contact] SMTP is not configured — missing ${result.missing.join(", ")}. ` +
        "Submission was rejected rather than silently dropped.",
    );
    return fail("not_configured", 503);
  }

  if (result.status === "send_failed") {
    console.error("[contact] SMTP delivery failed:", result.reason);
    return fail("send_failed", 502);
  }

  return NextResponse.json<ContactResponse>({ ok: true });
}
