import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { BaseLinkButton } from "@/components/ui/Button";
import { ArrowRight } from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";

import { ABOUT_EXPERTISE, ABOUT_OFFICE_IMAGE } from "./About.config";
import AboutHeading from "./AboutHeading";

/**
 * Office photo, the company introduction, and the four areas of expertise.
 * Three columns on wide screens; below `xl` the expertise cards drop to a row
 * of their own under the photo and text.
 */
export default async function AboutIntro() {
  const t = await getTranslations("about");
  const locale = await getLocale();

  return (
    <section className="container-site py-14 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-2 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,1.25fr)] xl:gap-8">
        {/* From `lg` the photo fills the height of its row, so it matches the
            text beside it instead of leaving a gap underneath. The narrower
            crop keeps the sign and the desks on the right in frame. */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl lg:aspect-auto lg:min-h-80">
          <Image
            src={ABOUT_OFFICE_IMAGE}
            alt=""
            fill
            sizes="(min-width: 1280px) 340px, (min-width: 1024px) 50vw, 100vw"
            className="object-cover object-[70%_center]"
          />
        </div>

        <div className="lg:self-center">
          <p className="border-l-[3px] border-yellow pl-3 text-sm font-medium uppercase tracking-[0.06em] text-navy">
            {t("intro.label")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-snug text-navy">
            {locale === "th" ? siteConfig.legalNameTh : siteConfig.legalName}
          </h2>
          <p className="mt-4 text-[15px] font-light leading-relaxed text-body">
            {t("intro.body")}
          </p>
          <BaseLinkButton href="/services" className="mt-6">
            {t("intro.cta")}
            <ArrowRight />
          </BaseLinkButton>
        </div>

        <div className="lg:col-span-2 xl:col-span-1">
          <AboutHeading subheading={t("expertise.subheading")}>
            {t("expertise.heading")}
          </AboutHeading>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2">
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
        </div>
      </div>
    </section>
  );
}
