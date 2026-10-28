/**
 * WebP, not PNG: these are photographs, and PNG stores them losslessly at
 * ~1.6 MB each. `next/image` re-encodes to AVIF/WebP for the browser either
 * way, so the format here only decides what the optimizer reads and what the
 * build caches — 1.6 MB in, 127 KB in.
 */
export const HERO_IMAGES = {
  /** A finished banner: navy panel on the left for the copy, city on the right. */
  home: "/assets/hero-home-banner.webp",
  about: "/assets/hero-home.webp",
  /** A finished banner, like `home`. */
  services: "/assets/hero-services-banner.webp",
  /** A finished banner, like `home`. */
  contact: "/assets/hero-contact-banner.webp",
} as const;
