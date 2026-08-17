# Secure Development Standard

**Scope:** Smart Alliance website (`D:\AI\Smart\code`) · **Stack:** Next.js 16 App Router,
React 19, TypeScript, one Node route handler, Microsoft Graph mail
**Standard:** OWASP Top 10:2025 · **Baseline audit:** 2026-08-17, 6 findings, no
Critical/High

This is a four-page marketing site with **one writable endpoint** and **no user
accounts**. Most of the OWASP surface simply does not exist here, and rules for
absent surface are noise — so this document covers what this codebase actually
has, plus the few rules that would matter the day it grows an admin area.

## How to use it

- Every change is expected to comply. Rules marked *enforced* fail the build or
  are caught by `tsc`/`eslint`; the rest are code-review rules.
- When adding a new sink of a known class — HTML into an email, an outbound
  fetch, an external link, a new endpoint — use the helper named below rather
  than hand-rolling one.
- Each rule states **why it exists here**. If a rule ever blocks something
  legitimate, change the rule deliberately; don't quietly work around it.

## Rules

### A01 — Access control & SSRF

- **No outbound request may take its host from a request.** Every `fetch` target
  in this repo is a hardcoded constant (`graph.microsoft.com`,
  `login.microsoftonline.com`); only path segments are interpolated, from server
  env, and always through `encodeURIComponent`. A user-supplied URL would turn
  the mail path into an SSRF that also leaks the Graph bearer token. *(review;
  CWE-918)*
- **If an authenticated area is ever added**, every handler taking an id checks
  ownership, not just "logged in". The `lib/api/interceptor.ts` comment marks
  where the 401 path belongs. *(review; CWE-862/639)*

### A02 — Configuration

- **The security headers in `next.config.ts` are part of the deliverable.**
  `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` and
  (production only) HSTS ship on every response, and `poweredByHeader` stays
  `false`. Do not remove one to make something work — fix the something.
  *(enforced by config; CWE-693)*
- **CSP is `Content-Security-Policy-Report-Only` on purpose.** Enforcing it today
  would break the Maps iframe and Next's inline bootstrap. Before switching it to
  the enforcing header, add a script nonce and drop `'unsafe-inline'` from
  `script-src` — otherwise the policy documents XSS instead of stopping it.
  *(review)*
- **Nothing secret goes in a `NEXT_PUBLIC_` variable.** That prefix ships the
  value into the browser bundle. Current public vars — site URL, the two
  search-console tokens — are public by nature. *(review; CWE-200)*

### A03 — Supply chain

- **`package-lock.json` is committed and stays committed.** *(enforced)*
- **`npm audit --omit=dev` must be clean before a release.** Today: 0
  vulnerabilities. Add Dependabot and an audit step in CI so this is not a manual
  ritual. *(gap — see "Enforcement gaps")*

### A04 — Secrets & crypto

- **`.env*` is gitignored except `.env.example`.** The example file carries names
  and comments, never values. Verified clean: `.env.local` has never been
  committed. *(enforced by `.gitignore`; CWE-798)*
- **Encrypted config values use the `lib/secrets.ts` scheme only** — AES-256-GCM,
  per-value random salt and IV, scrypt N=2^15, auth tag verified on decrypt. No
  new crypto by hand; no ECB, static IV, MD5/SHA-1, or `Math.random`. *(review;
  CWE-327/330)*
- **Comparing a secret uses `safeEqual`** (`timingSafeEqual`), never `===`.
  *(review; CWE-208)*
- **The master key and the ciphertext live in different places.** Both in
  `.env.local` buys nothing — that is written in `secrets.ts` and it is a rule,
  not a remark.

### A05 — Injection

- **Every user value rendered into the notification email goes through
  `escapeHtml`** in `lib/mail/contact-template.ts`. It escapes `& < > " '`. No
  exceptions, including values that "can't" contain markup. *(review; CWE-79)*
