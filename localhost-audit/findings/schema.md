# Schema / Structured Data audit (localhost:3000, 10 pages: home/about/services/service-detail/contact x en/th)

Score: 80/100. All JSON-LD is server-rendered, parses, uses https://schema.org, absolute URLs, no placeholders, no HowTo/FAQPage/deprecated types.

## Detected (identical structure in en and th)
- Layout, every page: one @graph = Organization+LocalBusiness (@id /#organization) + WebSite (@id /#website, publisher -> org)
- Home: Service (Axway partnership, @id /#axway-partnership, provider -> org, brand Axway)
- About: BreadcrumbList + same Axway Service
- Services: BreadcrumbList + ItemList (7 Service, anonymous, provider -> org, url -> detail page)
- Service detail: BreadcrumbList (3 levels) + Service (@id <url>#service)
- Contact: BreadcrumbList only

## Findings
| Sev | Title | Evidence | Fix |
|---|---|---|---|
| High | Social card used as LocalBusiness image returns 500 locally | GET /en/opengraph-image and /en/twitter-image -> 500 "Input buffer contains unsupported image format" (sharp); referenced by og:image and JSON-LD `image` | Confirm it renders on a production build; if not, fix opengraph-image.tsx. Prefer a real office photo as LocalBusiness image. |
| Medium | Shared @id with locale-specific content | WebSite /#website and Organization /#organization carry different description/inLanguage/legalName in en vs th | Acceptable if intentional; drop `inLanguage` from WebSite or use inLanguage ["en-US","th-TH"], keep description identical or per-locale WebPage nodes |
| Medium | Service entities not linked | Services-page ItemList Services have no @id; detail pages define <url>#service | Add `"@id": "<detail url>#service"` to ItemList items so both refer to one entity |
| Medium | No WebPage/AboutPage/ContactPage nodes; breadcrumbs unattached | BreadcrumbList has no @id, nothing references it; contact has only breadcrumb | Add ContactPage (mainEntity -> /#organization) on contact, AboutPage on about, WebPage with `breadcrumb` ref, `isPartOf` -> /#website |
| Medium | sameAs thin and includes a Maps short link | sameAs = Facebook + maps.app.goo.gl link | Add LinkedIn/other real profiles if they exist; move maps URL to `hasMap` |
| Low | LocalBusiness missing recommended hours | no openingHoursSpecification (priceRange optional) | Add openingHoursSpecification (Mon-Fri) |
| Low | Org not linked to services | Org has no hasOfferCatalog/makesOffer | Add hasOfferCatalog -> services ItemList |
| Low | Phone format | "+66 65 509 2905" (spaces) vs tel:+66655092905 | Use "+66-65-509-2905" or E.164 |
| Low | Root URL redirects 307 -> /en | WebSite.url and Organization.url = https://www.smartalliance.co.th/ ; / -> 307 /en | Consider 308/permanent or point url at /en; site name works from domain root |
| Low | Axway Service on home and about | same @id, content per locale | Fine; keep the visible-content match |
| Info | Logo 500x114 | public/assets/logo.png | Passes (>=112x112); also provide a square logo if Knowledge Panel wanted |

## Consistency
Name "Smart Alliance", alt name Thai, address 599/36 Ratchadapisek Rd Chatuchak 10900, phone, email, geo, logo, sameAs all identical on all 10 pages and match visible footer/contact text (tel:, mailto:, facebook link, address).
Not validated against live Google Rich Results Test (localhost). Rich results available: Breadcrumb (valid), Organization logo, LocalBusiness; Service has none.
