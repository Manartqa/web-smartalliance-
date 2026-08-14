import Image from "next/image";
import { useTranslations } from "next-intl";

import { footerNavItems } from "@/config/site";
import { Link } from "@/i18n/navigation";

import { FOOTER_SOCIAL_ITEMS } from "./Footer.config";

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer className="bg-navy-deep text-white">
      {/* Three equal columns rather than `justify-between`: with space-between
          the nav is centred in the *leftover* space, so it drifts by half the
          difference between the logo and social block widths. */}
      <div className="container-site flex flex-col items-center gap-8 py-10 lg:grid lg:grid-cols-3 lg:items-center lg:gap-6 lg:py-6">
        <Image
          src="/assets/logo-white.png"
          alt="Smart Alliance"
          width={192}
          height={64}
          className="h-14 w-auto lg:justify-self-start"
        />

        <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 lg:justify-self-center">
          {footerNavItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              {tNav(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 lg:justify-self-end">
          {FOOTER_SOCIAL_ITEMS.map(({ key, href, icon: Icon, external }) => (
            <a
              key={key}
              href={href}
              aria-label={t(key)}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              // white/60 over the footer's navy is exactly the #99a3b1 the
              // original bitmaps used.
              className="text-white/60 transition-colors hover:text-white"
            >
              <Icon />
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-[#003a75]">
        <p className="container-site py-4 text-center text-xs font-light text-white/40">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
