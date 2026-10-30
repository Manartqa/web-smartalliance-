# Technical SEO + On-Page audit - localhost:3000 (Next.js 16 dev)

Scores: Technical SEO 82/100, On-Page SEO 85/100.
Scope: 26 sitemap URLs (13 routes x en/th) all fetched. All return 200, index,follow, self-canonical, hreflang en/th/x-default, SSR/SSG HTML (x-nextjs-prerender: 1), viewport set, <html lang> correct, 0 images without alt.

## Passes
- robots.txt: valid, allows all, disallows /api/ only, repeats rule inside AI-bot groups, Sitemap line present (production domain).
- sitemap.xml: 26 URLs = every real route; each carries xhtml hreflang en/th/x-default; sitemap_discovery.py: valid urlset. No orphan or missing routes.
- Titles: 26/26 unique, descriptions 26/26 unique (no cross-page or cross-locale duplicates).
- Canonicals self-referencing and locale-specific; trailing slash 308 to clean URL; unknown paths 404 with noindex.
- Old WordPress redirects (next.config.ts:92-97): /products-smartalliance, /about-us, /service-support, /contact-us all 308 to the right /th page.
- Internal links: every page links to all 12 other routes (header/footer); no broken internal hrefs; locale switcher is a real <a hreflang> to the same route.
- Security headers present: X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, CSP (report-only), HSTS only when NODE_ENV=production (next.config.ts:70-77, verify on prod).
- JSON-LD: Organization+LocalBusiness+WebSite graph on every page, BreadcrumbList+Service on service pages.

## Findings
| Sev | Title | Evidence | Fix |
|---|---|---|---|
| Medium | `Link` HTTP header emits a conflicting hreflang x-default | `curl -I /en` -> `Link: <http://localhost:3000/>; hreflang="x-default"` (next-intl middleware, src/proxy.ts, src/i18n/routing.ts). HTML/sitemap say x-default = /en. `/` is a 307, and the header host comes from the request (proxy host in prod) | Add `alternateLinks: false` to `defineRouting` in src/i18n/routing.ts; HTML + sitemap already carry hreflang |
| Medium | Apex domain not redirected to www | DEPLOYMENT.md:32 nginx `server_name` serves both www and smartalliance.co.th; only :80->https 301 | Add nginx 301 smartalliance.co.th -> https://www... (canonical mitigates, but duplicates crawl and link equity) |
| Medium | Invisible U+2060 word-joiner in title and H1 of Digital Workflow pages | en/th /services/digital-workflow-e-services: `<title>` and `<h1>` contain `e-⁠Services` | Remove U+2060 from messages/*.json (service title); use nobreak CSS if wrapping is the aim |
| Low | Many EN descriptions exceed 160 chars | home 178, services 177, IT-infra 175, digital-workflow 172, API 171, custom-sw 166, about 163 | Trim to <=155 chars (messages/en.json meta.*) |
| Low | Terms descriptions too short | en terms 101, th terms 75 chars | Expand to 120-155 chars |
| Low | Thai titles long | th IT-infra 85 chars, th about 77, th home 78 (suffix "Smart Alliance (สมาร์ท อัลลายแอนส์)" on every page) | Drop the Thai transliteration from the title suffix on long titles to avoid SERP truncation |
| Low | Home H1 text duplicated in DOM | `<h1>` = sr-only copy + aria-hidden typewriter ghost; textContent reads "Beyond Software. We Build Solutions.Beyond Software.We Build Solutions." (th home too) | Keep one text node in the H1; make the typewriter span `aria-hidden` and outside the H1, or use only the animated span with the real text |
| Low | Soft 404 titles | /en/nope and /th/nope `<title>404</title>`; duplicate `<meta name=robots>` (noindex + noindex,follow) | Give not-found a descriptive title (src/app/[locale]/not-found.tsx); status 404 already correct |
| Low | Redirect chains on legacy URLs | `/about-us/` -> 308 `/about-us` -> 308 `/th/about`; `/careers` 307 -> `/en/careers` 404 | Acceptable. Optionally add trailing-slash variants as direct sources; `/careers` ends as 404 as intended |
| Low | Root `/` redirect is 307 and sets NEXT_LOCALE cookie | `curl -I /` -> 307 /en; `/fr` -> 307 /en/fr (404) | Fine for crawlers (x-default = /en); consider 308 for `/` if locale detection is never wanted |
| Low | OG/Twitter card identical on all pages, English text on /th | og:image = /{locale}/opengraph-image for every page (src/lib/metadata.ts:51-57) | Per-page cards or a Thai-capable font (known, commented in opengraph-image.tsx) |
| Info | OG image route returns 500 in dev only | `/en/opengraph-image`, `/th/opengraph-image`, twitter-image -> 500 "Input buffer contains unsupported image format" (sharp inside @vercel/og). Existing prod build holds a valid 61 KB PNG (.next/server/app/en/opengraph-image.body, signature 89504E47) | Not a prod defect. Re-run `next build` and curl the card on the deployed host to confirm 200 image/png |
| Info | `Host:` line in robots.txt | robots.ts output `Host: https://www...` | Ignored by Google; harmless (Yandex legacy) |
| Info | sitemap changefreq/priority | all URLs | Ignored by Google; lastmod is the useful field (keep accurate; home 2026-08-17 vs others 2026-10-28) |
| Info | CSP is Report-Only | next.config.ts:42 | Move to enforcing after reviewing reports; `script-src 'unsafe-inline'` should be replaced by a nonce |
| Info | No manifest.webmanifest | 404 | Optional |
| Info | Dev-only, not reported as defects | no-cache headers, unminified JS, localhost host in Link header, no HSTS | n/a |

## Heading structure
Single H1 per page, no skipped levels (H1>H2>H3). Home: H1, 3 H2, 4 H3. Services index: H1, 2 H2, 7 H3. Service detail: H1, 5 H2, 9 H3 (H3 "Dashboards & reports" repeats in capabilities and process on data-analytics; minor). Legal pages: H1 + 10-11 H2.

## Performance hints from source
Hero image preloaded (hero-home-banner.webp, next/image priority, sizes 100vw); below-fold images lazy with width/height set (low CLS risk). Page HTML 108-248 KB uncompressed (includes RSC payload); 21 script tags on home. Contact iframe lazy. Verify real LCP/INP with a production build and PSI.
