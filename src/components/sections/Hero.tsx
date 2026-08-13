import Image from "next/image";
import type { ReactNode } from "react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { HeroConstellation, HeroRibbon } from "./HeroDecor";

interface HeroProps {
  image: string;
  label?: string;
  title: ReactNode;
  paragraph: string;
  /** Services hero has a short yellow rule between title and paragraph. */
  rule?: boolean;
  actions?: ReactNode;
  ribbonFlip?: boolean;
}

export function Hero({
  image,
  label,
  title,
  paragraph,
  rule = false,
  actions,
  ribbonFlip = false,
}: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-hero-bg">
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

      <div className="container-site relative pt-16 pb-24 sm:pt-20 lg:pt-28 lg:pb-40">
        <div className="max-w-2xl">
          {label && <SectionLabel tone="yellow">{label}</SectionLabel>}

          <h1
            className={`text-4xl font-semibold leading-[1.15] text-white sm:text-5xl lg:text-[3.5rem] ${
              label ? "mt-5" : ""
            }`}
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

      <HeroRibbon flip={ribbonFlip} />
    </section>
  );
}
