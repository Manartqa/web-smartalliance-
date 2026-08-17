export type HeroRibbonVariant = "home" | "services";

/** Bottom padding must clear the ribbon, which differs in height per variant. */
export const HERO_RIBBON_CLEARANCE: Record<HeroRibbonVariant, string> = {
  home: "pb-24 lg:pb-36",
  services: "pb-28 lg:pb-56",
};

/**
 * WebP, not PNG: these are photographs, and PNG stores them losslessly at
 * ~1.6 MB each. `next/image` re-encodes to AVIF/WebP for the browser either
 * way, so the format here only decides what the optimizer reads and what the
 * build caches — 1.6 MB in, 127 KB in.
 */
export const HERO_IMAGES = {
  home: "/assets/hero-home.webp",
  about: "/assets/hero-home.webp",
  services: "/assets/hero-service.webp",
  contact: "/assets/hero-contact.webp",
} as const;
