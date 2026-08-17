import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { axwayPartnershipGraph } from "@/lib/structured-data";

import { JsonLd } from "./JsonLd";

/**
 * Structured data for the Axway partnership card in `AboutDetail`.
 *
 * Rendered by the pages that show that card — home and about — so the markup
 * never claims a partnership section the page does not actually contain.
 *
 * Copy comes from the same `about.partnership` messages the card renders, which
 * is the rule Google checks: structured data has to match visible content.
 */
export async function PartnershipJsonLd({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "about.partnership" });

  return (
    <JsonLd
      data={axwayPartnershipGraph(locale, {
        name: t("serviceName"),
        description: t("body"),
      })}
    />
  );
}
