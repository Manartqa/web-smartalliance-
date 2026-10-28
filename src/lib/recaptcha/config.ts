/**
 * reCAPTCHA v3 settings shared by the contact form and the route that checks
 * its token, so the action name cannot drift between the two.
 */

/** Public site key. Baked in at build time like every `NEXT_PUBLIC_*`. */
export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || undefined;

/** Names the request in the reCAPTCHA console and is checked on the server. */
export const RECAPTCHA_ACTION = "contact";

/**
 * Scores run from 0.0 (bot) to 1.0 (person). 0.5 is Google's suggested
 * starting point; raise it if spam gets through, lower it if real enquiries are
 * rejected — the score of every rejection is logged by the route.
 */
export const RECAPTCHA_MIN_SCORE = 0.5;
