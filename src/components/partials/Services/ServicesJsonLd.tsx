import { getTranslations } from "next-intl/server";

import { JsonLd } from "@/components/common";
import type { Locale } from "@/i18n/routing";
import { servicesGraph } from "@/lib/structured-data";

import { SERVICE_ITEMS } from "./Services.config";

/**
 * Structured data for the service cards in `ServicesDetail`.
 *
 * Lives beside the grid rather than in `common/` because it reads
 * `SERVICE_ITEMS` — the same list the grid renders from — so a service added to
 * the page is described in the markup automatically, and the two can never
 * disagree about which services exist.
 */
export default async function ServicesJsonLd({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "services.items" });

  const items = SERVICE_ITEMS.map(({ key }) => ({
    name: t(`${key}.title`),
    description: t(`${key}.body`),
  }));

  return <JsonLd data={servicesGraph(locale, items)} />;
}
