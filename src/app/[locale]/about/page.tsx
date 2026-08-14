import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { Hero } from "@/components/sections/Hero";
import { AboutSection } from "@/components/sections/AboutSection";
import { CtaBand } from "@/components/layout/CtaBand";
import { PageBody } from "@/components/layout/PageBody";
import { LinkButton } from "@/components/ui/Button";
import { ArrowRight } from "@/components/ui/icons";

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
  const t = await getTranslations("about.hero");

  return (
    <>
      <Hero
        image="/assets/hero-home.png"
        title={
          <>
            {t("titleLine1")}
            <br />
            <span className="text-yellow">{t("titleLine2")}</span>
          </>
        }
        paragraph={t("paragraph")}
        actions={
          <>
            <LinkButton href="/services" variant="yellow" className="uppercase">
              {t("primaryCta")}
              <ArrowRight />
            </LinkButton>
            <LinkButton href="/contact" variant="outline" className="uppercase">
              {t("secondaryCta")}
            </LinkButton>
          </>
        }
      />
      <PageBody>
        <AboutSection />
        <CtaBand variant="home" />
      </PageBody>
    </>
  );
}
