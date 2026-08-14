import Image from "next/image";
import { useTranslations } from "next-intl";

import { BaseCard } from "@/components/ui/Card";
import { BaseSectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/utils";

import {
  SERVICE_ITEMS,
  SERVICES_GRID_COLUMNS,
  SERVICES_LAST_ROW_START_CLASS,
} from "./Services.config";

export default function ServicesDetail() {
  const t = useTranslations("services");

  // 7 cards over 4 columns leaves 3 in the last row; offsetting that row's
  // first card centres it instead of letting it hang to the left.
  const remainder = SERVICE_ITEMS.length % SERVICES_GRID_COLUMNS;
  const lastRowFirstIndex = SERVICE_ITEMS.length - remainder;

  return (
    // Same as AboutDetail — the services hero ribbon is even deeper, so this
    // section starts almost flush against it (design: label 8px below the hero).
    <section className="container-site pt-6 pb-14 lg:pt-2 lg:pb-16">
      <div className="flex flex-col items-center text-center">
        <BaseSectionLabel>{t("label")}</BaseSectionLabel>
        <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight text-navy lg:text-[2.2rem]">
          {t("heading")}
        </h2>
        <p className="mt-4 max-w-3xl text-base font-light leading-relaxed text-body lg:text-lg">
          {t("subheading")}
        </p>
      </div>

      {/* 8 columns, each card spanning 2 — see SERVICES_LAST_ROW_START_CLASS. */}
      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-8">
        {SERVICE_ITEMS.map((service, index) => (
          <li
            key={service.key}
            className={cn(
              "flex lg:col-span-2",
              remainder > 0 &&
                index === lastRowFirstIndex &&
                SERVICES_LAST_ROW_START_CLASS[remainder],
            )}
          >
            <BaseCard className="relative flex w-full flex-col overflow-hidden p-8">
              <Image
                src="/assets/card-dots.png"
                alt=""
                width={49}
                height={47}
                aria-hidden
                className="absolute right-4 top-4 h-10 w-auto"
              />
              {/* Mockup centres the circle in the card (icirc left 111 in a
                  294-wide card) while title, rule and body stay flush left. */}
              <span className="flex h-[72px] w-[72px] items-center justify-center self-center rounded-full bg-[#e6efff]">
                <Image
                  src={service.icon}
                  alt=""
                  width={56}
                  height={56}
                  className="h-12 w-12 object-contain"
                />
              </span>
              <h3 className="mt-6 text-xl font-semibold leading-snug text-navy">
                {t(`items.${service.key}.title`)}
              </h3>
              <span
                aria-hidden
                className="mt-4 block h-1 w-14 rounded-sm bg-yellow"
              />
              <p className="mt-4 text-[15px] font-light leading-relaxed text-body">
                {t(`items.${service.key}.body`)}
              </p>
            </BaseCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
