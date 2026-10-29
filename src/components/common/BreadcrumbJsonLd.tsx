import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import {
  breadcrumbGraph,
  organizationId,
  webPageGraph,
} from "@/lib/structured-data";

import { JsonLd } from "./JsonLd";

type Crumb = "about" | "services" | "contact";

/** What each second-level page is, as a schema.org page type. */
const PAGE_TYPES = {
  about: { type: "AboutPage", mainEntity: organizationId },
  contact: { type: "ContactPage", mainEntity: organizationId },
  services: { type: "CollectionPage", mainEntity: undefined },
} as const;

/**
 * Breadcrumb structured data for a second-level page. Google renders it as the
 * `smartalliance.co.th › Services` line above a result instead of the raw URL.
 * The page node beside it carries the breadcrumb and says what the page is.
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
  const path = `/${page}`;

  return (
    <>
      <JsonLd
        data={webPageGraph(locale, {
          ...PAGE_TYPES[page],
          name: t(page),
          path,
        })}
      />
      <JsonLd
        data={breadcrumbGraph(locale, { name: t(page), path }, t("home"))}
      />
    </>
  );
}
