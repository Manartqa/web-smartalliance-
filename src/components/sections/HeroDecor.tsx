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
 * The angled white/yellow ribbon that separates the hero from the page body.
 * `preserveAspectRatio="none"` lets it stretch to any viewport width while
 * keeping a fixed visual height.
 */
export function HeroRibbon({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full lg:h-20 ${
        flip ? "scale-x-[-1]" : ""
      }`}
    >
      <polygon points="0,58 1440,10 1440,52 0,100" fill="#ffffff" />
      <polygon points="0,64 1440,16 1440,58 0,106" fill="#ffc300" />
      <polygon points="0,78 1440,30 1440,120 0,120" fill="#ffffff" />
    </svg>
  );
}
