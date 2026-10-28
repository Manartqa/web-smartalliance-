import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { JsonLd } from "@/components/common";
import {
  SERVICE_ITEMS,
  ServiceDetailContent,
} from "@/components/partials/Services";
import type { Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/metadata";
import { breadcrumbGraph, serviceGraph } from "@/lib/structured-data";

type Params = Promise<{ locale: Locale; slug: string }>;

// Only the seven services exist; any other slug is a 404, not a render.
export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICE_ITEMS.map(({ slug }) => ({ slug }));
}

const findService = (slug: string) =>
  SERVICE_ITEMS.find((service) => service.slug === slug);

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, slug } = await params;
  const service = findService(slug);
  if (!service) notFound();

  const t = await getTranslations({ locale, namespace: "services" });

  return buildMetadata(
    locale,
    {
      title: t("detail.metaTitle", {
        service: t(`items.${service.key}.title`),
      }),
      description: t(`items.${service.key}.body`),
    },
    `/services/${slug}`,
  );
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Params;
}) {
  const { locale, slug } = await params;
  const service = findService(slug);
  if (!service) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "services.items" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const name = t(`${service.key}.title`);
  const path = `/services/${slug}`;

  return (
    <>
      <ServiceDetailContent service={service} />
      <JsonLd
        data={breadcrumbGraph(
          locale,
          [
            { name: nav("services"), path: "/services" },
            { name, path },
          ],
          nav("home"),
        )}
      />
      <JsonLd
        data={serviceGraph(locale, {
          name,
          description: t(`${service.key}.body`),
          path,
        })}
      />
    </>
  );
}
