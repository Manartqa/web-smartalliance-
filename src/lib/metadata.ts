import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site";
import { locales, type Locale } from "@/i18n/routing";

type PageKey = "home" | "about" | "services" | "contact";

/**
 * Builds per-page metadata plus the hreflang alternates that let search
 * engines pair the two language versions of the same page.
 */
export async function buildMetadata(
  locale: Locale,
  page: PageKey,
  path: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `meta.${page}` });

  const languages = Object.fromEntries(
    locales.map((l) => [l, `/${l}${path === "/" ? "" : path}`]),
  );

  return {
    // Every tab reads as the company name. The descriptive per-page titles in
    // `meta.*.title` are kept for Open Graph below, where the page context
    // still matters when a link is shared.
    title: siteConfig.name,
    description: t("description"),
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: `/${locale}${path === "/" ? "" : path}`,
      languages: { ...languages, "x-default": `/en${path === "/" ? "" : path}` },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `/${locale}${path === "/" ? "" : path}`,
      siteName: siteConfig.name,
      locale: locale === "th" ? "th_TH" : "en_US",
      type: "website",
    },
  };
}
