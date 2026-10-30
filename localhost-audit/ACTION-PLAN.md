# SEO Action Plan: Smart Alliance

**Health score:** 73/100, from the 2026-10-29 audit of `next dev` at localhost:3000.

Each item lists:
- **Why:** the reason for the change
- **Unblocks:** what it enables
- **Failed if:** how you would know it did not work
- **Watch:** a leading indicator

## Phase 1: Fix facts (week 1)

1. **Fixed (2026-10-29):** the site now uses **599/59**, matching the ISO certificates. Changed in `src/config/site.ts` and `src/lib/structured-data.ts`; this updates the footer, contact page, JSON-LD and llms.txt. What remains is outside the code: update the Google Business Profile and directory listings to 599/59.

   The original item, for reference: confirm the registered street address and use it everywhere. The site and schema say 599/36; the ISO 9001 certificate says 599/59.
   - **Why:** NAP consistency is a trust and local signal, and a procurement officer will notice the mismatch.
   - **Unblocks:** Google Business Profile, schema and citation work.
   - **Failed if:** any of these still disagree: the site footer, the JSON-LD, the Google Business Profile, the certificates.
   - **Watch:** GBP shows no "suggested edit" for the address.
   - Files: `src/config/site.ts:22`, `src/lib/structured-data.ts:43`.
2. **Fixed (2026-10-29):**
   - The support copy now states Mon – Fri 9:00 – 18:00 instead of "24 hours / around the clock" (`services.items.support.body`, TH/EN).
   - The ISO/IEC 29110 label is kept. "Software engineering" is the standard's own name, and the card already shows the certified scope.

   The original item, for reference: **correct the claims that go beyond the evidence.**
   - Label ISO/IEC 29110 by its real scope (network and equipment maintenance).
   - State the real support model and hours instead of "24 hours", or publish a 24/7 SLA if one exists.
   - **Why:** a claim that contradicts the certificate PDF beside it undermines trust.
   - **Failed if:** the copy on the card differs from the certificate's scope line.
3. **Disable the next-intl `Link` header alternates** (`alternateLinks: false` in `src/i18n/routing.ts`).
   - **Why:** the header says x-default is `/`, which is a 307; the HTML says `/en`.
   - **Failed if:** `curl -I https://www.smartalliance.co.th/en` still shows a `Link` with `hreflang="x-default"` pointing at `/`.
4. **Add an nginx 301 redirect from the apex domain to www.**
   - **Failed if:** `curl -I https://smartalliance.co.th/th` returns 200 instead of 301.
5. **Confirm the OG image on a production build.**
   - **Failed if:** `curl -I https://www.smartalliance.co.th/en/opengraph-image` is not 200 `image/png`.

## Phase 2: High-impact improvements (weeks 2-3)

**Status (2026-10-29): done, with these exceptions.**

- **6:** The launcher shows the still image first and starts the animation after `load` + idle. Re-encoding saved only about 14%, so it was not done.
- **7:** reCAPTCHA loads on first focus or pointer down. A submit waits up to 10 s for the script.
- **8:**
  - Done: `aria-required` on the required fields, 16px inputs on mobile, `inert` on the honeypot, a darker privacy hint, footer legal text at `white/70`, and 44px buttons and language links. The mobile cookie notice went from 247 px to 188 px.
  - Not done: visible labels, which would be a design change.
- **9:**
  - Done: the Thai labels are translated, the 3 `meta.*` EN descriptions are 155 characters or fewer, the 404 page has a title, and U+2060 is stripped from metadata and llms.txt.
  - Kept: the Thai title suffix "(สมาร์ท อัลลายแอนส์)", which a test (`catalogue.test.ts`) enforces for Thai brand search. The service-page descriptions double as visible copy, so they were left as is.
- **10:**
  - Done: the service `@id`s are linked, there is a BreadcrumbList `@id`, there are AboutPage, ContactPage, CollectionPage and WebPage nodes, and `openingHoursSpecification` is set.
  - Kept: the Maps URL stays in `sameAs` and the phone format is unchanged (both are tested on purpose).
  - Pending: real LinkedIn or other profiles, which the owner has to supply.

6. **Make the chat launcher light.** Show the static `mascot-smart.webp` (55 KB) first and swap to the animation after idle. Re-encode the 2 MB chat mascot to 400 KB or less.
   - **Failed if:** the home page transfers more than 300 KB of images before `load` on mobile.
   - **Watch:** the PSI mobile LCP on /th.
7. **Load reCAPTCHA on first form interaction.**
   - **Failed if:** the reCAPTCHA script appears in the /contact network log before the form is touched.
8. **Fix contact form semantics and mobile usability.**
   - Add `required`/`aria-required` and visible labels.
   - Use 16px inputs on mobile.
   - Set the honeypot to `hidden`.
   - Add a compact mobile cookie notice.
   - Fix the contrast of the footer legal and hint text.
   - Use 44px tap targets.
9. **Finish the localisation and metadata cleanup.**
   - Translate the English labels on the Thai pages.
   - Trim the 7 long English descriptions.
   - Shorten the long Thai titles.
   - Give the 404 page a proper title.
   - Strip the U+2060 word joiner from `<title>` and llms.txt.
10. **Link the schema graph.**
    - Add `@id` to the services ItemList items.
    - Add WebPage, AboutPage and ContactPage nodes with `breadcrumb`.
    - Add `openingHoursSpecification` and `hasOfferCatalog`.
    - Use E.164 for the phone number.
    - Add real `sameAs` profiles.
    - **Failed if:** the Rich Results Test shows breadcrumbs that are not attached to a page.

## Phase 3: Content and authority (month 2)

11. **Publish 3-7 case studies** (agency, problem, solution, result, year), starting with the NSW/Customs Axway work. Link each from its service page and from About.
    - **Why:** this is the single biggest gap across the Content, SXO and AI-readiness audits.
    - **Unblocks:** proof blocks, AI citability and the Axway page.
    - **Watch:** impressions on brand + agency queries in Search Console.
12. **Create a dedicated Axway page** (`/services/axway`, TH/EN): partner status, API Management, MFT, B2B integration, references and support. Make the services hub's title match its H1.
    - **Watch:** Search Console impressions for "Axway" queries.
13. **Expand each service page to 800+ words**: who it is for, scope and timeline, deliverables, stack/architecture, compliance (Electronic Government Act, PDPA), a case, and a visible FAQ section.
    - Do not add FAQPage schema; Google retired FAQ rich results in May 2026.
14. **Add a "สำหรับหน่วยงานภาครัฐ" section** covering e-GP, procurement, TOR support, MA/SLA and vendor registration.
15. **Add named leadership and a team section**, plus company registration and tax ID in the footer.
16. **Extend llms.txt** with the 7 service URLs, the ISO certificates (number, scope, expiry) and the client list.

## Phase 4: Monitoring (ongoing)

17. After the production deploy, run `/seo drift baseline https://www.smartalliance.co.th`, then compare after each release.
18. Re-run PSI/Lighthouse and the Lighthouse Agentic Browsing check against production with a Google API key.
19. Keep `CONTENT_DATES` (sitemap lastmod) current. Bump home and contact when this branch ships.
20. Configure Google Search Console and GA4 for `/seo google` field data.
