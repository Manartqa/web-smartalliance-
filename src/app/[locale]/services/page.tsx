import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { Hero } from "@/components/sections/Hero";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { CtaBand } from "@/components/layout/CtaBand";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return buildMetadata(locale, "services", "/services");
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services.hero");

  return (
    <>
      <Hero
        image="/assets/hero-service.png"
        label={t("label")}
        title={t("title")}
        paragraph={t("paragraph")}
        rule
        ribbonFlip
      />
      <ServicesGrid />
      <CtaBand variant="services" />
    </>
  );
}
