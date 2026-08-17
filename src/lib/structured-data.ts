import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/routing";

/**
 * JSON-LD builders.
 *
 * Emitted as a single `@graph` so the entities can reference each other by
 * `@id` instead of being repeated: the WebSite points at the Organization that
 * publishes it, and every page's breadcrumb points back at the same site. A
 * crawler reading any one page gets the whole company record.
 */

const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;
const AXWAY_BRAND_ID = `${siteConfig.url}/#axway`;
const AXWAY_SERVICE_ID = `${siteConfig.url}/#axway-partnership`;

/**
 * The partnership expertise, as `Organization.knowsAbout`.
 *
 * "Axway" only ever appears in prose on this site, which leaves a crawler to
 * infer from copy whether the company sells the product or merely mentions it.
 * `knowsAbout` states it as a fact on the company record, and travels with
 * every page because the record does.
 */
const AXWAY_EXPERTISE = [
  "Axway",
  "Axway API Management",
  "Axway Amplify",
  "Managed File Transfer (MFT)",
  "B2B Integration",
  "Enterprise application integration",
] as const;

const bcp47 = (locale: Locale) => (locale === "th" ? "th-TH" : "en-US");

/**
 * `siteConfig.address` is stored as display lines; schema.org wants the parts
 * separately, so they are spelled out here rather than parsed back apart.
 */
const postalAddress = {
  "@type": "PostalAddress",
  streetAddress: "599/36 Ratchadapisek Road",
  addressLocality: "Chatuchak",
  addressRegion: "Bangkok",
  postalCode: "10900",
  addressCountry: "TH",
} as const;

export function siteGraph(locale: Locale, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        // Two types, not one: `LocalBusiness` is what makes the address, geo
        // and phone below eligible for local results and the map pack — an
        // `Organization` alone carries the same fields but is read as a company
        // record, not a place of business.
        //
        // `LocalBusiness` directly, not the `ProfessionalService` subtype that
        // looks like a better fit: schema.org deprecated that one for being
        // confusable with `Service`, and none of the surviving subtypes
        // (Dentist, Attorney, Electrician…) describe a software company.
        "@type": ["Organization", "LocalBusiness"],
        "@id": ORGANIZATION_ID,
        name: siteConfig.name,
        alternateName: "Smart Alliance",
        url: siteConfig.url,
        description,
        foundingDate: String(siteConfig.foundedYear),
        areaServed: { "@type": "Country", name: "Thailand" },
        knowsAbout: [...AXWAY_EXPERTISE],
        email: siteConfig.email,
        telephone: siteConfig.phone,
        address: postalAddress,
        geo: {
          "@type": "GeoCoordinates",
          latitude: siteConfig.coords.lat,
          longitude: siteConfig.coords.lng,
        },
        logo: {
          "@type": "ImageObject",
          url: `${siteConfig.url}/assets/logo.png`,
        },
        // `LocalBusiness` results want an image, and a bare logo does not
        // qualify — Google asks for a photo of the business at a usable size.
        // The generated 1200×630 social card stands in until someone supplies a
        // photograph of the office; swap this for that photo when it exists.
        // (One card serves both locales: its copy is English by design.)
        image: {
          "@type": "ImageObject",
          url: `${siteConfig.url}/en/opengraph-image`,
          width: 1200,
          height: 630,
        },
        // `sameAs` is how Google links this record to the profiles it already
        // knows about, which is what earns a Knowledge Panel.
        sameAs: [siteConfig.social.facebook, siteConfig.mapsUrl],
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "sales",
            telephone: siteConfig.phone,
            email: siteConfig.email,
            areaServed: "TH",
            availableLanguage: ["en", "th"],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: `${siteConfig.url}/${locale}`,
        name: siteConfig.name,
        description,
        inLanguage: bcp47(locale),
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
  };
}

/**
 * The service catalogue as an ordered `ItemList` of `Service` nodes.
 *
 * An `ItemList` rather than seven loose nodes: it states that these are the
 * company's services *as a set* and in the order the page lists them, which is
 * what lets a crawler treat the page as the catalogue instead of guessing from
 * seven unrelated cards.
 *
 * Every entry's `provider` points back at the Organization already on the page,
 * so each service is attributed rather than floating.
 */
export function servicesGraph(
  locale: Locale,
  items: ReadonlyArray<{ name: string; description: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${siteConfig.url}/${locale}/services#catalogue`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: item.name,
        description: item.description,
        inLanguage: bcp47(locale),
        provider: { "@id": ORGANIZATION_ID },
        areaServed: { "@type": "Country", name: "Thailand" },
      },
    })),
  };
}

/**
 * The Axway partnership as a `Service` the company provides.
 *
 * Emitted on the two pages that carry the partnership card (home and about).
 * `provider` and `brand` are the point of it: they say Smart Alliance supplies
 * this, and that the thing supplied belongs to the Axway brand — which is what
 * separates "we resell Axway" from "we happen to name-drop Axway".
 *
 * `provider` is a bare `@id` reference; it resolves because the layout emits
 * `siteGraph()` — and with it the Organization node — on every page.
 */
export function axwayPartnershipGraph(
  locale: Locale,
  service: { name: string; description: string },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": AXWAY_SERVICE_ID,
    name: service.name,
    description: service.description,
    serviceType: "Axway API Management and Managed File Transfer",
    inLanguage: bcp47(locale),
    provider: { "@id": ORGANIZATION_ID },
    brand: {
      "@type": "Brand",
      "@id": AXWAY_BRAND_ID,
      name: "Axway",
      url: "https://www.axway.com",
    },
    areaServed: { "@type": "Country", name: "Thailand" },
  };
}

/**
 * Breadcrumbs for a second-level page. Home is always the first crumb, so
 * callers pass only the page itself.
 */
export function breadcrumbGraph(
  locale: Locale,
  page: { name: string; path: string },
  homeName: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: homeName,
        item: `${siteConfig.url}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.name,
        item: `${siteConfig.url}/${locale}${page.path}`,
      },
    ],
  };
}
