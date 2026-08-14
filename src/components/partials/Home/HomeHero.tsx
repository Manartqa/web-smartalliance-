import { getTranslations } from "next-intl/server";

import { Hero, HERO_IMAGES } from "@/components/common/Hero";
import { BaseLinkButton } from "@/components/ui/Button";
import { ArrowRight } from "@/components/ui/Icon";

export default async function HomeHero() {
  const t = await getTranslations("home.hero");

  return (
    <Hero
      image={HERO_IMAGES.home}
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
