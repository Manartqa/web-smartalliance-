import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { breadcrumbGraph } from "@/lib/structured-data";

import { JsonLd } from "./JsonLd";

type Crumb = "about" | "services" | "contact";

/**
 * Breadcrumb structured data for a second-level page. Google renders it as the
 * `smartalliance.co.th › Services` line above a result instead of the raw URL.
 *
 * The crumb labels come from the `nav` namespace, so they match the wording in
 * the header and translate with it.
 */
export async function BreadcrumbJsonLd({
  locale,
  page,
}: {
  locale: Locale;
  page: Crumb;
}) {
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <JsonLd
      data={breadcrumbGraph(
        locale,
        { name: t(page), path: `/${page}` },
        t("home"),
      )}
    />
  );
}
