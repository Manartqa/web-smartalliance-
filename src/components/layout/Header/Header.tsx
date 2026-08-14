"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { navItems } from "@/config/site";
import { ChevronRight } from "@/components/ui/Icon";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { HEADER_CONTACT_CTA_CLASS } from "./Header.config";
import LocaleSwitcher from "./LocaleSwitcher";

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white">
      <div className="container-site flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link href="/" className="shrink-0" aria-label="Smart Alliance">
          <Image
            src="/assets/logo.png"
            alt="Smart Alliance"
            width={260}
            height={59}
            priority
            className="h-9 w-auto lg:h-[52px]"
          />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative py-1 text-sm uppercase tracking-[0.02em] transition-colors",
                isActive(item.href)
                  ? "font-semibold text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-yellow"
                  : "font-medium text-ink/80 hover:text-ink",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <LocaleSwitcher />
          <Link href="/contact" className={HEADER_CONTACT_CTA_CLASS}>
            {t("contactCta")}
            <ChevronRight />
          </Link>
        </div>

        {/* Mobile trigger */}
        <div className="flex items-center gap-3 lg:hidden">
          <LocaleSwitcher />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-navy"
          >
            <span aria-hidden className="relative block h-4 w-5">
              <span
                className={cn(
                  "absolute left-0 h-0.5 w-5 bg-current transition-all",
                  open ? "top-1.5 rotate-45" : "top-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-opacity",
                  open ? "opacity-0" : "opacity-100",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 h-0.5 w-5 bg-current transition-all",
                  open ? "top-1.5 -rotate-45" : "top-3",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-line bg-white lg:hidden"
      >
        <nav className="container-site flex flex-col py-2">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "border-b border-line/70 py-4 text-base",
                isActive(item.href)
                  ? "font-semibold text-navy"
                  : "font-medium text-ink",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="my-4 inline-flex items-center justify-center gap-2.5 rounded-[10px] bg-yellow px-5 py-4 text-sm font-semibold uppercase tracking-[0.4px] text-[#0a0f1a]"
          >
            {t("contactCta")}
            <ChevronRight />
          </Link>
        </nav>
      </div>
    </header>
  );
}
