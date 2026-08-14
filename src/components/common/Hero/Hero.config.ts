export type HeroRibbonVariant = "home" | "services";

/** Bottom padding must clear the ribbon, which differs in height per variant. */
export const HERO_RIBBON_CLEARANCE: Record<HeroRibbonVariant, string> = {
  home: "pb-24 lg:pb-36",
  services: "pb-28 lg:pb-56",
};

export const HERO_IMAGES = {
  home: "/assets/hero-home.png",
  about: "/assets/hero-home.png",
  services: "/assets/hero-service.png",
  contact: "/assets/hero-contact.png",
} as const;
