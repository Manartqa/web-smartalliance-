"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { BaseButton } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

/**
 * The cookie that remembers the acceptance. It lasts one day, so the notice
 * comes back the day after a visitor accepts it.
 */
export const COOKIE_NOTICE_KEY = "cookie-notice-accepted";
const COOKIE_MAX_AGE = 60 * 60 * 24;

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Cookie access can throw (sandboxed frames). If cookies are blocked, the
// notice shows on every page load, which is the safe way to fail.
const isAccepted = () => {
  try {
    return document.cookie.split("; ").includes(`${COOKIE_NOTICE_KEY}=1`);
  } catch {
    return false;
  }
};

const accept = () => {
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_NOTICE_KEY}=1; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  } catch {
    // Hidden for this page view only.
  }
  listeners.forEach((listener) => listener());
};

/**
 * Tells visitors which cookies the site uses. An acknowledgement, not a consent
 * prompt: the site sets only the strictly necessary locale cookie, so there is
 * nothing to accept or refuse. If analytics or marketing cookies are ever
 * added, this needs to become a real consent banner that loads them only after
 * the visitor agrees.
 *
 * The server renders nothing; the notice appears after hydration until the
 * visitor accepts it, and stays hidden for a day after that.
 */
export default function CookieNotice() {
  const t = useTranslations("cookieNotice");
  const accepted = useSyncExternalStore(subscribe, isAccepted, () => true);
  // Kept in memory as well, so the button works when the cookie cannot be set.
  const [closed, setClosed] = useState(false);
  const visible = !accepted && !closed;
  const ref = useRef<HTMLElement>(null);

  // Publishes the notice's height as `--cookie-notice-height`, so other fixed
  // elements at the bottom of the screen (the chat button) can sit above it.
  useEffect(() => {
    const notice = ref.current;
    if (!visible || !notice) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      root.style.setProperty(
        "--cookie-notice-height",
        `${notice.offsetHeight}px`,
      );
    });
    observer.observe(notice);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--cookie-notice-height");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <section
      ref={ref}
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-yellow bg-navy-deep/95 text-white shadow-[0_-8px_24px_rgb(0_0_0/0.25)] backdrop-blur"
    >
      {/* Tighter on phones, where it sits over the first screen. */}
      <div className="container-site flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:gap-8 sm:py-5">
        <div className="flex-1">
          <p className="text-sm font-semibold sm:text-base">{t("title")}</p>
          <p className="mt-1 text-[13px] font-light leading-snug text-white/85 sm:text-sm sm:leading-relaxed">
            {t.rich("body", {
              link: (chunks) => (
                <Link
                  href="/privacy-policy"
                  className="font-normal text-yellow underline underline-offset-2 hover:text-white"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
        <BaseButton
          type="button"
          onClick={() => {
            setClosed(true);
            accept();
          }}
          className="shrink-0 self-start sm:self-auto"
        >
          {t("accept")}
        </BaseButton>
      </div>
    </section>
  );
}
