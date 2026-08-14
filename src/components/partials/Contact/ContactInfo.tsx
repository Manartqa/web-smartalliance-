import Image from "next/image";
import { useTranslations } from "next-intl";

import { siteConfig } from "@/config/site";

export default function ContactInfo() {
  const t = useTranslations("contact.info");

  // Built here rather than in the config file because three of the four notes
  // are translated strings.
  const items = [
    {
      key: "phone",
      icon: "/assets/cic-phone.png",
      value: siteConfig.phone,
      href: siteConfig.phoneHref,
      note: t("phoneNote"),
      external: false,
    },
    {
      key: "email",
      icon: "/assets/cic-mail.png",
      value: siteConfig.email,
      href: `mailto:${siteConfig.email}`,
      note: t("emailNote"),
      external: false,
    },
    {
      key: "address",
      icon: "/assets/cic-pin.png",
      value: siteConfig.address.building,
      href: siteConfig.mapsUrl,
      note: `${siteConfig.address.line1} ${siteConfig.address.line2}`,
      external: true,
    },
    {
      key: "website",
      icon: "/assets/cic-globe.png",
      value: siteConfig.website,
      href: siteConfig.url,
      note: null,
      external: true,
    },
  ] as const;

  return (
    <ul className="grid gap-7">
      {items.map((item) => (
        <li key={item.key} className="flex items-start gap-4">
          <Image
            src={item.icon}
            alt=""
            width={52}
            height={52}
            aria-hidden
            className="h-12 w-12 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.05em] text-body">
              {t(item.key)}
            </p>
            <a
              href={item.href}
              className="mt-0.5 block break-words text-[15px] font-semibold text-navy hover:underline"
              {...(item.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {item.value}
            </a>
            {item.note && (
              <p className="mt-0.5 text-[13px] font-light leading-relaxed text-body">
                {item.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
