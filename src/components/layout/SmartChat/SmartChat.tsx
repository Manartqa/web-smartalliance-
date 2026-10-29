"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

import { PRIVACY_ACK_KEY, PRIVACY_NOTICE_VERSION } from "./SmartChat.config";
import SmartChatNotice from "./SmartChatNotice";
import SmartMascot from "./SmartMascot";
import SmartChatWindow from "./SmartChatWindow";

const listeners = new Set<() => void>();

// Session storage belongs to one tab, so no other tab can change it under us:
// subscribers only hear about acknowledgements made on this page.
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Storage can throw (blocked site data, some private modes). Then the notice
// is shown each time the chat is opened, which is the safe way to fail.
const isAcknowledged = () => {
  try {
    return (
      window.sessionStorage.getItem(PRIVACY_ACK_KEY) === PRIVACY_NOTICE_VERSION
    );
  } catch {
    return false;
  }
};

const acknowledge = () => {
  try {
    window.sessionStorage.setItem(PRIVACY_ACK_KEY, PRIVACY_NOTICE_VERSION);
  } catch {
    // Remembered for this page view only.
  }
  listeners.forEach((listener) => listener());
};

type View = "closed" | "notice" | "chat";

/**
 * "น้อง Smart": a floating button that opens the chat. The privacy notice comes
 * first on every visit; once the visitor accepts it, the button opens the chat
 * directly for the rest of that visit (per notice version), as the cookie
 * notice does.
 *
 * The button sits above the cookie notice while that is showing, using the
 * height the notice publishes as `--cookie-notice-height`.
 */
export default function SmartChat() {
  const t = useTranslations("chat");
  const [view, setView] = useState<View>("closed");
  const stored = useSyncExternalStore(subscribe, isAcknowledged, () => false);
  // Kept in memory as well, so accepting works when storage cannot be written.
  const [accepted, setAccepted] = useState(false);

  const close = () => setView("closed");

  return (
    <>
      <button
        type="button"
        onClick={() => setView(stored || accepted ? "chat" : "notice")}
        aria-label={t("launcher")}
        className="group fixed bottom-[calc(var(--cookie-notice-height,0px)+1rem)] right-4 z-40 flex items-center gap-3 transition-[bottom] sm:bottom-[calc(var(--cookie-notice-height,0px)+1.5rem)] sm:right-6"
      >
        <span
          aria-hidden
          className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy shadow-lg ring-1 ring-line lg:block"
        >
          {t("launcherHint")}
        </span>
        {/* The whole mascot, its open hand pointing at the hint beside it. */}
        <SmartMascot
          size="sm"
          className="h-28 w-auto drop-shadow-[0_6px_10px_rgb(0_26_61/0.35)] transition-transform group-hover:-translate-y-1 sm:h-32"
        />
      </button>

      <SmartChatNotice
        open={view === "notice"}
        onClose={close}
        onAccept={() => {
          setAccepted(true);
          acknowledge();
          setView("chat");
        }}
      />
      <SmartChatWindow open={view === "chat"} onClose={close} />
    </>
  );
}
