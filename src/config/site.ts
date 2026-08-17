/**
 * Single source of truth for company contact details and outbound links.
 * Everything here is locale-independent — translated labels live in messages/*.json.
 */
export const siteConfig = {
  name: "Smart Alliance Co.,Ltd.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.smartalliance.co.th",
  phone: "+66 65 509 2905",
  phoneHref: "tel:+66655092905",
  email: "admin@smartalliance.co.th",
  website: "www.smartalliance.co.th",
  address: {
    building: "Smart Alliance Building,",
    line1: "599/36 Ratchadapisek Road, Chatuchak Subdistrict, Chatuchak District,",
    line2: "Bangkok 10900, Thailand",
  },
  // Axway's own partner directory — where the partnership can be checked
  // against the vendor rather than taken on the site's word. Linked from the
  // partnership logo on the about page.
  //
  // The query string pre-filters the directory to Thailand, which is what puts
  // SMART Alliance on the first screen instead of somewhere in 74 countries.
  // It is a Drupal Views exposed filter (`method="get"`), and `2048` is Axway's
  // internal taxonomy id for Thailand — verified against the live page, but
  // their id, so it could change if they rebuild the site. Harmless if it does:
  // an unknown value just renders the unfiltered directory.
  axwayPartnerUrl:
    "https://www.axway.com/en/partners/find-partner?field_country_target_id_selective=2048",
  // Shared Google Maps pin for the office (supplied by the client).
  mapsUrl: "https://maps.app.goo.gl/wYu54GZAJY9FU5MY7",
  // Google's own id for the business listing, resolved from the share link
  // above (`!1s0x30e29e5d72156099:0x26f56fb15325db8d` → the second half as
  // decimal). The embed needs this rather than raw coordinates: given only a
  // lat/lng Google has no idea which place is meant and drops an unlabelled
  // pin, whereas `cid` renders the listing with its name.
  //
  // The /maps/place/* share link itself still cannot be framed (Google serves
  // it with X-Frame-Options), which is why the id is stored separately.
  mapsCid: "2807272750130256781",
  // Kept for structured data and as the fallback map centre.
  coords: { lat: 13.8284251, lng: 100.5469484 },
  social: {
    facebook: "https://www.facebook.com/smartalliance.co.th",
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
