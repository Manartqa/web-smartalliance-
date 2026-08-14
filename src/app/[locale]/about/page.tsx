import { setRequestLocale } from "next-intl/server";

import { BreadcrumbJsonLd } from "@/components/common";
import { AboutContent } from "@/components/partials/About";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return buildMetadata(locale, "about", "/about");
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <AboutContent />
      <BreadcrumbJsonLd locale={locale} page="about" />
    </>
  );
}
