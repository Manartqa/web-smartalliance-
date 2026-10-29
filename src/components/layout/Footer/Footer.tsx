import Image from "next/image";
import { useTranslations } from "next-intl";

import { footerNavItems } from "@/config/site";
import { Link } from "@/i18n/navigation";

import { FOOTER_LEGAL_ITEMS, FOOTER_SOCIAL_ITEMS } from "./Footer.config";

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
              // Underline grows in from the left on hover and leaves to the
              // right: the origin flips with the hover state.
              className="relative py-1 text-sm font-medium text-white/80 transition-colors duration-300 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-right after:scale-x-0 after:rounded-full after:bg-yellow after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-white hover:after:origin-left hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:after:transition-none"
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
        <div className="container-site flex flex-col items-center gap-2 py-4 text-xs font-light text-white/70 sm:flex-row sm:justify-center sm:gap-6">
          <p className="text-center">{t("copyright")}</p>
          <div className="flex gap-4">
            {FOOTER_LEGAL_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="transition-colors hover:text-white"
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
