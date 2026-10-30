# Performance / Core Web Vitals - localhost:3000 (next dev)

Estimated production Performance (CWV) score: 78/100 (estimate, not measured).

## Method and limits
- Lab CWV could not be measured. PSI cannot reach localhost (script returned a rate-limit/empty result) and the Lighthouse CLI run was blocked by the permission system. No LCP/INP/CLS/TBT numbers are reported.
- Measured: dev TTFB via curl (0.69s /th, 0.94s /about, 1.00s /services, 0.97s /services/data-analytics, 1.03s /contact; dev-only, pages use setRequestLocale so they are statically rendered in prod). Dev HTML is 176-248 KB uncompressed (includes inline RSC payload and JSON-LD).
- Measured: next/image optimizer output (AVIF): hero-home-banner 12.9 KB @640w, 19.6 KB @828w, 70.9 KB @1920w; hero-about (q90) 88.7 KB @1920w; svc-art-data-v2 (q90) 25 KB @1080w; logo.png 8.4 KB. These are good.
- No Lighthouse, no field data (CrUX) for localhost.

## Findings
| Severity | Title | Evidence | Fix |
|---|---|---|---|
| High | 739 KB animated WebP launcher loads eagerly on every page | `SmartMascot` uses a plain `<img src="/assets/mascot-smart-wave-sm.webp">` (241x240, 738,788 B), rendered by `SmartChat` in the root layout, no lazy/idle deferral, bypasses next/image. It downloads in parallel with the hero image on every page (hero is only ~13-71 KB AVIF), so it delays LCP on slow mobile and adds continuous animation decode. | Re-encode to <=120 KB (fewer frames/fps, lossy q~60, or 2x-only palette), or render a static first frame (`mascot-smart.webp`, 55 KB) first and swap to the animation after `load`/idle. |
| Medium | 2 MB animated WebP fetched on chat open | `mascot-smart-wave.webp` = 1,997,664 B (561x560), used by `SmartChatWindow` (only mounted when open, good). Opening the chat on mobile data stalls the screen and burns bandwidth; the Notice also reuses the 739 KB `sm`. | Cut to <=400 KB, or serve as video (WebM/MP4 muted loop) which is typically 5-10x smaller; prefetch on launcher hover/focus. |
| Medium | reCAPTCHA v3 loads on page render of /contact | `ContactForm.tsx:257` `<Script strategy="afterInteractive">` loads google.com/recaptcha/api.js (+ gstatic payload, badge iframe) as soon as the page hydrates, competing with the Maps iframe and hurting TBT/INP. Only active when `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set. | Load the script on first form focus/pointerdown (or `lazyOnload`), keep `getRecaptchaToken` rejecting gracefully if not yet loaded (await load on submit). |
| Medium | Google Maps embed is a heavy third party | `ContactMap.tsx` iframe `loading="lazy"` (good) but it is far above the fold only on desktop (lg two-column, short sections); pulls ~1 MB+ JS from google.com when near viewport, contributing to main-thread work. Container has fixed aspect-ratio so no CLS. | Click-to-load facade (static map image + button), or keep lazy and add `fetchpriority=low`. Low risk if left as is. |
| Low | Hero is a sticky full-viewport `fill` image with `sizes="100vw"` | LCP candidate on every page; correctly `priority` and preloaded with full srcset (640..3840w). Request path is good. `Hero` uses default q75; `AboutHero` q90 (88 KB). The 3840w srcset entry is chosen only by very large DPR screens. | Fine. Optional: `quality={60-70}` on mobile banners; limit `deviceSizes` to drop 3840. |
| Low | Fonts: 5 weights x 2 families, all `display: swap` | `lib/fonts.ts`; next/font self-hosts, only 2 woff2 files preloaded (`.p.` files), size-adjusted fallbacks auto-generated, so CLS from swap is minimal. Thai fallback glyph swap can still shift lines slightly. | OK. If Thai LCP text jitters, add `adjustFontFallback` check; drop weight 300/700 if unused. |
| Low | Auto-advancing client carousel | `AboutClientsCarousel` runs `setInterval` smooth scroll every 2s, pauses on hover/focus and reduced-motion; no layout reads in render. Small continuous main-thread cost, no CLS (images have width/height). | Pause when offscreen via IntersectionObserver. |
| Low | CLS sources reviewed: none significant | All `next/image` have width/height or `fill` in sized parents; Cookie notice and chat launcher are `position: fixed` (no flow shift); Maps frame has aspect-ratio; hero has min-height. | Keep dimensions on future images. |
| Info | Unused/legacy assets | `public/assets` 6.9 MB total; PNG icons and old `hero-home.webp` (188 KB), `hero-contact.webp`, `hero-service.webp`, `svc-*.png` may be orphaned (e.g. `HERO_IMAGES.about` points to hero-home.webp while AboutHero uses hero-about.webp). No runtime cost unless referenced. | Delete unreferenced files (do not touch without confirmation). |
| Info | Dev-only noise | HMR client, unminified Turbopack chunks, 0.7-1.0s TTFB, 16 script tags are dev artifacts and are not expected in production. | Re-run PSI/Lighthouse mobile against the deployed URL. |

## Verdict
The core page path (LCP hero via optimized AVIF + preload, fonts, CLS hygiene) is well built. The main risks to field CWV are the two oversized animated WebP mascot files and third-party scripts on /contact. Fixing the 739 KB launcher mascot is the single highest-impact change.
