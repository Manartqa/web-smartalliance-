import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/common";
import {
  BUTTON_BASE_CLASS,
  BUTTON_VARIANT_CLASS,
} from "@/components/ui/Button/Button.config";
import { BaseCard } from "@/components/ui/Card";
import {
  Building,
  Calendar,
  ChevronRight,
  FileText,
  Search,
  Target,
} from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

import { CERTIFICATIONS } from "./Home.config";

/** Position in the card's rise-in sequence (see `.reveal-item` in globals.css). */
const step = (i: number) => ({ "--i": i }) as CSSProperties;

/** ISO certificates: view the PDF in a new tab. */
export default function HomeCertifications() {
  const t = useTranslations("home.certifications");
  const format = useFormatter();

  return (
    <section
      id="certifications"
      className="container-site scroll-mt-24 pb-16 lg:pb-28"
    >
      <Reveal className="mx-auto w-fit max-w-full">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#e9f0fc] via-[#f2f6fd] to-[#f8fafe] px-6 py-6 lg:px-8 lg:py-7">
          <Image
            src="/assets/card-dots.png"
            alt=""
            width={49}
            height={47}
            aria-hidden
            // The PNG has an opaque white ground; multiply drops it onto
            // the gradient so only the dots show.
            className="absolute right-3 top-3 h-12 w-auto opacity-70 mix-blend-multiply"
          />
          <h2 className="text-4xl font-bold leading-tight text-navy-deep lg:text-[3.5rem]">
            {t("heading")}
          </h2>
          <p className="mt-2 text-base font-light leading-relaxed text-body lg:text-lg">
            {t("subheading")}
          </p>
        </div>
      </Reveal>

      <ul className="mt-10 grid gap-6 lg:grid-cols-2">
        {CERTIFICATIONS.map((cert, index) => {
          const details = [
            {
              icon: Target,
              label: t("scope"),
              value: t(`items.${cert.key}.scope`),
            },
            {
              icon: FileText,
              label: t("certificateNo"),
              value: cert.certificateNo,
            },
            { icon: Building, label: t("issuer"), value: cert.issuer },
            {
              icon: Calendar,
              label: t("validUntil"),
              // Calendar date with no time; UTC keeps the server's zone from
              // shifting it a day.
              value: format.dateTime(new Date(cert.validUntil), {
                dateStyle: "long",
                timeZone: "UTC",
              }),
            },
          ];

          return (
            <li key={cert.key} className="flex">
              <Reveal delay={index * 150} className="flex w-full">
                <BaseCard className="group/card grid w-full gap-6 p-6 transition duration-300 hover:shadow-card-lg motion-safe:hover:-translate-y-1.5 sm:grid-cols-[10.5rem_1fr] sm:grid-rows-[1fr_auto] sm:p-7">
                  {/* Plain <a>, not the locale-aware Link: the PDF lives in
                      /public and must not get a /th or /en prefix. */}
                  <a
                    href={cert.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block w-44 self-start justify-self-center overflow-hidden rounded-lg border border-line shadow-card sm:w-full"
                  >
                    <Image
                      src={cert.thumbnail}
                      alt={t("thumbnailAlt", { standard: cert.standard })}
                      width={480}
                      height={679}
                      className="h-auto w-full transition-transform duration-500 motion-safe:group-hover/card:scale-105"
                    />
                    {/* Light sweep across the certificate on card hover. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 -left-2/3 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/70 to-transparent transition-transform duration-700 group-hover/card:translate-x-[400%] motion-reduce:hidden"
                    />
                  </a>

                  <div className="flex flex-col">
                    <span
                      style={step(0)}
                      className="reveal-item self-start rounded-full bg-[#e6efff] px-3 py-1 text-[13px] font-semibold text-blue-cta"
                    >
                      {cert.standard}
                    </span>
                    <h3
                      style={step(1)}
                      className="reveal-item mt-3 text-2xl font-bold leading-snug text-navy lg:text-[1.75rem]"
                    >
                      {t(`items.${cert.key}.title`)}
                    </h3>
                    <span
                      aria-hidden
                      className="mt-3 block h-1 w-14 rounded-sm bg-yellow transition-[width] duration-500 group-hover/card:w-24"
                    />
                    <p
                      style={step(2)}
                      className="reveal-item mt-3 text-base font-light leading-relaxed text-body"
                    >
                      {cert.name}
                    </p>

                    <dl className="mt-5 grid gap-4">
                      {details.map(({ icon: Icon, label, value }, row) => (
                        <div
                          key={label}
                          style={step(3 + row)}
                          className="reveal-item flex items-start gap-4"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef3fd] text-blue-cta transition-colors duration-300 group-hover/card:bg-[#e0eafc]">
                            <Icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <dt className="text-[15px] font-semibold text-navy">
                              {label}
                            </dt>
                            <dd className="text-sm font-light leading-relaxed text-body">
                              {value}
                            </dd>
                          </div>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div
                    style={step(3 + details.length)}
                    className="reveal-item flex flex-wrap justify-end gap-3 sm:col-span-2"
                  >
                    <a
                      href={cert.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        BUTTON_BASE_CLASS,
                        BUTTON_VARIANT_CLASS.navy,
                        "group/btn w-full text-sm sm:w-auto",
                      )}
                    >
                      <Search className="h-4 w-4" />
                      {t("view")}
                      <ChevronRight className="transition-transform group-hover/btn:translate-x-0.5" />
                    </a>
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
