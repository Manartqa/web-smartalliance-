import { defineRouting } from "next-intl/routing";

export const locales = ["en", "th"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  // Both locales carry a prefix: "/" redirects to "/en".
  localePrefix: "always",
  // Always land on English: ignore the browser's Accept-Language and the
  // NEXT_LOCALE cookie, so a Thai browser no longer sends "/" to "/th".
  localeDetection: false,
  // No `Link` response header: its x-default would be "/", a redirect. The
  // page head and the sitemap already carry the alternates, x-default "/en".
  alternateLinks: false,
});
