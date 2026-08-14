import Image from "next/image";
import type { ReactNode } from "react";

import { BaseSectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/utils";

import { HERO_RIBBON_CLEARANCE, type HeroRibbonVariant } from "./Hero.config";
import {
  HeroConstellation,
  HeroRibbon,
  HeroRibbonServices,
} from "./HeroDecor";

interface HeroProps {
  image: string;
  label?: string;
  title: ReactNode;
  paragraph: string;
  /** Services hero has a short yellow rule between title and paragraph. */
  rule?: boolean;
  actions?: ReactNode;
  /** Which of the mockup's two band treatments to draw at the hero's foot. */
  ribbon?: HeroRibbonVariant;
}

export default function Hero({
  image,
  label,
  title,
  paragraph,
  rule = false,
  actions,
  ribbon = "home",
}: HeroProps) {
  return (
    // `sticky top-0 z-0` pins the hero while <PageBody> scrolls over it.
    // It still occupies its full height in flow, so nothing below shifts.
    <section className="sticky top-0 z-0 overflow-hidden bg-hero-bg">
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-90"
      />
      {/* Keeps the copy legible over the photograph at every width. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-hero-bg via-hero-bg/85 to-hero-bg/40"
      />
      <HeroConstellation />

      <div
        className={cn(
          "container-site relative pt-16 sm:pt-20 lg:pt-28",
          HERO_RIBBON_CLEARANCE[ribbon],
        )}
      >
        <div className="max-w-2xl">
          {label && <BaseSectionLabel tone="yellow">{label}</BaseSectionLabel>}

          <h1
            className={cn(
              "text-4xl font-semibold leading-[1.15] text-white sm:text-5xl lg:text-[3.5rem]",
              label && "mt-5",
            )}
          >
            {title}
          </h1>

          {rule && (
            <span
              aria-hidden
              className="mt-6 block h-1 w-28 rounded-sm bg-yellow"
            />
          )}

          <p className="mt-6 max-w-xl font-jakarta text-base font-light leading-relaxed text-hero-para lg:text-lg">
            {paragraph}
          </p>

          {actions && (
            <div className="mt-9 flex flex-wrap items-center gap-4">
              {actions}
            </div>
          )}
        </div>
      </div>

      {ribbon === "services" ? <HeroRibbonServices /> : <HeroRibbon />}
    </section>
  );
}
