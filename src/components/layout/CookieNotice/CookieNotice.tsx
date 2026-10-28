"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

import { BaseButton } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

/**
 * Where the acceptance is remembered. Session storage, so the notice comes
 * back on every new visit (a new tab or browser session) but not on each page
 * of the same visit. Browser storage, not a cookie: the notice should not set
 * the kind of thing it is telling visitors about.
 */
export const COOKIE_NOTICE_KEY = "cookie-notice-accepted";

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Storage can throw (blocked site data, some private modes). Then the notice
// shows on every page load, which is the safe way to fail.
const isAccepted = () => {
  try {
    return window.sessionStorage.getItem(COOKIE_NOTICE_KEY) === "1";
  } catch {
    return false;
  }
};

const accept = () => {
  try {
    window.sessionStorage.setItem(COOKIE_NOTICE_KEY, "1");
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
 * The server renders nothing (it cannot see browser storage); the notice
 * appears after hydration until the visitor accepts it for this visit.
 */
export default function CookieNotice() {
  const t = useTranslations("cookieNotice");
  const accepted = useSyncExternalStore(subscribe, isAccepted, () => true);
  // Kept in memory as well, so the button works when storage cannot be written.
  const [closed, setClosed] = useState(false);

  if (accepted || closed) return null;

  return (
    <section
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-yellow bg-navy-deep/95 text-white shadow-[0_-8px_24px_rgb(0_0_0/0.25)] backdrop-blur"
    >
      <div className="container-site flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex-1">
          <p className="font-semibold">{t("title")}</p>
          <p className="mt-1 text-sm font-light leading-relaxed text-white/85">
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
