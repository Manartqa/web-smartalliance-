import { defineRouting } from "next-intl/routing";

export const locales = ["en", "th"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  // Both locales carry a prefix: "/" redirects to "/en".
  localePrefix: "always",
});
