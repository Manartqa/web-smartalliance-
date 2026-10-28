import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { ABOUT_HERO_FACT_ICONS, ABOUT_HERO_IMAGE } from "./About.config";

interface HeroFact {
  label: string;
  value: string;
}

/**
 * The banner already carries the layout: flat navy on the left for the copy,
 * the building photograph on the right. Below `xl` the photo slides under the
 * copy, so a navy fade keeps the text legible there.
 *
 * From `xl` up the section grows with the viewport (a quarter of its width,
 * capped at 480px) so wide screens get a band rather than a thin strip; the
 * banner then crops a little top and bottom, kept above centre so the building
 * and its sign stay in frame. A min-height, not `aspect-ratio`: with a
 * max-height, `aspect-ratio` also caps the width and the hero stops short of
 * the edge.
 */
export default async function AboutHero() {
  const t = await getTranslations("about.hero");
  const facts = t.raw("facts") as HeroFact[];

  return (
    <section className="relative overflow-hidden bg-navy xl:flex xl:min-h-[min(25vw,480px)] xl:items-center">
      <Image
        src={ABOUT_HERO_IMAGE}
        alt=""
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover object-[65%_center] xl:object-[center_40%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/20 xl:hidden"
      />

      <div className="container-site relative py-10 lg:py-12">
        <div className="max-w-2xl">
          <p className="border-l-[3px] border-yellow pl-3 text-sm font-medium uppercase tracking-[0.08em] text-white/90">
            {t("label")}
          </p>
          <h1 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[2.9rem]">
            {t.rich("titleLine1", {
              highlight: (chunks) => (
                <span className="text-yellow">{chunks}</span>
              ),
            })}
            <br />
            {t("titleLine2")}
          </h1>
          <p className="mt-4 text-base text-hero-para lg:text-lg">
            {t("paragraph")}
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {facts.map((fact, i) => {
              const Icon = ABOUT_HERO_FACT_ICONS[i]!;
              return (
                <li
                  key={fact.label}
                  className="flex items-center gap-3 rounded-xl border border-white/30 bg-navy-deep/85 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur-sm"
                >
                  <Icon className="h-8 w-8 shrink-0 text-yellow" />
                  <div>
                    <p className="text-sm text-white/85">{fact.label}</p>
                    <p className="text-lg font-semibold leading-snug text-white">
                      {fact.value}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
