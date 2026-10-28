"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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

  // One yellow bar under the desktop nav that slides to whichever item is
  // hovered or focused, and back to the current page's item on leave.
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [bar, setBar] = useState<{
    left: number;
    width: number;
    visible: boolean;
  } | null>(null);

  const activeKey = navItems.find((item) => isActive(item.href))?.key;

  const moveBarTo = useCallback((key: string | undefined) => {
    const link = key ? linkRefs.current.get(key) : undefined;
    // With nothing to sit under (a page outside the nav, like /terms), fade
    // out where it is rather than sliding off to the left edge.
    setBar((prev) =>
      link
        ? { left: link.offsetLeft, width: link.offsetWidth, visible: true }
        : prev && { ...prev, visible: false },
    );
  }, []);

  // Re-measure when the page changes and whenever the nav's box does — which
  // covers window resizes and the web font swapping in after first paint.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    moveBarTo(activeKey);
    const observer = new ResizeObserver(() => moveBarTo(activeKey));
    observer.observe(nav);
    return () => observer.disconnect();
  }, [activeKey, moveBarTo]);

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
        <nav
          ref={navRef}
          onMouseLeave={() => moveBarTo(activeKey)}
          // Only when focus leaves the nav altogether; tabbing between its
          // links blurs one and focuses the next.
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget))
              moveBarTo(activeKey);
          }}
          className="relative hidden items-center gap-8 lg:flex"
        >
          {navItems.map((item) => (
            <Link
              key={item.key}
              ref={(el) => {
                if (el) linkRefs.current.set(item.key, el);
                else linkRefs.current.delete(item.key);
              }}
              href={item.href}
              onMouseEnter={() => moveBarTo(item.key)}
              onFocus={() => moveBarTo(item.key)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative py-1 text-sm uppercase tracking-[0.02em] transition-[color,transform] duration-300 hover:-translate-y-px motion-reduce:transform-none",
                isActive(item.href)
                  ? "font-semibold text-ink"
                  : "font-medium text-ink/70 hover:text-ink",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute -bottom-0.5 left-0 h-0.5 rounded-full bg-yellow transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
              bar?.visible ? "opacity-100" : "opacity-0",
            )}
            style={{
              width: bar?.width ?? 0,
              transform: `translateX(${bar?.left ?? 0}px)`,
            }}
          />
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
            // `touch-manipulation` opts this control out of double-tap-to-zoom.
            // Without it some mobile browsers hold the tap back waiting to see
            // whether a second one follows, and a quick tap can be swallowed.
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg border border-line text-navy"
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
