import { getLocale, getTranslations } from "next-intl/server";

import { Hero, HERO_IMAGES } from "@/components/common/Hero";

export default async function ServicesHero() {
  const t = await getTranslations("services.hero");
  const locale = await getLocale();

  return (
    <Hero
      image={HERO_IMAGES.services}
      banner
      label={t("label")}
      title={t("title")}
      // The English title is about twice as long as the Thai one; at the
      // default size it wraps to three lines and makes this hero taller than
      // the home page's. At 36px it fits two (longest line 639px of 672px).
      titleClassName={
        locale === "en" ? "text-3xl sm:text-4xl lg:text-[2.25rem]" : undefined
      }
      paragraph={t("paragraph")}
      rule
    />
  );
}
