import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * `/api/` is disallowed because nothing under it is a page: the contact
 * endpoint only answers POST, so a crawler that fetches it gets a 405 and
 * spends crawl budget on an error. Everything else is open.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
