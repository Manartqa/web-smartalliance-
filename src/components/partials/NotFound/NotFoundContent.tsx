import { useTranslations } from "next-intl";

import { PageBody } from "@/components/common";
import { BaseLinkButton } from "@/components/ui/Button";

/**
 * The 404 screen.
 *
 * No hero image: this page is reached by accident, and the sticky-hero layout
 * the real pages use would put the one thing the visitor needs — the way out —
 * below the fold. Header and Footer still come from the locale layout, so the
 * full navigation is present regardless.
 *
 * `useTranslations` rather than `getTranslations`: Next does not pass `params`
 * to a `not-found` boundary, so there is no locale to hand the server API. The
 * hook reads the locale the layout already resolved.
 */
export default function NotFoundContent() {
  const t = useTranslations("notFound");

  return (
    <PageBody>
      <section className="container-site flex flex-col items-center py-24 text-center lg:py-32">
        <span className="text-[64px] font-bold leading-none text-yellow lg:text-[88px]">
          {t("code")}
        </span>

        <h1 className="mt-6 text-3xl font-semibold leading-tight text-navy lg:text-[2.5rem]">
          {t("title")}
        </h1>

        <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-body">
          {t("body")}
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <BaseLinkButton href="/">{t("home")}</BaseLinkButton>
          <BaseLinkButton href="/services" variant="navyOutline">
            {t("services")}
          </BaseLinkButton>
          <BaseLinkButton href="/contact" variant="navyOutline">
            {t("contact")}
          </BaseLinkButton>
        </div>
      </section>
    </PageBody>
  );
}
