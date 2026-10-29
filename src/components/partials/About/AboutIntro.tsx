import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { BaseLinkButton } from "@/components/ui/Button";
import { ArrowRight } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";

import { ABOUT_EXPERTISE, ABOUT_OFFICE_IMAGES } from "./About.config";
import AboutHeading from "./AboutHeading";
import AboutOfficeSlideshow from "./AboutOfficeSlideshow";

/**
 * Office photos (a slideshow), the company introduction, and the four areas of
 * expertise, with the services button under the expertise cards. From `lg`
 * the photos and the expertise share a row, and the introduction runs the full
 * width under both; below `lg` everything stacks, introduction straight after
 * the photos.
 */
export default async function AboutIntro() {
  const t = await getTranslations("about");
  const locale = await getLocale();

  return (
    <section className="container-site py-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-y-3 xl:gap-x-12">
        {/* Landscape, the photos' own shape, so each shows whole rather than
            as a tall crop. From `xl` it stretches to the expertise column
            beside it, so both end level; narrower, that column's wrapped cards
            would stretch it to portrait. */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl xl:aspect-auto">
          <AboutOfficeSlideshow
            images={ABOUT_OFFICE_IMAGES}
            sizes="(min-width: 1024px) 560px, 100vw"
          />
        </div>

        <div className="lg:order-last lg:col-span-2">
          <p className="border-l-[3px] border-yellow pl-3 text-sm font-medium uppercase tracking-[0.06em] text-navy">
            {t("intro.label")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-snug text-navy">
            {locale === "th" ? siteConfig.legalNameTh : siteConfig.legalName}
          </h2>
          <p className="mt-4 text-[15px] font-light leading-relaxed text-body">
            {t("intro.body")}
          </p>
        </div>

        <div>
          <AboutHeading subheading={t("expertise.subheading")}>
            {t("expertise.heading")}
          </AboutHeading>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {ABOUT_EXPERTISE.map(({ key, service }) => (
              <li key={key} className="flex">
                <Link
                  href={`/services/${service.slug}`}
                  className="flex w-full items-start gap-3 rounded-xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <Image
                    src={service.art}
                    alt=""
                    quality={90}
                    width={64}
                    height={44}
                    className="h-10 w-14 shrink-0 object-contain mix-blend-multiply"
                  />
                  <span>
                    <span className="block text-sm font-semibold leading-snug text-navy">
                      {t(`expertise.items.${key}.title`)}
                    </span>
                    <span className="mt-1 block text-xs font-light leading-relaxed text-body">
                      {t(`expertise.items.${key}.body`)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <BaseLinkButton
            href="/services"
            className="mx-auto mt-6 flex w-fit lg:mx-0"
          >
            {t("intro.cta")}
            <ArrowRight />
          </BaseLinkButton>
        </div>
      </div>
    </section>
  );
}
