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

/** `priority` is relative within this site only; it never compares to others. */
const PAGES = [
  { path: "", priority: 1, changeFrequency: "monthly" },
  { path: "/about", priority: 0.8, changeFrequency: "yearly" },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
] as const satisfies ReadonlyArray<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}>;

const url = (locale: string, path: string) =>
  `${siteConfig.url}/${locale}${path}`;

export default function sitemap(): MetadataRoute.Sitemap {
  // Build time, not request time — the pages are statically prerendered, so
  // that is genuinely when their content last changed.
  const lastModified = new Date();

  return locales.flatMap((locale) =>
    PAGES.map(({ path, priority, changeFrequency }) => ({
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
