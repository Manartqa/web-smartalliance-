import { getTranslations } from "next-intl/server";

import { Hero, HERO_IMAGES } from "@/components/common/Hero";
import { BaseLinkButton } from "@/components/ui/Button";
import { ArrowRight } from "@/components/ui/Icon";

export default async function AboutHero() {
  const t = await getTranslations("about.hero");

  return (
    <Hero
      image={HERO_IMAGES.about}
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
          <BaseLinkButton href="/services" variant="yellow" className="uppercase">
            {t("primaryCta")}
            <ArrowRight />
          </BaseLinkButton>
          <BaseLinkButton href="/contact" variant="outline" className="uppercase">
            {t("secondaryCta")}
          </BaseLinkButton>
        </>
      }
    />
  );
}
