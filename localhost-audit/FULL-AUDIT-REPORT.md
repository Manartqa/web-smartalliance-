# SEO Audit: Smart Alliance (localhost:3000)

- **Date:** 2026-10-29
- **Target:** `next dev` at http://localhost:3000 (production: https://www.smartalliance.co.th), branch `feat/contact-form-backend` with uncommitted work
- **Scope:** 26 URLs (13 routes x th/en), all from `sitemap.xml`
- **Business type:** B2B IT services / agency (government and enterprise clients, Axway partner, ISO certified)

## Executive summary

**SEO Health Score: 73 / 100**

| Category | Weight | Score |
|---|---|---|
| Technical SEO | 22% | 82 |
| Content Quality | 23% | 52 |
| On-Page SEO | 20% | 85 |
| Schema / Structured Data | 10% | 80 |
| Performance (CWV), production estimate | 10% | 78 |
| AI Search Readiness | 10% | 67 |
| Images | 5% | 75 |

The technical foundation is strong. Every page is server-rendered, indexable, has a self-referencing canonical and reciprocal hreflang, and has unique titles and descriptions. The sitemap is complete and old WordPress URLs redirect correctly. The score is held back by **content and proof**: thin service pages, no case studies, no named people, and some claims that go beyond the certificates.

### Top issues

1. **The street address does not match the certificates.** The site and schema say 599/36 Ratchadapisek Rd, but the ISO 9001 certificate says 599/59. Verified. *Update: fixed. The site and schema now say 599/59, matching the certificates.*
2. **Service pages are thin.** Each of the 7 detail pages has about 190-270 words of templated copy.
3. **There is no proof of delivery.** The 12 government clients are only names; there are no case studies and no outcomes.
4. **Some claims exceed the evidence.** ISO/IEC 29110 is labelled "Software Engineering", but its scope is network and computer-equipment maintenance. Support is advertised as "24 hours", but the contact hours are Mon-Fri 9-18.
5. **The Axway intent has no landing page.** The services hub title targets "Axway API Management, MFT", but the body never mentions Axway or MFT.

### Quick wins

1. Fix the address everywhere once the registered one is confirmed (site.ts, structured-data.ts, Google Business Profile).
2. Disable next-intl's `Link` header alternates (`alternateLinks: false`). It currently says x-default is `/`, which is a 307 redirect.
3. Re-label ISO 29110 by its real scope, and state the real support hours.
4. Translate the English labels left on Thai pages ("Certifications", "Our service", the about hero label).
5. Show the static mascot (55 KB) on the launcher and load the 739 KB animation after idle.

## Technical SEO: 82

What works:
- 200 status on all 26 URLs.
- `index, follow` everywhere.
- Self-referencing canonicals.
- hreflang en/th/x-default in the HTML and the sitemap.
- One H1 per page.
- Real 404s.
- Legacy URLs return 308.
- Security headers are set.
- Fully server-rendered.

| Severity | Finding | Evidence | Fix |
|---|---|---|---|
| Medium | The HTTP `Link` header disagrees with the HTML on x-default | `curl -I /en` gives `<http://localhost:3000/>; hreflang="x-default"`, and `/` is a 307. The HTML and sitemap say `/en`. | `alternateLinks: false` in `src/i18n/routing.ts` |
| Medium | The apex domain is not redirected to www | DEPLOYMENT.md:32, where nginx serves both hosts | nginx 301 from the apex to `https://www.` |
| Low | The `/` root redirect is a 307 (temporary) | `curl -I /` | Acceptable for locale negotiation. Point WebSite/Organization `url` at a 200 URL. |
| Low | The 404 title is just "404" and the page has two robots meta tags | `/en/nope` | Give `not-found.tsx` a proper title |
| Info | The OG and Twitter image routes return 500 in dev ("unsupported image format") | `/en/opengraph-image` | A previous production build contains a valid 61 KB PNG. Confirm on a production build. |
| Info | The CSP is Report-Only with `'unsafe-inline'` | next.config.ts:42 | Move to enforcing with a nonce |

## On-Page SEO: 85

