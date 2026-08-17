import Image from "next/image";
import { useTranslations } from "next-intl";

import { BaseCard } from "@/components/ui/Card";
import { siteConfig } from "@/config/site";
import { Check } from "@/components/ui/Icon";
import { BaseSectionLabel } from "@/components/ui/SectionLabel";

import { ABOUT_POINTS, ABOUT_STATS } from "./About.config";

/** Split down the middle: the first half fills column one, the rest column two. */
const POINT_COLUMNS = [
  ABOUT_POINTS.slice(0, Math.ceil(ABOUT_POINTS.length / 2)),
  ABOUT_POINTS.slice(Math.ceil(ABOUT_POINTS.length / 2)),
];

/** Company overview. Shared by the home page and the about page. */
export default function AboutDetail() {
  const t = useTranslations("about");

  return (
    // Top padding is deliberately tiny: the hero ribbon above already supplies
    // the whitespace (design puts this section's label 7px below the hero).
    // Mobile gets a little more because the ribbon scales down with the width.
    <section className="container-site pt-6 pb-16 lg:pt-2 lg:pb-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left column — narrative + checklist */}
        <div>
          <BaseSectionLabel>{t("label")}</BaseSectionLabel>

          <h2 className="mt-6 text-3xl font-semibold leading-tight text-navy lg:text-[2.75rem]">
            {t("headingLine1")}
            <br className="hidden sm:block" />{" "}
            <span className="whitespace-nowrap">
              {t("headingLine2")} <span className="text-yellow">{t("year")}</span>
            </span>
          </h2>

          <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-body">
            {t("body")}
          </p>

          <h3 className="mt-10 text-lg font-semibold text-navy">
            {t("whyHeading")}
          </h3>

          {/* Two independent lists rather than one two-column grid: grid rows
              share a height, so a label that wraps to two lines pushes the
              *other* column's next item down with it and the 40px rhythm the
              mockup uses breaks. Separate lists keep each column's gap even. */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {POINT_COLUMNS.map((column, index) => (
              <ul key={index} className="grid content-start gap-4">
                {column.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow text-white">
                      <Check />
                    </span>
                    {/* leading-6 makes the first line box exactly as tall as
                        the 24px icon, so the two centre on each other with no
                        nudge — and a label that wraps still starts level with
                        the icon. */}
                    <span className="text-[15px] font-medium leading-6 text-navy">
                      {t(`points.${point}`)}
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* Right column — partnership card + stat grid */}
        <div className="flex flex-col gap-10">
          {/* `id` makes the partnership a linkable target (`/about#axway`),
              which is what a citation of the Axway relationship can point at. */}
          <BaseCard id="axway" className="scroll-mt-24 p-7">
            <h3 className="text-xl font-semibold text-navy">
              {t("partnership.heading")}
            </h3>
            <p className="mt-3 text-[15px] font-light leading-relaxed text-body">
              {t("partnership.body")}
            </p>
            <div className="mt-7 flex items-center gap-6">
              {/* Links to Axway's own partner directory: the claim on this card
                  is checkable at the vendor rather than only asserted here.
                  `rel="noopener noreferrer"` per SECURITY.md — every outbound
                  `target="_blank"` on this site carries it. */}
              <a
                href={siteConfig.axwayPartnerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 shrink-0 items-center transition-opacity hover:opacity-75"
              >
                <Image
                  src="/assets/axway.png"
                  // Not just "Axway": the logo is the only place the
                  // partnership is stated as a relationship rather than
                  // implied, and this doubles as the link's accessible name.
                  alt={t("partnership.logoAlt")}
                  width={141}
                  height={65}
                  className="h-14 w-auto object-contain"
                />
              </a>
              <span aria-hidden className="h-14 w-px bg-[#d8dee8]" />
              <span className="text-[15px] font-semibold uppercase leading-snug text-navy">
                {t("partnership.badge")}
              </span>
            </div>
          </BaseCard>

          <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-4">
            {ABOUT_STATS.map((stat) => (
              <li
                key={stat.key}
                className="flex flex-col items-center gap-3 text-center"
              >
                <Image
                  src={stat.icon}
                  alt=""
                  width={48}
                  height={48}
                  className="h-11 w-11 object-contain"
                />
                <span className="text-[15px] font-semibold leading-snug text-navy">
                  {t(`stats.${stat.key}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
