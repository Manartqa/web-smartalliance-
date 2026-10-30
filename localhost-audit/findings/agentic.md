# Agent-readiness audit: http://localhost:3000 (prod https://www.smartalliance.co.th)

Checked 2026-10-29. Standards facts per vendor-matrix.md (checked 2026-09-23).

## Measurement status
- Lighthouse Agentic Browsing: NOT MEASURED. PSI returned HTTP 429 (daily quota, no API key) for mobile and desktop. PSI also cannot reach localhost. Re-run against production with a Google API key.
- Agent-UX 0-100 heuristic: UNAVAILABLE. Playwright `Page.goto` failed with net::ERR_FAILED on localhost. HTML-only fallback used (below). No score assigned.
- agentic_check.py: ran (static, HTTP-level).

## HTML-only accessibility evidence (/th, /th/contact, /th/about)
- Landmarks: header, 3 nav, main, footer; single h1, logical h2/h3 on contact.
- /th: 2 real buttons, 32 anchors, 0 div-onclick widgets, 0 unlabeled inputs.
- Contact form: 6 fields + consent checkbox. Name/email/company/phone/subject/message have `name`, `id`, `autocomplete`, `aria-label` (placeholder duplicates it). Consent has a real `<label for>` inside a `<fieldset><legend>`. Submit is `type="submit"` with text. Status region `<p aria-live="polite">`.
- Honeypot `contact-ref` sits in an `aria-hidden` wrapper, `tabindex=-1`, label "Leave this field empty".
- Chat launcher: `<button aria-label="แชทกับน้อง SMART">`. Two `<dialog aria-labelledby>` (notice, chat), empty in SSR (rendered on open), so their inner AX tree could not be checked statically.
- Carousel on /th/about: prev control has `aria-label="ก่อนหน้า"`. No `aria-roledescription`/`role=region` on the carousel container found. 21 of 24 images have `alt=""` (decorative); no missing alt attributes.
- Language switcher: `role="group" aria-label="เปลี่ยนภาษา"`, `aria-current` set.

## Findings

| Severity | Title | Evidence | Fix |
|---|---|---|---|
| P2 | Required fields not exposed programmatically | Form is `noValidate`; name, email, message show "*" only inside the placeholder. No `aria-required`/`required` (only the consent box has `required`). Agents cannot tell which fields are mandatory before submitting. | Add `required` + `aria-required="true"` (keep `noValidate` if custom validation stays), and put "(required)" in the aria-label or an `aria-describedby` hint. |
| P2 | Chat dialog/cookie notice agent-operability unverified | Playwright failed; dialogs are empty in SSR. | Re-run `agent_ux_check.py` against a built `next start` or production; confirm the chat input has an accessible name and the dialog traps/returns focus. |
| P3 | No visible labels, placeholder-only UI | `<label>` count is 2 (honeypot, consent). Fields rely on `aria-label` + placeholder. | Add visible `<label>`s (also a human a11y/WCAG 3.3.2 gain). |
| P3 | Honeypot is hidden only by `aria-hidden` + offscreen CSS | Agents driving the DOM (not the AX tree) may fill `contact-ref` and get silently rejected. | Also add `hidden`/`display:none` or `inert` on the wrapper. |
| P3 | Carousel lacks group semantics | No `aria-roledescription="carousel"`/region label on /th/about. | Add `role="region"` + label; keep controls labeled. |
| Info | Content-Signal absent | robots.txt has no `Content-Signal` line. Draft/proposal (Cloudflare policy, Google does not act on it), checked 2026-09-23. | Optional, e.g. `Content-Signal: search=yes, ai-input=yes, ai-train=no`. |
| Info | No Markdown delivery | `Accept: text/markdown` returns text/html; `/th.md` 404. Opportunity, not a defect. | Optional. |
| Info | No WebMCP, ai-catalog.json, api-catalog, agent-card, OAuth well-known | All 404 or 0 `registerTool` calls. WebMCP is a W3C CG draft (WebKit opposes); ai-catalog.json is the ARD 1.0 spec. The only form (contact) is the natural WebMCP candidate. Opportunity only. | Optional: declarative WebMCP on the contact form later. |
| Info | llms-full.txt 404 | llms.txt present (200, 3582 B, passes Lighthouse rules). | Optional. |
| Info | reCAPTCHA v3 on contact | Invisible, score-based; no challenge UI. Agents/automation may be scored low and rejected, with the server logging the score. | Expected for spam control; keep a non-form fallback (email/phone are in llms.txt and JSON-LD). |

## Passes
- Server-rendered: 169 words without JS, no JS shell marker.
- Real 404 for unknown URLs (no catch-all 200).
- robots.txt reachable, 3 groups, deliberate named AI groups, no search crawler blocked.
- llms.txt valid with company facts; sitemap with hreflang pairs; JSON-LD Organization/LocalBusiness on every page; `Link` hreflang headers.
- Dev note: robots/sitemap/llms.txt emit production URLs on localhost (correct canonical behavior).

## Access policy (robots.txt, as served)
- Training (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot, Meta-ExternalAgent, Bytespider): Allow `/`, Disallow `/api/`. Policy decision: training is explicitly allowed; if not intended, flip this group to `Disallow: /`.
- Search (OAI-SearchBot, Claude-SearchBot, PerplexityBot): Allow `/`, Disallow `/api/`.
- User-triggered (ChatGPT-User, Claude-User, Perplexity-User): Allow `/`, Disallow `/api/`. Vendor behavior: Claude-User honours robots.txt; ChatGPT-User may not apply; Perplexity-User and Google-Agent generally ignore it. robots.txt is not enforcement.
- UA-matrix testing not run (not authorized).

## Verdict
Strong baseline for agents: server-rendered, semantic landmarks, labeled controls, clean robots/llms.txt/sitemap. Gaps are small (required-field semantics, unverified dialogs). Lighthouse fraction X/N unmeasured (PSI 429).