| Severity | Finding | Evidence | Fix |
|---|---|---|---|
| Low | 7 English descriptions are over 160 characters | Home 178, services 177, … | Trim to 155 or fewer |
| Low | Some Thai titles run to 77-85 characters because of the "(สมาร์ท อัลลายแอนส์)" suffix | IT-infrastructure, home, about | Drop the suffix on long titles |
| Low | The terms descriptions are short (th 75, en 101) | | Expand to 120-155 |
| Low | The home H1 text is duplicated (an sr-only copy plus the typewriter ghost) | Extracted text repeats the H1 | Keep one text node in the H1 |
| Low | English labels on Thai pages | `home.certifications.heading`, `services.detail.eyebrow`, `about.hero.label` | Translate |
| Low | A U+2060 word joiner in "e-Services" reaches `<title>` and llms.txt | digital-workflow pages | It is deliberate in visible headings, where it stops a line break after "e-". Strip it from metadata and llms.txt. |

## Content Quality: 52

| Severity | Finding | Evidence | Fix |
|---|---|---|---|
| High | The address does not match the certificates (verified) | `src/config/site.ts:22` and `structured-data.ts:43` say 599/36. The ISO 9001 certificate says 599/59. | Confirm the registered address and align the site, schema, GBP and certificates |
| High | Service pages are thin and templated | 191-272 words each, the same layout ×7 | 800+ words per service: who it is for, scope, deliverables, stack, a case, an FAQ section |
| High | No case studies or first-hand experience | The 12 clients appear as logos only | 3-7 case studies (agency, problem, solution, result, year), linked from the services |
| High | No named people | No team, leadership or engineer certifications | A leadership/team section and a named lead per service |
| Medium | ISO 29110 is presented as software engineering | Its scope is network and equipment maintenance (`messages/th.json` iso29110.scope) | Label it by scope, and don't imply it covers development |
| Medium | "24 hours" support claim vs Mon-Fri 9-18 contact hours | The support card and schema | State the real support model and SLA |
| Medium | Generic or repeated claims on the home page | "20+ years" appears twice, plus slogans | Replace with specific proof (project counts, agencies) |
| Low | No company registration or tax ID | Footer and contact page | Add them |
| Low | Few freshness signals | Only the legal pages are dated | Date case studies and news |
| Info | TH/EN parity is complete | 617 keys each | None |

## Schema / Structured Data: 80

What works: Organization+LocalBusiness and WebSite on every page, Service on the detail pages, and BreadcrumbList. It is consistent across 10 pages and matches the visible NAP. Note that the address is the unverified 599/36 one.

| Severity | Finding | Fix |
|---|---|---|
| Medium | The Service entities on the hub and detail pages are not linked | Give each ItemList item `"@id": "<detail url>#service"` |
| Medium | No page-level nodes; breadcrumbs unattached | Add WebPage, AboutPage and ContactPage with `breadcrumb`, `isPartOf: /#website`, and `mainEntity` |
| Medium | The same `@id` carries different descriptions per locale | Keep shared nodes language-neutral, or move locale text to page nodes |
| Medium | Thin `sameAs` (Facebook plus a Maps short link) | Add LinkedIn and other real profiles. Move the Maps link to `hasMap`. |
| Low | No `openingHoursSpecification`, no `hasOfferCatalog`, phone has spaces | Add them. Use E.164 for the phone. |
| — | Do not add FAQPage or HowTo | Google retired FAQ rich results (May 2026), and HowTo is deprecated |

## Performance: 78 (production estimate)

Measured CWV was not available: PSI cannot reach localhost, and dev mode distorts lab numbers. The LCP path is well built (a `priority` hero served as AVIF at 13-71 KB), fonts are self-hosted with `swap`, and no CLS sources were found.

| Severity | Finding | Evidence | Fix |
|---|---|---|---|
| High | A 739 KB animated WebP chat launcher loads eagerly on every page | `mascot-smart-wave-sm.webp` via a plain `<img>` in the root layout | Show the static `mascot-smart.webp` (55 KB) first and swap to the animation after idle, or re-encode to 120 KB or less |
| Medium | The chat window mascot is 2.0 MB | `mascot-smart-wave.webp`, loaded only when the chat opens | Re-encode to 400 KB or less, or use a looping WebM |
| Medium | reCAPTCHA loads as soon as /contact hydrates | `ContactForm.tsx:257` `afterInteractive` | Load it on first form focus |
| Medium | The Maps iframe is heavy third-party JS | `ContactMap.tsx` (lazy, no CLS) | Optional click-to-load facade |
| Low | The client carousel autoplays every 2s, even offscreen | `AboutClientsCarousel` | Pause it with an IntersectionObserver |
| Info | About 6.9 MB in `public/assets`; some files may be orphaned | `hero-home.webp`, `hero-contact.webp`, old `svc-*.png` | Check references and delete unused files |

