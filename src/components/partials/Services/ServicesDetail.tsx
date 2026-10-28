import Image from "next/image";
import { useTranslations } from "next-intl";

import { Reveal } from "@/components/common";
import { BaseLinkButton } from "@/components/ui/Button";
import { BaseCard } from "@/components/ui/Card";
import { ArrowRight, Check } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

import {
  SERVICE_ITEMS,
  SERVICES_GRID_COLUMNS,
  SERVICES_LAST_ROW_SPAN_CLASS,
} from "./Services.config";

export default function ServicesDetail() {
  const t = useTranslations("services");

  // 7 cards over 4 columns leaves 3 in the last row; those stretch wider so the
  // row fills the full width instead of hanging to the left.
  const remainder = SERVICE_ITEMS.length % SERVICES_GRID_COLUMNS;
  const lastRowFirstIndex = SERVICE_ITEMS.length - remainder;

  return (
    // Same as AboutDetail — the hero ribbon above already supplies the
    // whitespace, so this section starts almost flush against it.
    <section className="container-site pt-6 pb-14 lg:pt-2 lg:pb-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex gap-4">
          <span aria-hidden className="w-1.5 shrink-0 rounded-full bg-yellow" />
          <div>
            <h2 className="text-3xl font-semibold leading-tight text-navy lg:text-[2.6rem]">
              {t("label")}
            </h2>
            <p className="mt-2 text-base text-body lg:text-lg">
              {t("heading")}
            </p>
          </div>
        </div>
        <p className="max-w-md border-l-2 border-line pl-5 text-base font-light leading-relaxed text-body">
          {t("subheading")}
        </p>
      </div>

      {/* 12 columns: a card spans 3, or wider in the last row — see
          SERVICES_LAST_ROW_SPAN_CLASS. */}
      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-12">
        {SERVICE_ITEMS.map((service, index) => {
          const title = t(`items.${service.key}.title`);
          const features = t.raw(`items.${service.key}.features`) as string[];

          return (
            <li
              key={service.key}
              className={cn(
                "flex",
                remainder > 0 && index >= lastRowFirstIndex
                  ? SERVICES_LAST_ROW_SPAN_CLASS[remainder]
                  : "lg:col-span-3",
              )}
            >
              {/* Cards bounce in one after another, like the reference site's
                  feature row; the stagger restarts per row of 4 on desktop. */}
              <Reveal
                delay={(index % SERVICES_GRID_COLUMNS) * 150}
                className="flex w-full"
              >
                <BaseCard className="relative flex w-full flex-col p-6 transition duration-300 hover:-translate-y-1.5 hover:shadow-card-lg">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-6 top-6 z-10 flex h-9 w-11 items-center justify-center rounded-lg text-sm font-semibold text-white shadow-sm",
                      service.accent,
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {/* Multiply drops the illustration's off-white backdrop into
                      the card's white. The left padding clears the number
                      badge, so in the narrow four-across cards the image
                      shrinks beside it instead of sliding underneath. */}
                  <div className="flex justify-center pl-12">
                    <Image
                      src={service.art}
                      alt=""
                      quality={90}
                      width={240}
                      height={150}
                      className="h-32 w-auto max-w-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-snug text-navy">
                    {title}
                  </h3>
                  <span
                    aria-hidden
                    className="mt-3 block h-1 w-12 rounded-sm bg-yellow"
                  />
                  <p className="mt-3 text-[15px] font-light leading-relaxed text-body">
                    {t(`items.${service.key}.body`)}
                  </p>
                  <ul className="mt-5 space-y-2 rounded-xl bg-surface-muted px-4 py-3.5">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-ink"
                      >
                        {/* Yellow, like the check list on the home page. */}
                        <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-yellow text-white">
                          <Check className="h-2 w-2.5" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    <BaseLinkButton
                      href={`/services/${service.slug}`}
                      variant="navy"
                      className="w-full"
                    >
                      {t("detail.viewDetails")}
                      <span className="sr-only">: {title}</span>
                      <ArrowRight />
                    </BaseLinkButton>
                  </div>
                </BaseCard>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
