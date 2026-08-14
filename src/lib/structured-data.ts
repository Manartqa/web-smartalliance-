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
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: siteConfig.name,
        alternateName: "Smart Alliance",
        url: siteConfig.url,
        description,
        foundingDate: String(siteConfig.foundedYear),
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
