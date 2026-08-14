import { getTranslations } from "next-intl/server";

import { Hero, HERO_IMAGES } from "@/components/common/Hero";

export default async function ContactHero() {
  const t = await getTranslations("contact.hero");

  return (
    <Hero
      image={HERO_IMAGES.contact}
      label={t("label")}
      title={
        <>
          {t("titleLine1")}
          <br />
          <span className="text-yellow">{t("titleLine2")}</span>
        </>
      }
      paragraph={t("paragraph")}
    />
  );
}
