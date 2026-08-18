export type CtaBandVariant = "home" | "services" | "contact";

/** Which icon each `cta.*` copy block ships with by default. */
export const CTA_BAND_ICONS: Record<CtaBandVariant, string> = {
  home: "/assets/ic-mail-circle.png",
  services: "/assets/cta-share.png",
  contact: "/assets/cta-handshake.png",
};

/**
 * Whether the band ends in a "Contact Smart Alliance" button.
 *
 * False on the contact variant: that button links to /contact, and the only
 * page rendering this variant is /contact itself. A link to the page you are
 * already on is noise at best, and on mobile it sits directly above the form it
 * would scroll you to.
 *
 * A `Record` rather than an inline `variant !== "contact"` so that adding a
 * fourth variant is a decision someone has to make rather than one they inherit.
 */
export const CTA_BAND_HAS_BUTTON: Record<CtaBandVariant, boolean> = {
  home: true,
  services: true,
  contact: false,
};

/** x-offsets of the decorative diagonals drawn across the band. */
export const CTA_BAND_STRIPES = [0, 224, 448, 672, 896, 1121] as const;
