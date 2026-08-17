import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { locales } from "@/i18n/routing";

/**
 * Sitemap for every locale × page pair.
 *
 * Each entry carries the full `alternates.languages` set, which is what tells
 * Google that `/en/about` and `/th/about` are the same page in two languages
 * rather than duplicate content competing with each other. The `<head>`
 * hreflang tags say the same thing, but only to a crawler that already found
 * the page — the sitemap says it up front.
 */

/**
 * `lastModified` is the date that page's *content* last changed — bump it by
 * hand when the copy does.
 *
 * It used to be the build timestamp, which made every deploy claim all eight
 * URLs had changed. A crawler that recrawls on that promise and finds identical
 * bytes learns to stop believing the field, so the one page that really did
 * change gets recrawled no sooner than the rest.
 */
const CONTENT_DATES = {
  /** Axway keyword pass: titles, descriptions and partnership markup. */
  axwaySeo: "2026-08-17",
  /** Launch content. */
  launch: "2026-08-14",
} as const;

/** `priority` is relative within this site only; it never compares to others. */
const PAGES = [
  {
    path: "",
    priority: 1,
    changeFrequency: "monthly",
    lastModified: CONTENT_DATES.axwaySeo,
  },
  {
    path: "/about",
    priority: 0.8,
    changeFrequency: "yearly",
    lastModified: CONTENT_DATES.axwaySeo,
  },
  {
    path: "/services",
    priority: 0.9,
    changeFrequency: "monthly",
    lastModified: CONTENT_DATES.axwaySeo,
  },
  {
    path: "/contact",
    priority: 0.7,
    changeFrequency: "yearly",
    lastModified: CONTENT_DATES.launch,
  },
] as const satisfies ReadonlyArray<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  lastModified: string;
}>;

const url = (locale: string, path: string) =>
  `${siteConfig.url}/${locale}${path}`;

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    PAGES.map(({ path, priority, changeFrequency, lastModified }) => ({
      url: url(locale, path),
      lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries([
          ...locales.map((l) => [l, url(l, path)]),
          ["x-default", url("en", path)],
        ]),
      },
    })),
  );
}
