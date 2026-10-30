# SXO Findings — Smart Alliance (localhost:3000)

Date: 2026-10-29. Scope: /th, /th/services, 7 x /th/services/<slug>, /th/about, /th/contact, /en, /en/services, /en/services/api-system-integration.
Method: pages fetched with curl (the bundled `render_page.py` refuses localhost because of SSRF protection) and parsed with a local HTML extractor. 5 web searches were run for SERP context.

## SXO Gap Score: 52 / 100 (separate from SEO Health Score)

| Dimension | Score | Evidence |
|---|---|---|
| Page type | 10/15 | Service detail pages are the right type for commercial B2B queries. No dedicated Axway partner/product page. No case-study/portfolio page type. |
| Content depth | 5/15 | Each service page has about 2,000-2,300 visible characters on one identical template (overview, 4 capabilities, 5 steps, CTA). The home page has about 2,250 characters. No FAQ. |
| UX signals | 9/15 | Clear nav, a process section on every service page, CTA present. CTAs are generic and lose context. |
| Schema | 10/15 | Service, BreadcrumbList, ItemList, Organization+LocalBusiness, WebSite. No FAQPage. No Review/case-study markup. |
| Media | 7/15 | Decorative art only. No system screenshots, architecture diagrams or project photos. |
| Authority | 7/15 | ISO 9001/29110 PDFs and an Axway partner-directory link. A list of 12 government clients exists only on /about. No case studies, testimonials or named outcomes. |
| Freshness | 4/10 | No dates, news or "latest project" signals. |

## SERP context (limitations apply)

- "Axway partner Thailand": the SERP is thin and dominated by Axway's own resources and directory pages. The only Thai partner surfaced was Gable (Axway interview video). This is a low-competition, high-intent query that no Smart Alliance page targets directly.
- "API integration services Thailand": a mix of marketplaces (arc.dev), listicles and regional agency service pages. Agency results lead with case studies and stack detail.
- "บริษัทพัฒนาซอฟต์แวร์ ภาครัฐ" / "รับพัฒนาระบบ e-Service หน่วยงานราชการ": results were mostly news and regulatory content (พ.ร.บ.การปฏิบัติราชการทางอิเล็กทรอนิกส์, e-Government Receipt, Citizen/Biz Portal). Informational and compliance intent is mixed with vendor search.
- Dominant expected type for commercial queries: service page plus proof (case study or client list). Confidence is about 60%.

## Findings (severity | title | evidence | fix)

1. HIGH | No Axway landing page; the hub page is used as a proxy | /th/services has the title "บริการ — Axway API Management, MFT และการเชื่อมโยงระบบ" but the H1 "บริการเทคโนโลยีครบวงจรสำหรับองค์กรยุคใหม่" and lists 7 services. The Axway SERP is thin, with Gable as the only visible Thai partner. | Create /services/axway (TH/EN) as a product-partner page covering the partner tier, API Management, MFT and B2B, a reference project (NSW/Customs), migration and support. Give the hub page a generic title that matches its H1.
2. HIGH | Service pages have no proof | None of the 7 service pages names a client, project or outcome. The client list (Customs, NSW, FDA, PWA, Excise and others) appears only on /about. | Add a "Projects/ผลงาน" block per service with 1-2 named government references (agency, scope, year, result). Add a case-study page type.
3. HIGH | Procurement fit is unanswered | There is no copy on the site about e-GP, จัดซื้อจัดจ้าง, registered capital, vendor registration, TOR support, MA/SLA terms or PDPA/security documents (grep of messages/th.json returns 0 hits). | Add a "สำหรับหน่วยงานภาครัฐ" section or page covering procurement methods supported, company registration, certificates, SLA and MA, and TOR consultation, plus a FAQ with FAQPage schema.
4. MEDIUM | CTA flow loses service context | Every service page CTA "ติดต่อเรา" links to bare /th/contact. The form has no service or project-type field, only free-text "หัวข้อเรื่อง". | Use /th/contact?service=<slug>, prefill the subject, and add a service select plus an "organization type (ภาครัฐ/เอกชน)" field. Offer a secondary CTA such as "ขอใบเสนอราคา / ขอ TOR consult".
5. MEDIUM | Thin, templated service pages | About 2.1k characters each with identical H2 structure. Nothing differentiates them for the CTO persona (stack, integration patterns, deployment models). | Expand each page to about 6-8k characters with a tech stack, sample architecture, a compliance mapping (พ.ร.บ.ปฏิบัติราชการทางอิเล็กทรอนิกส์, PDPA) and a FAQ.
6. MEDIUM | ISO 29110 label does not match the certificate scope | The home page labels it "ระบบวิศวกรรมซอฟต์แวร์ / Software Engineering", but the scope reads "บริการบำรุงรักษาคุณภาพระบบเครือข่าย อุปกรณ์คอมพิวเตอร์". A procurement officer checking the PDF will notice. | Label it by actual scope, or explain it.
7. LOW | The home page has no service overview or client logos | The home page has only a "บริการของเรา" link. It has no service cards and no client strip, and the Thai page has the English H2 "Certifications". | Add 7 service cards and a client-logo strip above the fold. Translate the H2.

## User stories

- As a government IT procurement officer, I need to confirm the vendor has done similar agency projects and holds valid certificates, so I can justify the selection under procurement rules. (Signal: compliance/regulatory results in the Thai SERP.)
- As an enterprise CTO, I need to see the stack, architecture and integration patterns before booking a call. (Signal: agency results for "API integration services Thailand" lead with case studies.)
- As an integration lead on Axway, I need to find a local certified partner for MFT/API Gateway support. (Signal: thin Axway SERP; the competitor Gable appears.)
- As a department director, I need e-Service compliance with the Electronic Government Act. (Signal: regulatory news dominates the e-Service query.)

## Personas (Relevance/Clarity/Trust/Action, 25 each), weakest first

| Persona | R | C | T | A | Total | Top fix |
|---|---|---|---|---|---|---|
| Enterprise CTO | 15 | 12 | 10 | 10 | 47 | Architecture and case studies on service pages |
| Axway integration lead | 12 | 12 | 14 | 10 | 48 | Dedicated Axway page |
| Gov department director (e-Service) | 16 | 13 | 11 | 10 | 50 | Compliance mapping and named gov references |
| Gov procurement officer | 18 | 14 | 12 | 10 | 54 | Procurement/FAQ section, correct ISO labels |

## Limitations

- WebSearch is US-located and not a true google.co.th SERP, so Thai SERP features (PAA, AI Overview, local pack) could not be observed.
- render_page.py blocks localhost, so JS-only content and above-the-fold layout were not assessed. curl HTML was SSR-complete.
- No traffic, Search Console or ranking data was available.

## Structured findings (audit-data.json, category: Search Experience)

```json
[
 {"severity":"high","title":"No dedicated Axway partner page","url":"/th/services"},
 {"severity":"high","title":"Service pages lack proof (clients, case studies)","url":"/th/services/*"},
 {"severity":"high","title":"Government procurement questions unanswered","url":"site-wide"},
 {"severity":"medium","title":"Service CTAs drop service context; form lacks service field","url":"/th/contact"},
 {"severity":"medium","title":"Thin templated service pages (~2.1k chars)","url":"/th/services/*"},
 {"severity":"medium","title":"ISO 29110 labelled Software Engineering but scope is network maintenance","url":"/th"},
 {"severity":"low","title":"Home lacks service cards and client logos; EN heading on TH page","url":"/th"}
]
```