- **Attributes in that template stay double-quoted.** The escaper covers `'`, so
  this is belt and braces — but a single-quoted attribute is exactly how mail
  templates grow an XSS. *(review)*
- **Anything reaching a mail header — subject, reply-to — goes through
  `singleLine()`**, which strips CR/LF. `EMAIL_PATTERN` is the second gate;
  neither alone is the control. *(review; CWE-93)*
- **`dangerouslySetInnerHTML` is allowed in exactly one place**
  (`components/common/JsonLd.tsx`), which escapes `<` to `\u003c` before
  injecting. A second use needs a real reason and a sanitizer. No `innerHTML`,
  `eval`, `new Function`, or `document.write` anywhere. *(review; CWE-79)*

### A06 — Design

- **Validation is server-side.** The form's client-side checks are UX. Required
  fields, per-field maximum lengths and the email pattern are re-checked in
  `app/api/contact/route.ts`; `lib/validation.ts` holds the shared pattern so the
  two cannot drift. *(review)*
- **`X-Forwarded-For` is read only when `TRUST_PROXY` says a proxy rewrites it.**
  It is an ordinary request header — forging a fresh value per request is a rate
  limiter that never limits. Untrusted deployments share one bucket instead.
  *(review; CWE-290)*
- **The site-wide hourly ceiling stays.** It is what bounds the damage when the
  per-caller key is wrong, and it must be raised deliberately, never "to make the
  429 go away". *(review)*
- **New public write endpoints get both limits**, plus a honeypot if a form feeds
  them.

### A09 — Logging

- **No personal data in logs.** Email addresses, phone numbers and message bodies
  belong in the mailbox, not the application log, which is retained longer and
  read by more people. Log the event and a non-identifying fragment. This is a
  PDPA obligation, not a preference. *(review; CWE-532)*
- **No secrets or tokens in logs**, including inside error objects — check what an
  exception carries before logging it whole. *(review)*

### A10 — Errors

- **The client gets a static error code, never an internal message.** The route's
  vocabulary is `invalid_json`, `validation_failed`, `rate_limited`,
  `not_configured`, `send_failed`; transport and Graph details are logged
  server-side only. *(review; CWE-209)*
- **Fail closed.** A configuration or transport fault returns 503/502 and drops
  the submission; it never pretends the mail was sent. The one deliberate lie —
  a tripped honeypot returning `ok` — is documented at the call site. *(review;
  CWE-703)*

## Designated helpers

| Concern | Use | Never |
|---|---|---|
| User value into email HTML | `escapeHtml` (`lib/mail/contact-template.ts`) | raw interpolation |
| User value into a mail header | `singleLine` + `EMAIL_PATTERN` | raw value |
| JSON-LD into the page | `<JsonLd>` (`components/common/JsonLd.tsx`) | bare `dangerouslySetInnerHTML` |
| Reading a secret from config | `readSecret` (`lib/secrets.ts`) | `process.env.X` for a secret |
| Comparing a secret | `safeEqual` (`lib/secrets.ts`) | `===` |
| Client identity for limiting | `clientKey` (`lib/rate-limit.ts`) | raw `x-forwarded-for` |
| Outbound HTTP | hardcoded host + `encodeURIComponent` on segments | host from a request |

## Enforcement gaps

Known and accepted for now — the honest list, so nobody assumes these are
covered:

- **No CI.** No dependency scanning, no secret scanning, no automated `npm audit`.
  This is finding F6 of the baseline audit and the main reason the standard above
  is review-enforced rather than machine-enforced.
- **No security lint rules** (`eslint-plugin-security`, semgrep). The raw-HTML and
  logging rules would be good candidates.
- **Rate-limit state is in process memory**, so on a multi-instance deployment
  both limits multiply by the instance count. Move to Redis/Upstash if the site
  is scaled out.
- **Request bodies are parsed before any size check** (audit finding F3). Whether
  that matters depends on what fronts the Node process in production.

## Reporting a vulnerability

Email **admin@smartalliance.co.th** with steps to reproduce. Please do not open a
public issue for a security problem.
