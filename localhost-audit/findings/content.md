# Content Quality / E-E-A-T findings (localhost:3000)

Status: FINAL. Audited 2026-10-29 against the local dev server; 26 URLs from sitemap.xml (13 TH + 13 EN).
Method: render_page.py (raw mode) for every URL, word counts on `extracted_text` (Thai tokenized with
PyThaiNLP newmm), 5-gram Jaccard across service pages, metadata_template.py on all 26 title/description
pairs, key-by-key parity check of messages/th.json vs messages/en.json, certificate images in public/assets.

## Scores

| Metric | Score |
|---|---|
| Content Quality (overall) | 52 / 100 |
| E-E-A-T (weighted) | 49 / 100 |
| - Experience (20%) | 30 |
| - Expertise (25%) | 50 |
| - Authoritativeness (25%) | 50 |
| - Trustworthiness (30%) | 60 |
| AI citation readiness | 40 / 100 |

## Word counts (main content, extracted_text)

| Page | TH words | EN words | Floor |
|---|---|---|---|
| Home | 245 | 214 | 500 |
| About | 287 | 247 | 500 |
| Services hub | 430 | 371 | 800 |
| Service detail x7 | 229-272 | 191-223 | 800 |
| Contact | 119 | 120 | n/a |
| Privacy / Terms | 689 / 446 | 705 / 445 | n/a |

Note: trafilatura drops the About client carousel (12 agency names do render in HTML) and the
second certificate card on Home; counts are close to what a reader sees in the main body.

## Findings

| Severity | Title | Evidence | Fix |
|---|---|---|---|
| Critical | Service pages are thin | All 7 detail pages 191-272 words (floor 800); each is overview paragraph + 4 bullet cards + 5 one-line steps. Hub 371-430. | Expand each to 800+ words: who it is for, typical project scope/timeline, deliverables, technologies, a mini case study, FAQ. |
| High | No case studies / first-hand experience | No project descriptions anywhere. Clients are logos+names only (About). Timeline is generic ("Expanded our services and delivered large-scale projects", "Introduced a new logo"). | Add 3-7 case studies (agency, problem, solution, stack, measurable result, year), link each from the relevant service page; rewrite timeline with named milestones (e.g. first Axway project, NSW integration). |
| High | Street address contradicts the certificates | Site, footer and LocalBusiness schema: "599/36 Ratchadapisek Road" (src/config/site.ts:22, src/lib/structured-data.ts:43). Both ISO certificate images: "599/59 Ratchadaphisek Road". | Confirm the registered address; make site, schema, Google Business Profile and certificates agree (or explain if the building has two numbers). |
| High | No people / expertise owners | No team, leadership, engineer certifications (Axway, ISO auditor, cloud), or named contacts on any page. About claims staff are "trained by the product vendors" with no proof. | Add a leadership/team section with names, roles, years, vendor certifications; attribute service pages to a named lead. |
| Medium | Certification claims stretch the certified scope | ISO/IEC 29110 is labelled "Software Engineering" next to software-dev copy, but its scope is "Quality maintenance services for network systems, computer equipment and accessories". ISO 9001 scope is "Sales, installation and maintenance services system software"; About says it means "our work meets internationally recognized quality standards". | Keep the scope text (it is accurate) but avoid implying custom-development coverage; add verification links (otabuglobal.com, ostiamanagement.com) next to each certificate number. |
| Medium | "24 hours / around the clock" claim conflicts with stated hours | Support card + schema: "ตลอด 24 ชั่วโมง" / "runs smoothly around the clock"; contact page: Mon-Fri 9:00-18:00. No SLA figures on the support page. | State the real support model (business-hours helpdesk, 24x7 monitoring if true) and publish SLA tiers / response times. |
| Medium | Templated service-page structure | Body copy is unique (5-gram Jaccard max 0.002 TH and EN) but all 7 pages share an identical skeleton and length; QRG "repetitive structure across pages" signal. | Vary sections by service (e.g. AI: accuracy/privacy; Security: standards and compliance; Data: sample dashboards). |
| Medium | Low AI citation readiness | Few quotable, specific facts; mostly 2-5 word bullet fragments; no FAQ, no numbers beyond "20+ years"/"2004". Schema (Organization, LocalBusiness, Service, BreadcrumbList) is good. | Add 1-2 sentence factual answers per service (what, for whom, how long, which standards), FAQ blocks, concrete stats (projects delivered, agencies served, years as Axway partner). |
| Medium | Repetitive generic claims on Home | "20+ years", "Government & Enterprise Projects", "End-to-End Project Delivery" appear in both the "Why" list and the stats list; hero/CTA copy ("innovative, secure, and scalable") is generic. | Merge duplicate lists; replace slogans with specific proof (client count, flagship project). |
| Low | Untranslated labels on TH pages | th.json: about.hero.label "About Smart Alliance", home.certifications.heading "Certifications", services.detail.eyebrow "Our service". | Translate (e.g. "เกี่ยวกับเรา", "การรับรองมาตรฐาน", "บริการของเรา"). |
| Low | Readability (EN) heavy | Prose sentences avg 14-28 words; About intro 28 words/sentence; dense noun stacks ("enterprise-grade digital solutions"). Est. Flesch 0-45. Thai copy is clear but similarly abstract. | Shorter sentences, concrete verbs and outcomes. |
| Low | No company registration number | No Thai juristic person / tax ID on contact, footer or privacy policy. | Add it to the footer and Contact page. |
| Low | No visible freshness signals | Service/About pages carry no updated date; only legal pages show "Effective date: 8 October 2026". | Add case-study and news dates; keep timeline current. |
| Info | TH/EN parity is good | 617 keys in each locale, none missing; numbers match (BE years converted correctly). | None. |
| Info | Metadata not templated | metadata_template.py: site_risk low, templated_ratio 0.0, no shared CTA phrases; 3 low "brand-suffix-in-description" flags (/en/contact, /en/privacy-policy, /en/terms) are natural sentences. | None needed. |
| Info | Contact/trust basics present | tel:+66655092905, admin@smartalliance.co.th, address, map, hours, privacy policy, terms, cert PDFs with numbers and expiry, Axway partner badge, 12 named government clients. | Keep; add client testimonials with names/titles. |
