# Visual / mobile audit (static source analysis, no screenshots)

Method note: capture_screenshot.py with CLAUDE_SEO_LOCAL_TARGETS=localhost:3000 failed for all four viewports
(Page.goto net::ERR_FAILED on http://localhost:3000/th, server itself returns HTTP 200). No screenshots were saved.
Findings below come from the source (Tailwind classes, tokens) and computed contrast ratios; rendered pixel
positions and overlaps are estimates and need confirming in a real browser.

| Severity | Title | Evidence | Fix |
|---|---|---|---|
| High (unverified) | Cookie notice + chat mascot consume ~45% of a 375x812 first view | CookieNotice.tsx: fixed bottom, z-50, py-5, title + text-sm Thai body (~230 chars, ~5 lines) + 41px button stacked (estimated 230-260px). SmartChat.tsx: mascot h-28 (112px) sits above it via --cookie-notice-height. Together ~370-390px of 812px. Hero CTAs (min-h 463px hero) may be partly covered by the mascot at right-4. | Make the notice a compact one-line-plus-button bar on mobile (shorter copy, or button inline); hide or shrink the mascot (h-16) until the notice is accepted; verify CTA row is not under the mascot. |
| Medium | Form inputs are 14px, triggering iOS zoom on focus | ui/Input INPUT_BASE_CLASS: text-sm (14px) on all contact inputs/textarea | Use text-base (16px) on mobile (text-base sm:text-sm). |
| Medium | Low-contrast footer legal line | Footer.tsx:61 text-xs font-light text-white/40 on #001a3d = 3.73:1 (AA needs 4.5:1 for 12px) | Use text-white/70 or higher. |
| Medium | Placeholder / privacy hint text fails contrast | text-placeholder #9ca3af: 2.54:1 on white (ContactForm.tsx:244, text-xs), 2.41:1 on field bg #f9f9f9 (input placeholders) | Darken placeholder to about #6b7280 (4.8:1) or darker; do not use it for informative text. |
| Medium | Small tap targets | Cookie accept and all BaseButton: py-3.5 + 13px leading-none = ~41px tall (below 44-48px). LocaleSwitcher TH/EN links: 13px text, no padding, ~20x22px (below WCAG 2.2 24px), adjacent in header. Footer social icons: bare icons, no padding. Contact map button text-[11px]. | Min height 44px on buttons (py-4 or min-h-11); give locale links p-2 / min-h-11 min-w-11; pad social icons; raise 11px label to 12-13px. |
| Medium | Primary "Contact" CTA hidden on mobile header | Header.tsx: HEADER_CONTACT_CTA_CLASS wrapped in hidden lg:flex; on <lg it only exists inside the hamburger drawer. Hero has secondary CTA, so not fatal. | Acceptable if hero CTAs are visible above fold; otherwise add a compact Contact button next to the hamburger. |
| Low | Light-weight small grey text | Many text-xs/13px font-light text-body (#6b7280): 4.83:1 on white (pass), 4.59:1 on #f8f9fb (pass barely); weight 300 at 12px renders thin, especially Thai. | Use font-normal for text-xs body copy; min 14px for paragraphs. |
| Low | Icon placeholder contrast | AboutClientsCarousel.tsx:129 text-body/50 on surface-muted = 1.93:1 (decorative placeholder only) | Ignore if purely decorative (aria-hidden). |
| Low | Sticky hero + overlay layering | Hero sticky z-0; header z-50 and cookie notice z-50 share the same layer; chat launcher z-40 | Fine; keep notice above header only if intentional. |

## Passes (from source)
- Viewport meta present; container-site uses 1.25rem gutters on mobile; hero text uses max-w and wraps; no fixed widths over 375px found (not render-verified, so horizontal overflow is untested).
- H1 in hero: text-4xl (36px) mobile, 56px desktop; CTA buttons are in the hero (flex-wrap), Header CTA visible at lg+ (>=1024px).
- Contrast OK: navy on yellow 8.66:1, #0a0f1a on yellow 11.9:1, hero paragraph #cad4e1 on #0a0e27 12.7:1, cookie body white/85 on navy-deep 12.7:1, ink/70 nav links 5.55:1, red-600 errors 4.83:1.
- Hamburger button is h-11 w-11 (44px). Thai line-height 1.7 applied globally.
- Base body text 16px (hero paragraph text-base), mobile nav links text-base.

## Not verified (needs real browser)
Actual first-view layout at 375 and 1440, mascot/CTA overlap, horizontal scroll on /th/about, /th/services,
/th/services/data-analytics, /th/contact, /en, services card art (svc-art-*-v2.webp) rendering.
