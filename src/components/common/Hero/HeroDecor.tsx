const CONSTELLATION = [
  [180, 103, 329, 237, 0.06],
  [350, 381, 497, 277, 0.06],
  [42, 119, 180, 143, 0.09],
  [180, 103, 303, 160, 0.075],
  [310, 128, 454, 149, 0.09],
  [42, 119, 117, 225, 0.06],
  [90, 150, 240, 191, 0.075],
  [240, 221, 382, 251, 0.09],
  [30, 238, 147, 281, 0.075],
  [150, 311, 297, 332, 0.09],
  [290, 291, 419, 333, 0.075],
  [70, 361, 207, 391, 0.09],
  [200, 407, 357, 421, 0.075],
  [1050, 152, 1194, 211, 0.075],
  [1200, 176, 1315, 256, 0.09],
  [1100, 301, 1252, 333, 0.075],
  [1250, 294, 1387, 331, 0.09],
  [1080, 390, 1227, 411, 0.075],
  [1220, 381, 1364, 439, 0.09],
  [310, 149, 403, 297, 0.06],
  [1200, 176, 1298, 315, 0.06],
] as const;

/** Faint network lines behind the hero copy. Purely decorative. */
export function HeroConstellation() {
  return (
    <svg
      aria-hidden
      viewBox="0 80 1440 480"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <g stroke="#6699ff" strokeWidth="1.5" fill="none">
        {CONSTELLATION.map(([x1, y1, x2, y2, o], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} opacity={o} />
        ))}
      </g>
    </svg>
  );
}

/**
 * The angled ribbon that separates the hero from the page body.
 *
 * Polygon coordinates are copied verbatim from the mockup's second `.bands`
 * SVG, so the geometry is the design's, not an approximation: two white
 * ribbons that cross around 62% of the width, with a yellow ribbon paired to
 * one of them. The yellow therefore reads as a *wedge* — ~19px thick at the
 * left edge, tapering to nothing around x=830 — not a constant-width stripe.
 *
 * The viewBox crops the source SVG to the part that overlapped the hero
 * (source y 635–739; the mockup offset that SVG by -80px against the page).
 * `preserveAspectRatio="none"` keeps every proportion inside the box intact
 * while the box itself stretches to any viewport width.
 */
export function HeroRibbon() {
  return (
    <svg
      aria-hidden
      viewBox="0 635 1440 104"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full sm:h-16 lg:h-[104px]"
    >
      <polygon points="-62,814 2084,569 2102,729 -44,974" fill="#ffffff" />
      <polygon points="-171,655 1987,756 1979,918 -178,817" fill="#ffffff" />
      <polygon points="-163,661 1994,762 1987,923 -171,822" fill="#ffc300" />
      <polygon points="-165,684 1994,735 1990,897 -169,846" fill="#ffffff" />
    </svg>
  );
}

/**
 * The services hero uses a different pair of bands: a single yellow ribbon
 * under a single white one, both rising to the right. Here the yellow wedge is
 * thickest at the *right* edge (~21px) and tapers out toward the left, and the
 * white ribbon eats a much deeper diagonal slice out of the hero image.
 *
 * Source: the `.bands` SVG in services.html, cropped to y 555–740.
 */
export function HeroRibbonServices() {
  return (
    <svg
      aria-hidden
      viewBox="0 555 1440 185"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full sm:h-24 lg:h-[185px]"
    >
      <polygon points="1659,534 -488,772 -470,933 1677,695" fill="#ffc300" />
      <polygon points="1661,558 -489,761 -474,922 1677,719" fill="#ffffff" />
    </svg>
  );
}