## Images: 75

All images have alt text, and the heroes are served as AVIF through next/image. The deductions are the oversized animated mascots (above) and possibly orphaned assets.

## AI Search Readiness: 67

What works:
- Full SSR.
- Explicit AI crawler groups in robots.txt (search and training both allowed, `/api/` blocked).
- A valid llms.txt generated from the message files.
- Rich Organization JSON-LD.

| Severity | Finding | Fix |
|---|---|---|
| High | No citable proof (case studies, numbers) | See Content |
| Medium | The services hub never mentions Axway or MFT in its body, though its title leads with them | Add a 40-60 word direct-answer paragraph, or a dedicated Axway page (see SXO) |
| Medium | llms.txt omits the 7 service detail URLs, the ISO certificates and the clients | Extend `src/lib/llms-txt.ts` |
| Medium | Thin entity graph | LinkedIn, the DBD registration record, `hasCredential` for the ISO certificates, named leadership |
| Medium | The chat FAQ answers exist only in client-side chat data | Publish a visible FAQ section (for users and AI). No FAQPage schema needed. |
| Low | Text extractors miss the client list and the second certificate card | Repeat the key facts in a plain paragraph or list |

## Agent readiness (feeds AI Search Readiness)

Lighthouse Agentic Browsing was **not measured**: PSI hit its quota and cannot reach localhost. From the HTML, landmarks, headings, labelled controls and SSR are good.

| Severity | Finding | Fix |
|---|---|---|
| Medium | Required contact fields aren't exposed (`noValidate`, "*" only in the placeholder) | Add `required` and `aria-required`, plus a "(required)" hint |
| Low | Placeholder-only fields (aria-label but no visible label) | Visible labels |
| Low | The honeypot is hidden only by `aria-hidden` and offscreen CSS | Add `hidden` or `inert` to the wrapper |
| Low | The client carousel has no region semantics | `role="region"` plus a label |
| Info | No Markdown delivery, WebMCP or ai-catalog | Optional |

## Visual and mobile

The plugin's browser could not open localhost. I re-checked the main claim in the built-in browser at 375×812: the cookie notice (247px) plus the chat launcher cover **about 30%** of the first screen, and the hero CTAs (y 390-432) stay clear.

| Severity | Finding | Fix |
|---|---|---|
| Medium | The cookie notice and mascot together cover about 30% of the first mobile screen | A compact mobile notice. Shrink or hide the launcher until consent. |
| Medium | Form inputs use 14px text, so iOS zooms on focus | `text-base sm:text-sm` |
| Medium | Low-contrast footer legal text (3.7:1) and placeholder/hint text (about 2.5:1) | `text-white/70`; a darker hint colour |
| Medium | Tap targets under 44px (locale links, social icons, about 41px buttons) | Add padding / `min-h-11` |

## Search experience (SXO): gap score 52 (a separate scale)

| Severity | Finding | Fix |
|---|---|---|
| High | No Axway landing page; the services hub's title promises Axway, but its H1 and body are generic | `/services/axway` (TH/EN): partner status, API Management, MFT, B2B, NSW/Customs reference |
| High | Service pages show no proof | A "ผลงาน" block with named agency references per service |
| High | Government procurement questions are unanswered (e-GP, จัดซื้อจัดจ้าง, TOR, MA/SLA) | A "สำหรับหน่วยงานภาครัฐ" section with a visible FAQ |
| Medium | Contact CTAs drop the service context | `/contact?service=<slug>`, prefill the subject, and add a service and org-type field |

## Sitemap: PASS

26 URLs, all 200, canonical, indexable, with reciprocal hreflang, and nothing missing. Two Low findings: the home and contact `lastmod` values will be stale once this branch ships (`CONTENT_DATES`).

## Limits of this audit

- **Dev server:** this was `next dev`. No field CWV, no Lighthouse, no production headers (HSTS, caching).
- **No Google Search Console, GA4, CrUX or backlink data:** none is configured, and backlinks are meaningless for localhost.
- **Brand mentions and google.co.th SERPs:** not checked. Re-run against the production domain.
- **Screenshots:** the plugin's capture failed on localhost. Mobile coverage was measured in the built-in browser instead.

Per-category detail is in `findings/*.md`.
