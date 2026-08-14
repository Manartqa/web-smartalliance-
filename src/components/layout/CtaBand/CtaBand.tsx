import Image from "next/image";
import { useTranslations } from "next-intl";

import { BaseLinkButton } from "@/components/ui/Button";
import { ChevronRight } from "@/components/ui/Icon";

import {
  CTA_BAND_ICONS,
  CTA_BAND_STRIPES,
  type CtaBandVariant,
} from "./CtaBand.config";

interface CtaBandProps {
  /** Which copy block from `cta.*` in the messages file to render. */
  variant: CtaBandVariant;
  icon?: string;
}

export default function CtaBand({ variant, icon }: CtaBandProps) {
  const t = useTranslations(`cta.${variant}`);
  const tCta = useTranslations("cta");

  return (
    <section className="relative overflow-hidden bg-blue-cta">
      <svg
        aria-hidden
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <g stroke="#ffffff" strokeWidth="2" opacity=".08">
          {CTA_BAND_STRIPES.map((x) => (
            <line key={x} x1={x} y1="0" x2={x + 120} y2="120" />
          ))}
        </g>
      </svg>

      <div className="container-site relative flex flex-col items-center gap-6 py-10 text-center lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:py-6 lg:text-left">
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center">
          <Image
            src={icon ?? CTA_BAND_ICONS[variant]}
            alt=""
            width={72}
            height={72}
            className="h-16 w-16 shrink-0 object-contain"
          />
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold leading-snug text-white lg:text-xl">
              {t("heading")}
            </h2>
            <p className="mt-1 text-[15px] font-light leading-relaxed text-white/70">
              {t("body")}
            </p>
          </div>
        </div>

        <BaseLinkButton
          href="/contact"
          variant="yellow"
          className="shrink-0 uppercase text-[#013a85]"
        >
          {tCta("button")}
          <ChevronRight />
        </BaseLinkButton>
      </div>
    </section>
  );
}
