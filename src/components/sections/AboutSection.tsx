import Image from "next/image";
import { useTranslations } from "next-intl";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Card } from "@/components/ui/Card";
import { Check } from "@/components/ui/icons";

const POINTS = [
  "experience",
  "custom",
  "integration",
  "projects",
  "delivery",
] as const;

const STATS = [
  { key: "experience", icon: "/assets/ic-badge.png" },
  { key: "projects", icon: "/assets/stat-users.png" },
  { key: "delivery", icon: "/assets/stat-box.png" },
  { key: "partner", icon: "/assets/stat-shield.png" },
] as const;

export function AboutSection() {
  const t = useTranslations("about");

  return (
    // Top padding is deliberately tiny: the hero ribbon above already supplies
    // the whitespace (design puts this section's label 7px below the hero).
    // Mobile gets a little more because the ribbon scales down with the width.
    <section className="container-site pt-6 pb-16 lg:pt-2 lg:pb-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left column — narrative + checklist */}
        <div>
          <SectionLabel>{t("label")}</SectionLabel>

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

          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow text-white">
                  <Check />
                </span>
                {/* leading-6 makes the first line box exactly as tall as the
                    24px icon, so the two centre on each other with no nudge —
                    and a label that wraps still starts level with the icon. */}
                <span className="text-[15px] font-medium leading-6 text-navy">
                  {t(`points.${point}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column — partnership card + stat grid */}
        <div className="flex flex-col gap-10">
          <Card className="p-7">
            <h3 className="text-xl font-semibold text-navy">
              {t("partnership.heading")}
            </h3>
            <p className="mt-3 text-[15px] font-light leading-relaxed text-body">
              {t("partnership.body")}
            </p>
            <div className="mt-7 flex items-center gap-6">
              <Image
                src="/assets/axway.png"
                alt="Axway"
                width={141}
                height={65}
                className="h-14 w-auto object-contain"
              />
              <span aria-hidden className="h-14 w-px bg-[#d8dee8]" />
              <span className="text-[15px] font-semibold uppercase leading-snug text-navy">
                {t("partnership.badge")}
              </span>
            </div>
          </Card>

          <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-4">
            {STATS.map((stat) => (
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
