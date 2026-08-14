/**
 * Single source of truth for company contact details and outbound links.
 * Everything here is locale-independent — translated labels live in messages/*.json.
 */
export const siteConfig = {
  name: "Smart Alliance Co., Ltd.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.smartalliance.co.th",
  phone: "+66 5 509 2905",
  phoneHref: "tel:+6655092905",
  email: "info@smartalliance.co.th",
  website: "www.smartalliance.co.th",
  address: {
    building: "Smart Alliance Building,",
    line1: "599/36 Ratchadapisek Road, Chatuchak Subdistrict, Chatuchak District,",
    line2: "Bangkok 10900, Thailand",
  },
  // Shared Google Maps pin for the office (supplied by the client).
  mapsUrl: "https://maps.app.goo.gl/wYu54GZAJY9FU5MY7",
  // Resolved from the share link above. Kept as raw coordinates because the
  // short link cannot be framed — Google serves /maps/place/* with
  // X-Frame-Options, so the embed has to target the coordinates instead.
  coords: { lat: 13.8284251, lng: 100.5469484 },
  social: {
    // TODO: replace with the real Facebook page URL.
    facebook: "https://www.facebook.com/",
  },
  foundedYear: 2004,
} as const;

export const navItems = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "contact", href: "/contact" },
] as const;

export const footerNavItems = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "contact", href: "/contact" },
] as const;
