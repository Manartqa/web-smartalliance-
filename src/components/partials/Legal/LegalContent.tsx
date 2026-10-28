import { getLocale, getTranslations } from "next-intl/server";

import { PageBody } from "@/components/common";
import { Hero, HERO_IMAGES } from "@/components/common/Hero";
import { siteConfig } from "@/config/site";

interface LegalSection {
  heading: string;
  paragraphs: string[];
  /** Bulleted list, rendered after the section's first paragraph. */
  items?: string[];
}

export type LegalDocument = "privacy" | "terms";

/**
 * The privacy policy and the terms and conditions: the same long-form layout,
 * with copy from `legal.<doc>` in `messages/*.json`. Sections are an array there
 * so each locale keeps the same structure — the catalogue test fails if one
 * side gains or loses a paragraph.
 *
 * Contact details come from `siteConfig`, not the copy, so they cannot fall
 * out of step with the contact page.
 */
export default async function LegalContent({ doc }: { doc: LegalDocument }) {
  const t = await getTranslations("legal");
  const locale = await getLocale();
  const sections = t.raw(`${doc}.sections`) as LegalSection[];

  return (
    <>
      <Hero
        image={HERO_IMAGES.about}
        label={t("label")}
        title={t(`${doc}.title`)}
        paragraph={t(`${doc}.paragraph`)}
      />
      <PageBody>
        <article className="container-site max-w-3xl pt-6 pb-16 lg:pt-2 lg:pb-24">
          <p className="text-sm font-medium text-body">{t(`${doc}.updated`)}</p>

          {sections.map((section, index) => (
            <section key={section.heading} className="mt-10">
              <h2 className="text-xl font-semibold text-navy lg:text-2xl">
                {index + 1}. {section.heading}
              </h2>
              {section.paragraphs.map((paragraph, p) => (
                <div key={p}>
                  <p className="mt-3 text-base font-light leading-relaxed text-ink">
                    {paragraph}
                  </p>
                  {p === 0 && section.items && (
                    <ul className="mt-3 list-disc space-y-2 pl-6 text-base font-light leading-relaxed text-ink marker:text-yellow">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          ))}

          <section className="mt-10 rounded-2xl bg-surface-muted p-6 lg:p-8">
            <h2 className="text-xl font-semibold text-navy lg:text-2xl">
              {t("contactHeading")}
            </h2>
            <p className="mt-3 text-base font-light leading-relaxed text-ink">
              {t(`${doc}.contactBody`)}
            </p>
            <address className="mt-3 text-base not-italic leading-relaxed text-ink">
              <strong className="font-semibold text-navy">
                {locale === "th"
                  ? siteConfig.legalNameTh
                  : siteConfig.legalName}
              </strong>
              <br />
              {siteConfig.address.building} {siteConfig.address.line1}{" "}
              {siteConfig.address.line2}
              <br />
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-blue-cta hover:underline"
              >
                {siteConfig.email}
              </a>
              {" · "}
              <a
                href={siteConfig.phoneHref}
                className="text-blue-cta hover:underline"
              >
                {siteConfig.phone}
              </a>
            </address>
          </section>
        </article>
      </PageBody>
    </>
  );
}
