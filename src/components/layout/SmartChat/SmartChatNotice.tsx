"use client";

import { useTranslations } from "next-intl";

import {
  BaseButton,
  BUTTON_BASE_CLASS,
  BUTTON_VARIANT_CLASS,
} from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import ModalDialog from "./ModalDialog";
import SmartMascot from "./SmartMascot";

interface SmartChatNoticeProps {
  open: boolean;
  onAccept: () => void;
  onClose: () => void;
}

/** The privacy notice shown before the chat is used for the first time. */
export default function SmartChatNotice({
  open,
  onAccept,
  onClose,
}: SmartChatNoticeProps) {
  const t = useTranslations("chat");

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      labelledBy="smart-chat-notice-title"
      className="w-[calc(100%-2rem)] max-w-xl rounded-3xl bg-white shadow-2xl"
    >
      <div className="relative px-6 pb-8 pt-6 text-center sm:px-10">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("notice.close")}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-navy transition-colors hover:bg-surface-muted"
        >
          <CloseIcon />
        </button>
        <SmartMascot size="sm" className="mx-auto block h-36 w-auto sm:h-44" />
        <h2
          id="smart-chat-notice-title"
          className="mt-4 text-xl font-semibold text-navy"
        >
          {t("notice.title")}
        </h2>
        <p className="mt-3 text-sm font-light leading-relaxed text-body">
          {t("notice.body")}
        </p>
        <p className="mt-3 text-xs font-light leading-relaxed text-body">
          {t("notice.remember")}
        </p>
        <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
          <Link
            href="/privacy-policy"
            onClick={onClose}
            className={cn(BUTTON_BASE_CLASS, BUTTON_VARIANT_CLASS.navyOutline)}
          >
            {t("notice.policy")}
          </Link>
          <BaseButton type="button" onClick={onAccept}>
            {t("notice.accept")}
          </BaseButton>
        </div>
      </div>
    </ModalDialog>
  );
}

export function CloseIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      className="h-5 w-5"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
