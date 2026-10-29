import Image from "next/image";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";

import { HERO_IMAGES } from "@/components/common/Hero";
import { BaseLinkButton } from "@/components/ui/Button";
import { BaseCard } from "@/components/ui/Card";
import { ArrowRight, ChevronRight } from "@/components/ui/Icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import {
  SERVICE_DETAIL_SECTIONS,
  SERVICE_ITEMS,
  type ServiceItem,
} from "./Services.config";

interface Capability {
  title: string;
  items: string[];
}

interface ProcessStep {
  title: string;
  body: string;
}

/**
 * One service's detail page: hero with in-page tabs, then the overview,
 * capabilities and process sections beside a sidebar with a consult card and
 * links to the other services.
 *
 * Per-service copy, highlights and process steps included, lives under
 * `services.items.<key>`; the sidebar copy is shared across services under
 * `services.detail`.
 */
export default async function ServiceDetailContent({
  service,
}: {
  service: ServiceItem;
}) {
  const t = await getTranslations("services");
  const locale = await getLocale();

  const index = SERVICE_ITEMS.findIndex(({ key }) => key === service.key);
  const title = t(`items.${service.key}.title`);
  const capabilities = t.raw(
    `items.${service.key}.capabilities`,
  ) as Capability[];
  const highlights = t.raw(
    `items.${service.key}.highlights`,
  ) as string[];
  const process = t.raw(`items.${service.key}.process`) as ProcessStep[];

  // The Thai page carries the English service name under its title, as the
  // mockup does; on the English page it would only repeat the title.
  const tEn = await getTranslations({ locale: "en", namespace: "services" });
  const englishTitle =
    locale === "en" ? null : tEn(`items.${service.key}.title`);

  return (
    <>
      <section className="bg-gradient-to-b from-[#eaf1fd] via-[#f4f8fe] to-white">
        <div className="container-site pt-6 pb-10 lg:pt-8 lg:pb-12">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-9 w-11 items-center justify-center rounded-lg text-sm font-semibold text-white shadow-sm",
                    service.accent,
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium uppercase tracking-[0.08em] text-navy">
                  {t("detail.eyebrow")}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-navy sm:text-4xl lg:text-5xl">
                {title}
              </h1>
              {englishTitle && (
                <p lang="en" className="mt-2 text-lg text-body lg:text-xl">
                  ({englishTitle})
                </p>
              )}
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink lg:text-lg">
                {t(`items.${service.key}.body`)}
              </p>
            </div>
            {/* Multiply drops the illustration's off-white backdrop into the
                hero's gradient. A fixed box, so every service's hero is the
                same height whatever its illustration's proportions. */}
            <Image
              src={service.art}
              alt=""
              quality={90}
              width={480}
              height={300}
              priority
              className="mx-auto h-56 w-full max-w-md object-contain mix-blend-multiply lg:h-64"
            />
          </div>

          <nav aria-label={title} className="mt-8">
            <ul className="grid grid-cols-3 overflow-hidden rounded-xl border border-line bg-white shadow-card">
              {SERVICE_DETAIL_SECTIONS.map(({ id, icon: Icon }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="flex h-full flex-col items-center justify-center gap-2 px-2 py-4 text-center text-sm font-medium text-ink transition-colors hover:bg-navy hover:text-white sm:flex-row sm:gap-3"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {t(`detail.tabs.${id}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <div className="container-site grid gap-10 pb-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:pb-24">
        <div className="space-y-14">
          <section id="overview" className="scroll-mt-28">
            <SectionHeading>{t("detail.tabs.overview")}</SectionHeading>
            <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <p className="text-base font-light leading-relaxed text-ink">
                {t(`items.${service.key}.overview`)}
              </p>
              <ul className="grid grid-cols-2 gap-1 self-start rounded-2xl bg-[#f1f6fd] p-2">
                {highlights.map((highlight, i) => {
                  const Icon = service.highlightIcons[i]!;
                  return (
                    <li
                      key={highlight}
                      className="flex items-center gap-3 p-3 text-sm font-medium leading-snug text-navy"
                    >
                      <Icon className="h-8 w-8 shrink-0 text-blue-cta" />
                      {highlight}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <section id="capabilities" className="scroll-mt-28">
            <SectionHeading>{t("detail.tabs.capabilities")}</SectionHeading>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {capabilities.map((capability, i) => {
                const Icon = service.capabilityIcons[i]!;
                return (
                  <li key={capability.title} className="flex">
                    <BaseCard className="w-full p-5">
                      <Icon className="h-9 w-9 text-blue-cta" />
                      <h3 className="mt-4 font-semibold leading-snug text-navy">
                        {capability.title}
                      </h3>
                      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-snug text-ink marker:text-blue-cta">
                        {capability.items.map((entry) => (
                          <li key={entry}>{entry}</li>
                        ))}
                      </ul>
                    </BaseCard>
                  </li>
                );
              })}
            </ul>
          </section>

          <section id="process" className="scroll-mt-28">
            <SectionHeading>{t("detail.tabs.process")}</SectionHeading>
            <ol className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
              {process.map((step, i) => (
                <li key={step.title}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-semibold leading-snug text-navy">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm font-light leading-relaxed text-body">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6 self-start lg:sticky lg:top-28">
          <div className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white">
            <Image
              src={HERO_IMAGES.home}
              alt=""
              fill
              sizes="340px"
              className="object-cover opacity-30"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-navy via-navy/90 to-navy/50"
            />
            <div className="relative">
              <h2 className="text-xl font-semibold leading-snug">
                {t("detail.consult.title")}
              </h2>
              <p className="mt-3 text-sm font-light leading-relaxed text-hero-para">
                {t("detail.consult.body")}
              </p>
              <BaseLinkButton href="/contact" className="mt-5 w-full">
                {t("detail.consult.button")}
                <ArrowRight />
              </BaseLinkButton>
            </div>
          </div>

          <BaseCard className="p-5">
            <SectionHeading size="sm">{t("detail.related")}</SectionHeading>
            <ul className="mt-3 divide-y divide-line">
              {SERVICE_ITEMS.filter(({ key }) => key !== service.key).map(
                (other) => (
                  <li key={other.key}>
                    <Link
                      href={`/services/${other.slug}`}
                      className="flex items-center gap-3 py-3 text-sm text-ink transition-colors hover:text-navy"
                    >
                      <Image
                        src={other.art}
                        alt=""
                        quality={90}
                        width={64}
                        height={44}
                        className="h-10 w-14 shrink-0 object-contain mix-blend-multiply"
                      />
                      <span className="flex-1">
                        {t(`items.${other.key}.title`)}
                      </span>
                      <ChevronRight className="h-2.5 w-auto shrink-0 text-body" />
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </BaseCard>
        </aside>
      </div>
    </>
  );
}

function SectionHeading({
  children,
  size = "lg",
}: {
  children: ReactNode;
  size?: "sm" | "lg";
}) {
  return (
    <div>
      <h2
        className={cn(
          "font-semibold text-navy",
          size === "lg" ? "text-2xl lg:text-[1.75rem]" : "text-lg",
        )}
      >
        {children}
      </h2>
      <span aria-hidden className="mt-2 block h-1 w-10 rounded-sm bg-yellow" />
    </div>
  );
}
