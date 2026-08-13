import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { footerNavItems, siteConfig } from "@/config/site";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  const socials = [
    {
      key: "facebook",
      href: siteConfig.social.facebook,
      icon: "/assets/social-fb.png",
      external: true,
    },
    {
      key: "email",
      href: `mailto:${siteConfig.email}`,
      icon: "/assets/social-mail.png",
      external: false,
    },
    {
      key: "phone",
      href: siteConfig.phoneHref,
      icon: "/assets/social-phone.png",
      external: false,
    },
  ] as const;

  return (
    <footer className="bg-navy-deep text-white">
      <div className="container-site flex flex-col items-center gap-8 py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:py-6">
        <Image
          src="/assets/logo-white.png"
          alt="Smart Alliance"
          width={192}
          height={64}
          className="h-14 w-auto"
        />

        <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
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

        <div className="flex items-center gap-2">
          {socials.map((s) => (
            <a
              key={s.key}
              href={s.href}
              aria-label={t(s.key)}
              {...(s.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="transition-opacity hover:opacity-80"
            >
              <Image src={s.icon} alt="" width={38} height={38} />
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
