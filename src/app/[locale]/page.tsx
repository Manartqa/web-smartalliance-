import { setRequestLocale } from "next-intl/server";

import { PartnershipJsonLd } from "@/components/partials/About";
import { HomeContent } from "@/components/partials/Home";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return buildMetadata(locale, "home", "/");
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HomeContent />
      <PartnershipJsonLd locale={locale} />
    </>
  );
}
