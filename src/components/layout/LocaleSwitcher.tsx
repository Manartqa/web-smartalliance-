"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";

interface LocaleSwitcherProps {
  className?: string;
}

/**
 * Swaps the locale segment while staying on the current route.
 * `usePathname` from next-intl returns the path with the locale prefix already
 * stripped, so re-linking it with a different `locale` is enough. If a route
 * with dynamic segments is added later, pass `{ pathname, params }` instead.
 */
export function LocaleSwitcher({ className = "" }: LocaleSwitcherProps) {
  const active = useLocale();
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <div
      className={`flex items-center gap-1 text-[13px] font-semibold ${className}`}
      role="group"
      aria-label={t("switchLanguage")}
    >
      {locales.map((locale, index) => (
        <span key={locale} className="flex items-center gap-1">
          {index > 0 && (
            <span aria-hidden className="text-line">
              |
            </span>
          )}
          <Link
            href={pathname}
            locale={locale}
            hrefLang={locale}
            aria-current={locale === active ? "true" : undefined}
            className={
              locale === active
                ? "text-navy underline decoration-yellow decoration-2 underline-offset-4"
                : "text-body hover:text-navy"
            }
          >
            {locale.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}
