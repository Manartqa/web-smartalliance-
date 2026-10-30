# GEO / AI Search Readiness - Smart Alliance (localhost:3000, prod www.smartalliance.co.th)

Audit date: 2026-10-29. Pages sampled: /en, /en/about, /en/services, /en/services/api-system-integration, /th. Raw fetch (no JS); all pages SSR/prerendered (`x-nextjs-prerender: 1`, `is_spa: false`).

## AI Search Readiness score: 67 / 100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 55 | 13.8 |
| Structural readability | 20% | 75 | 15.0 |
| Multi-modal content | 15% | 55 | 8.3 |
| Authority & brand signals | 20% | 60 | 12.0 |
| Technical accessibility | 20% | 90 | 18.0 |
| **Total** | | | **67** |

## AI crawler access (/robots.txt)

| Bot | Governs | Status |
|---|---|---|
| OAI-SearchBot | ChatGPT Search | Allowed (explicit group) |
| ChatGPT-User | ChatGPT user-initiated fetch | Allowed |
| Claude-SearchBot | Claude search | Allowed |
| Claude-User | Claude user fetch | Allowed |
| PerplexityBot / Perplexity-User | Perplexity | Allowed |
| Googlebot (via `*`) | Google Search + AI Overviews | Allowed |
| GPTBot | OpenAI training only | Allowed |
| ClaudeBot | Anthropic training only | Allowed |
| Google-Extended | Gemini/Vertex training + grounding | Allowed |
| Applebot-Extended | Apple Intelligence training only | Allowed |
| CCBot, Meta-ExternalAgent, Bytespider | Training | Allowed |
| cohere-ai | Training | Not named; falls to `*` (allowed) |

All groups disallow only `/api/`. The policy is explicit and consistent. Allowing training bots is a deliberate business choice (fine for brand reach). Note: `Host:` is a non-standard Yandex-only directive. Google ignores it, and it does no harm.

## llms.txt

Present, 200, `text/plain`, built from the message files (`src/lib/llms-txt.ts`), so it stays in sync with on-page copy. It has a well-formed H1, a blockquote summary, page links, service summaries, company facts, and Thai URLs. Accurate against the site.

Gaps:
- It does not link the 7 service detail pages (`/en/services/<slug>`), which are in the sitemap.
- It leaves out ISO 9001:2015 (cert 0905Q394926, valid to 2029-09-04), ISO/IEC 29110-4-1:2018 (cert 28112401, valid to 2027-11-27) and the named government client list. These are the most quotable trust facts on the site.
- The "Digital Workflow & e-Services" title contains an invisible U+2060 WORD JOINER (bytes E2 81 A0) after "e-". The page H3 has the same character. Exact-match quoting and search may break on it.
- No RSL licensing file was found. This is optional.

## Citability

- Home has about 229 extractable words, About about 263, Services about 411, and the service detail about 248. Passages are short, marketing-style and in the second person ("We connect data..."). There are few standalone, quotable definitions.
- Quotable facts: founded 2004, 20+ years, Authorized Axway Partner, ISO numbers and validity dates, 12 named public-sector clients (Customs Dept, FDA, NSO, Thailand NSW, PWA, Excise...), and the Bangkok address.
- No quantities: number of projects, staff, clients or certified engineers.
- No question-style headings anywhere. The FAQ (chat `faq.*`: cloud, security, timeline, government) exists only in the RSC payload of the client-side chat. It is not in the rendered DOM and has no FAQPage markup.
- The services hub `<title>`/description lead with "Axway API Management, MFT", but the body says "Axway"/"MFT" 0 times. Only the API detail page and About explain it.
- No case studies or project outcomes tie a client to a service and a result.
- The Thai home H2 "Certifications" is untranslated.
- Trafilatura dropped the client list and the ISO 9001 card from `extracted_text` (carousel/card markup). The text is in the HTML, but extractors may miss it.

## Entity clarity

Strong. The Organization+LocalBusiness `@graph` has legalName, a Thai alternateName, foundingDate, address, geo, telephone, contactPoint and knowsAbout. Each detail page has a Service with `provider` @id, plus BreadcrumbList, `<html lang>` and hreflang.

Weak points: `sameAs` lists only Facebook and Google Maps (no LinkedIn, Wikidata or DBD registration). The ISO certs are not in schema (`hasCredential`). There are no named people, leadership or authors, and no visible dateModified.

## Brand mentions

Out of scope (localhost target; no web search run). Check Wikipedia/Wikidata, LinkedIn company page, YouTube and Reddit separately for the production domain.

## Findings

| Severity | Title | Evidence | Fix |
|---|---|---|---|
| High | FAQ not crawlable | Chat FAQ only in RSC JSON, absent from DOM | Render a visible FAQ section (home/services) with question H2/H3 + FAQPage JSON-LD |
| High | No case studies / outcomes | Clients listed as names only | Add 3-5 case pages: client, problem, Axway/API solution, measurable result, year |
| Medium | Services hub body lacks Axway/MFT | Title says Axway; body 0 mentions | Add a 40-60 word direct-answer paragraph on Axway API Mgmt/MFT to the hub |
| Medium | llms.txt incomplete | No detail URLs, certs, clients | Add service detail links, ISO certs, client list |
| Medium | Thin entity graph | sameAs = FB + Maps | Add LinkedIn, Wikidata, DBD record; `hasCredential` for ISO |
| Low | U+2060 in "e-Services" | E2 81 A0 in llms.txt + H3 | Remove the joiner in messages copy |
| Low | No quantified facts | Only 2004 / 20+ | Publish project/client/engineer counts |
| Low | Untranslated TH heading | /th H2 "Certifications" | Translate |
| Low | Non-standard `Host:` in robots | robots.txt last group | Optional removal |
