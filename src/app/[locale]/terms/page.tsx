import { setRequestLocale } from "next-intl/server";

import { LegalContent } from "@/components/partials/Legal";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return buildMetadata(locale, "terms", "/terms");
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LegalContent doc="terms" />;
}
