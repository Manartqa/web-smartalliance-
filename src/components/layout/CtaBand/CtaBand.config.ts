export type CtaBandVariant = "home" | "services" | "contact";

/** Which icon each `cta.*` copy block ships with by default. */
export const CTA_BAND_ICONS: Record<CtaBandVariant, string> = {
  home: "/assets/ic-mail-circle.png",
  services: "/assets/cta-share.png",
  contact: "/assets/cta-handshake.png",
};

/** x-offsets of the decorative diagonals drawn across the band. */
export const CTA_BAND_STRIPES = [0, 224, 448, 672, 896, 1121] as const;
