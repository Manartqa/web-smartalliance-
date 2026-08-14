import { getTranslations } from "next-intl/server";

import { Hero, HERO_IMAGES } from "@/components/common/Hero";

export default async function ServicesHero() {
  const t = await getTranslations("services.hero");

  return (
    <Hero
      image={HERO_IMAGES.services}
      label={t("label")}
      title={t("title")}
      paragraph={t("paragraph")}
      rule
      ribbon="services"
    />
  );
}
