import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { Hero } from "@/components/sections/Hero";
import { ContactForm } from "@/components/sections/ContactForm";
import { ContactInfo } from "@/components/sections/ContactInfo";
import { MapSection } from "@/components/sections/MapSection";
import { CtaBand } from "@/components/layout/CtaBand";
import { PageBody } from "@/components/layout/PageBody";
import { SectionLabel } from "@/components/ui/SectionLabel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return buildMetadata(locale, "contact", "/contact");
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <>
      <Hero
        image="/assets/hero-contact.png"
        label={t("hero.label")}
        title={
          <>
            {t("hero.titleLine1")}
            <br />
            <span className="text-yellow">{t("hero.titleLine2")}</span>
          </>
        }
        paragraph={t("hero.paragraph")}
      />

      <PageBody>
        <section className="container-site pt-8 pb-14 lg:pt-16 lg:pb-10">
          <div className="grid gap-14 lg:grid-cols-[1fr_420px] lg:gap-20">
            <div>
              <SectionLabel>{t("formLabel")}</SectionLabel>
              <h2 className="mt-4 max-w-lg text-2xl font-semibold leading-snug text-navy lg:text-[2rem]">
                {t("formHeading")}
              </h2>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>

            <div>
              <SectionLabel>{t("touchLabel")}</SectionLabel>
              <h2 className="mt-4 font-jakarta text-2xl font-semibold leading-snug text-navy lg:text-[2rem]">
                {t("touchHeading")}
              </h2>
              <div className="mt-8">
                <ContactInfo />
              </div>
            </div>
          </div>
        </section>

        <MapSection />
        <CtaBand variant="contact" />
      </PageBody>
    </>
  );
}
