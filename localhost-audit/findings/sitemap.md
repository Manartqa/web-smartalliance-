# Sitemap audit (localhost:3000, prod origin https://www.smartalliance.co.th)

Result: PASS (no critical/high/medium issues).

Checks
- XML valid, 26 URLs (13 pages x en/th), far below 50k/50MB limits. PASS
- All 26 <loc> map to localhost with HTTP 200, no redirects. PASS
- All 26 pages: self-referencing canonical equals <loc>, meta robots "index, follow", no X-Robots-Tag. PASS
- Coverage: routes (home, about, services, contact, privacy-policy, terms, services/[slug]) all listed; 7 service slugs match SERVICE_ITEMS. /[locale]/[...rest] is a 404 catch-all (correctly excluded). PASS
- xhtml:link alternates: en, th, x-default(en) on every entry, reciprocal, match page <head> hreflang. PASS
- robots.txt: "Sitemap: https://www.smartalliance.co.th/sitemap.xml", Allow / with Disallow /api/. PASS
- Bare "/" 307 -> /en (not listed; fine). "/en/" 308 -> /en (not listed; fine).

Findings
- Low | Home lastmod likely stale | sitemap.ts CONTENT_DATES.axwaySeo = 2026-08-17 for /en and /th, but home partials (Home.config.ts, HomeCertifications.tsx) and hero redesign commit 6b8fc69 changed on 2026-10-28 (plus uncommitted edits) | Bump the home entry to the real content-change date when shipping.
- Low | Contact lastmod possibly stale | contact = 2026-08-14 (launch) while branch feat/contact-form-backend changes the contact form | Bump when the form/copy ships.
- Info | priority/changefreq emitted | Google ignores both | Optional removal.
- Info | lastmod is hand-maintained constant | Dates are manual, not build time (good) but can drift | Keep updating CONTENT_DATES on content edits.
