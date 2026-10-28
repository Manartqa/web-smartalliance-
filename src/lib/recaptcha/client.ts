import { RECAPTCHA_ACTION, RECAPTCHA_SITE_KEY } from "./config";

interface Grecaptcha {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

/** The script tag the contact form renders, or `undefined` without a key. */
export const recaptchaScriptSrc = (locale: string) =>
  RECAPTCHA_SITE_KEY
    ? `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
        RECAPTCHA_SITE_KEY,
      )}&hl=${encodeURIComponent(locale)}`
    : undefined;

/**
 * A fresh token for one submission. Tokens expire after two minutes, so this is
 * called at submit time rather than when the page loads.
 *
 * Resolves `undefined` when no site key is configured. Rejects when the script
 * never loaded — typically a content blocker — which the form reports to the
 * visitor instead of sending a submission the route would refuse anyway.
 */
export function getRecaptchaToken(): Promise<string | undefined> {
  if (!RECAPTCHA_SITE_KEY) return Promise.resolve(undefined);

  const siteKey = RECAPTCHA_SITE_KEY;
  const grecaptcha = window.grecaptcha;
  if (!grecaptcha) {
    return Promise.reject(new Error("reCAPTCHA script has not loaded."));
  }

  return new Promise((resolve, reject) => {
    grecaptcha.ready(() => {
      // `execute` throws synchronously for a key it rejects ("Invalid site
      // key …") rather than returning a rejected promise. Uncaught, that throw
      // escapes this callback and the promise never settles — the form would
      // just sit there.
      try {
        grecaptcha
          .execute(siteKey, { action: RECAPTCHA_ACTION })
          .then(resolve, reject);
      } catch (error) {
        reject(error);
      }
    });
  });
}
