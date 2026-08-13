import Image from "next/image";
import { useTranslations } from "next-intl";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Card } from "@/components/ui/Card";
import { siteConfig } from "@/config/site";

export function MapSection() {
  const t = useTranslations("contact.map");

  return (
    <section className="bg-surface-muted py-16 lg:py-20">
      <div className="container-site">
        <SectionLabel>{t("label")}</SectionLabel>
        <h2 className="mt-4 text-2xl font-semibold text-navy lg:text-[1.75rem]">
          {t("heading")}
        </h2>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* TODO: swap this static export for a Google Maps embed once the
              place ID / API key is available. */}
          <div className="overflow-hidden rounded-2xl shadow-card-lg">
            <Image
              src="/assets/map.png"
              alt={t("imageAlt")}
              width={784}
              height={360}
              sizes="(min-width: 1024px) 784px, 100vw"
              className="h-full w-full object-cover"
            />
          </div>

          <Card className="flex flex-col p-7">
            <h3 className="text-[15px] font-semibold text-navy">
              {siteConfig.name}
            </h3>

            <div className="mt-5 flex items-start gap-2.5">
              <Image
                src="/assets/card-pin.png"
                alt=""
                width={17}
                height={18}
                aria-hidden
                className="mt-0.5 h-4 w-4"
              />
              <p className="text-[13px] font-light leading-relaxed text-body">
                {siteConfig.address.line1} {siteConfig.address.line2}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              <Image
                src="/assets/card-phone.png"
                alt=""
                width={16}
                height={16}
                aria-hidden
                className="h-4 w-4"
              />
              <a
                href={siteConfig.phoneHref}
                className="text-[13px] font-light text-body hover:text-navy"
              >
                {siteConfig.phone}
              </a>
            </div>

            <a
              href={siteConfig.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center justify-center gap-2.5 rounded-[10px] border-[1.5px] border-navy bg-white px-4 py-3.5 text-center text-[11px] font-semibold uppercase leading-snug text-navy transition-colors hover:bg-navy hover:text-white"
            >
              <Image
                src="/assets/btn-map.png"
                alt=""
                width={16}
                height={16}
                aria-hidden
                className="h-4 w-4"
              />
              {t("directions")}
            </a>
          </Card>
        </div>
      </div>
    </section>
  );
}
