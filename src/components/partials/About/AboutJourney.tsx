import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { BaseCard } from "@/components/ui/Card";
import { siteConfig } from "@/config/site";

import { ABOUT_ISO, ABOUT_TIMELINE_ICONS } from "./About.config";
import AboutHeading from "./AboutHeading";
import AboutTimeline from "./AboutTimeline";

interface Milestone {
  period: string;
  body: string;
}

/** Company timeline beside the ISO certificate and the Axway partnership. */
export default async function AboutJourney() {
  const t = await getTranslations("about");
  const milestones = t.raw("timeline.items") as Milestone[];

  return (
    <section className="bg-[#f4f8fe]">
      <div className="container-site grid gap-12 py-14 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:gap-10 lg:py-16">
        <div>
          <AboutHeading>{t("timeline.heading")}</AboutHeading>
          <AboutTimeline
            milestones={milestones.map((milestone, i) => {
              const Icon = ABOUT_TIMELINE_ICONS[i]!;
              return {
                ...milestone,
                icon: <Icon className="h-7 w-7 text-yellow" />,
              };
            })}
          />
        </div>

        <div>
          <AboutHeading>{t("standards.heading")}</AboutHeading>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            <li className="flex">
              <BaseCard className="flex w-full flex-col items-center p-5 text-center">
                <Image
                  src={ABOUT_ISO.thumbnail}
                  alt=""
                  width={120}
                  height={170}
                  className="h-20 w-auto rounded border border-line object-contain"
                />
                <p className="mt-3 font-semibold text-navy">
                  {ABOUT_ISO.standard}
                </p>
                <p className="mt-1 text-xs font-light leading-relaxed text-body">
                  {t("standards.isoBody")}
                </p>
                {/* Same PDF the home page's certification card opens. */}
                <a
                  href={ABOUT_ISO.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto pt-3 text-xs font-semibold text-blue-cta hover:underline"
                >
                  {t("standards.isoLink")}
                </a>
              </BaseCard>
            </li>
            <li className="flex">
              {/* `id` keeps `/about#axway` working — llms.txt and the
                  partnership structured data cite it. */}
              <BaseCard
                id="axway"
                className="flex w-full scroll-mt-24 flex-col items-center p-5 text-center"
              >
                {/* `rel="noopener noreferrer"` per SECURITY.md — every
                    outbound `target="_blank"` on this site carries it. */}
                <a
                  href={siteConfig.axwayPartnerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-20 items-center transition-opacity hover:opacity-75"
                >
                  <Image
                    src="/assets/axway.png"
                    alt={t("partnership.logoAlt")}
                    width={141}
                    height={65}
                    className="h-12 w-auto object-contain"
                  />
                </a>
                <p className="mt-3 font-semibold text-navy">
                  {t("standards.axwayTitle")}
                </p>
                <p className="mt-1 text-xs font-light leading-relaxed text-body">
                  {t("standards.axwayBody")}
                </p>
              </BaseCard>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
