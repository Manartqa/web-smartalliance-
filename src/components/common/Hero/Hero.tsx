import Image from "next/image";
import type { ReactNode } from "react";

import { BaseSectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/utils";

import { HeroConstellation, HeroRibbon } from "./HeroDecor";

interface HeroProps {
  image: string;
  label?: string;
  title: ReactNode;
  /** Overrides the title's type size, for copy too long for the default. */
  titleClassName?: string;
  paragraph: string;
  /** Services hero has a short yellow rule between title and paragraph. */
  rule?: boolean;
  actions?: ReactNode;
  /**
   * The image is a finished banner with its own dark panel behind the copy.
   * From `lg` it shows at full strength, without the dimming gradient or the
   * constellation; narrower screens crop into the photo, so they keep both.
   */
  banner?: boolean;
}

export default function Hero({
  image,
  label,
  title,
  titleClassName,
  paragraph,
  rule = false,
  actions,
  banner = false,
}: HeroProps) {
  return (
    // `sticky top-0 z-0` pins the hero while <PageBody> scrolls over it.
    // It still occupies its full height in flow, so nothing below shifts.
    //
    // Every hero is at least as tall as the home page's (Thai copy: 463px on
    // phones, 494px on tablets, 608px from `lg`), with the copy centred in the
    // space above the ribbon, so pages with less copy match it rather than
    // coming up short. Copy that needs more room still grows the hero.
    <section className="sticky top-0 z-0 flex min-h-[463px] flex-col overflow-hidden bg-hero-bg sm:min-h-[494px] lg:min-h-[608px]">
      {/* The wrapper exists only to satisfy `next/image`. `fill` needs a
          positioned parent, and `sticky` *is* one — an absolutely positioned
          child resolves against it exactly like `relative` — but the dev-mode
          check accepts only absolute/fixed/relative, so it warns on every
          render. Same box, same stacking order, no warning. */}
      <div className="absolute inset-0">
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className={cn(
            "object-cover object-center opacity-90",
            // Leaning left pushes the yellow stripe clear of the paragraph.
            banner && "lg:object-[25%_center] lg:opacity-100",
          )}
        />
      </div>
      {/* Keeps the copy legible over the photograph at every width. A banner
          needs only a light shade on wide screens: it deepens the navy panel
          and tones down the stripe where the paragraph runs into it. */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-hero-bg via-hero-bg/85 to-hero-bg/40",
          banner &&
            "lg:from-hero-bg/60 lg:via-hero-bg/30 lg:via-55% lg:to-transparent lg:to-75%",
        )}
      />
      <div className={cn(banner && "lg:hidden")}>
        <HeroConstellation />
      </div>

      {/* Bottom padding clears the ribbon. */}
      <div className="container-site relative flex flex-1 flex-col justify-center pt-16 pb-24 sm:pt-20 lg:pt-28 lg:pb-36">
        <div className="max-w-2xl">
          {label && <BaseSectionLabel tone="yellow">{label}</BaseSectionLabel>}

          <h1
            className={cn(
              "text-4xl font-semibold leading-[1.15] text-white sm:text-5xl lg:text-[3.5rem]",
              label && "mt-5",
              titleClassName,
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

          <p
            className={cn(
              "mt-6 max-w-xl text-base font-light leading-relaxed text-hero-para lg:text-lg",
              // Thin grey type fades against the bright banner; a heavier
              // white with a soft shadow holds up over the stripe too.
              banner &&
                "font-normal text-white [text-shadow:0_1px_6px_rgb(10_14_39/0.75)]",
              // Narrow enough that the home page's Thai copy breaks after "ซอฟต์แวร์" (first
              // line 456px at 16px, 513px at 18px), keeping "เฉพาะทาง" off the
              // stripe; the catalogue's word joiner stops it splitting in two.
              banner && "max-w-[29.5rem] lg:max-w-[33rem]",
            )}
          >
            {paragraph}
          </p>

          {actions && (
            <div className="mt-9 flex flex-wrap items-center gap-4">
              {actions}
            </div>
          )}
        </div>
      </div>

      <HeroRibbon />
    </section>
  );
}
