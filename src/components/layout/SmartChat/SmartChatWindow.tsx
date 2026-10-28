"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { ABOUT_CLIENTS } from "@/components/partials/About/About.config";
import { SERVICE_ITEMS } from "@/components/partials/Services/Services.config";
import {
  ArrowRight,
  ChevronRight,
  Globe,
  Home,
  Shield,
} from "@/components/ui/Icon";
import { siteConfig } from "@/config/site";
import { Link, usePathname } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import ModalDialog from "./ModalDialog";
import {
  CHAT_CARDS,
  CHAT_CLIENT_NAMES,
  CHAT_FAQ,
  CHAT_INDUSTRIES,
  CHAT_REPLY_LINKS,
  CHAT_SIDEBAR,
  CHAT_TOPIC_ICONS,
  matchReply,
  type ChatFaqKey,
  type ChatReply,
  type ChatTopicKey,
} from "./SmartChat.config";
import { CloseIcon } from "./SmartChatNotice";
import SmartMascot from "./SmartMascot";

type ChatEntry =
  | { id: number; from: "user"; text: string }
  | { id: number; from: "bot"; reply: ChatReply };

type ServiceKey = (typeof SERVICE_ITEMS)[number]["key"];

interface SmartChatWindowProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The chat screen: a sidebar of topics, a welcome with topic cards and
 * popular questions, then the conversation. Answers come from the site's own
 * copy, picked by button or by keywords in a typed question (`matchReply`);
 * nothing typed leaves the browser.
 *
 * Minimizing keeps the conversation (it lives in this component's state, so
 * it also survives moving between pages); closing clears it. Either way it is
 * gone on reload.
 */
export default function SmartChatWindow({
  open,
  onClose,
}: SmartChatWindowProps) {
  const t = useTranslations("chat");
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState("");
  const nextId = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view; back to the top when the chat is reset.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller) {
      scroller.scrollTop = entries.length ? scroller.scrollHeight : 0;
    }
  }, [entries, open]);

  const ask = (text: string, reply: ChatReply) => {
    setEntries((current) => [
      ...current,
      { id: nextId.current++, from: "user", text },
      { id: nextId.current++, from: "bot", reply },
    ]);
  };

  const askTopic = (key: ChatTopicKey) =>
    ask(t(`topics.${key}.title`), { kind: "topic", key });

  const askFaq = (key: ChatFaqKey) =>
    ask(t(`faq.${key}.question`), { kind: "faq", key });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    ask(text, matchReply(text));
    setDraft("");
  };

  const lastReply = entries.findLast((entry) => entry.from === "bot");
  const active: ChatTopicKey | "home" | null = !lastReply
    ? "home"
    : lastReply.reply.kind === "topic"
      ? lastReply.reply.key
      : lastReply.reply.kind === "faq"
        ? "faq"
        : null;

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      labelledBy="smart-chat-title"
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-navy"
    >
      <div className="relative h-full overflow-hidden">
        {/* Already soft and light, made for this screen: no blur or tint.
            Anchored right so the globe stays behind the mascot. */}
        <Image
          src="/assets/chat-bg.webp"
          alt=""
          fill
          quality={90}
          sizes="100vw"
          className="object-cover object-right"
        />

        <div className="relative flex h-full gap-6 p-2 sm:p-4 lg:px-10 lg:py-8 xl:px-14">
          <div className="flex min-w-0 flex-1 overflow-hidden rounded-3xl border border-white/80 bg-white/75 shadow-2xl backdrop-blur-xl lg:max-w-[64rem] lg:rounded-[2rem]">
            <Sidebar
              active={active}
              onHome={() => setEntries([])}
              onTopic={askTopic}
              onNavigate={onClose}
            />

            <section className="flex min-w-0 flex-1 flex-col">
              <header className="flex items-center gap-3 border-b border-white px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
                <Image
                  src="/assets/mascot-smart-face.webp"
                  alt=""
                  width={256}
                  height={256}
                  className="h-12 w-12 shrink-0 rounded-full bg-white shadow-md ring-2 ring-white sm:h-16 sm:w-16"
                />
                <div className="min-w-0 flex-1">
                  <h2
                    id="smart-chat-title"
                    className="text-lg font-semibold leading-tight text-navy sm:text-2xl"
                  >
                    {t("title")}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-2 text-sm text-body">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"
                    />
                    {t("subtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("minimize")}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-navy transition-colors hover:bg-white"
                >
                  <MinimizeIcon />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntries([]);
                    onClose();
                  }}
                  aria-label={t("close")}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-navy transition-colors hover:bg-white"
                >
                  <CloseIcon />
                </button>
              </header>

              <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6"
              >
                <ol aria-live="polite" className="space-y-5">
                  <BotMessage>
                    <p className="font-semibold text-navy sm:text-lg">
                      {t("greeting.title")}
                    </p>
                    <p className="mt-1">{t("greeting.body")}</p>
                  </BotMessage>

                  <li>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {CHAT_CARDS.map((key) => {
                        const Icon = CHAT_TOPIC_ICONS[key]!;
                        return (
                          <li key={key}>
                            <button
                              type="button"
                              onClick={() => askTopic(key)}
                              className="flex h-full w-full items-center gap-4 rounded-2xl bg-white px-4 py-3.5 text-left shadow-sm ring-1 ring-white transition hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-cta/30"
                            >
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-cta/10 text-blue-cta">
                                <Icon className="h-6 w-6" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-semibold leading-snug text-navy">
                                  {t(`topics.${key}.title`)}
                                </span>
                                <span className="mt-0.5 block text-sm font-light leading-snug text-body">
                                  {t(`topics.${key}.hint`, {
                                    count: SERVICE_ITEMS.length,
                                  })}
                                </span>
                              </span>
                              <ChevronRight className="h-3 w-auto shrink-0 text-navy" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>

                  <li>
                    <p className="text-sm font-semibold text-navy">
                      {t("popular")}
                    </p>
                    <FaqChips onAsk={askFaq} className="mt-2" />
                  </li>

                  {entries.map((entry) =>
                    entry.from === "user" ? (
                      <li key={entry.id} className="flex justify-end">
                        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-blue-cta px-4 py-2.5 text-white shadow-sm">
                          {entry.text}
                        </p>
                      </li>
                    ) : (
                      <BotMessage key={entry.id}>
                        <BotReply
                          reply={entry.reply}
                          onAskFaq={askFaq}
                          onNavigate={onClose}
                        />
                        {entry.id === lastReply?.id && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {CHAT_CARDS.map((key) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => askTopic(key)}
                                className="rounded-full border border-blue-cta/30 bg-white px-3.5 py-1.5 text-sm font-medium text-blue-cta transition-colors hover:bg-blue-cta hover:text-white"
                              >
                                {t(`topics.${key}.title`)}
                              </button>
                            ))}
                          </div>
                        )}
                      </BotMessage>
                    ),
                  )}
                </ol>
              </div>

              <div className="border-t border-white px-4 pb-3 pt-3 sm:px-6 sm:pb-4">
                <form onSubmit={submit} className="flex items-center gap-3">
                  <label htmlFor="smart-chat-input" className="sr-only">
                    {t("placeholder")}
                  </label>
                  <input
                    id="smart-chat-input"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={t("placeholder")}
                    maxLength={300}
                    autoComplete="off"
                    className="min-w-0 flex-1 rounded-full bg-white px-5 py-3.5 text-ink shadow-sm outline-none ring-1 ring-white placeholder:text-placeholder focus:ring-2 focus:ring-blue-cta"
                  />
                  <button
                    type="submit"
                    aria-label={t("send")}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-cta text-white shadow-md transition-colors hover:bg-navy sm:h-14 sm:w-14"
                  >
                    <SendIcon />
                  </button>
                </form>
                <p className="mt-2 flex items-start justify-center gap-1.5 text-center text-xs font-light text-body">
                  <Shield className="mt-px h-3.5 w-3.5 shrink-0" />
                  <span>
                    {t.rich("note", {
                      link: (chunks) => (
                        <Link
                          href="/privacy-policy"
                          onClick={onClose}
                          className="underline underline-offset-2 hover:text-navy"
                        >
                          {chunks}
                        </Link>
                      ),
                    })}
                  </span>
                </p>
              </div>
            </section>
          </div>

          <MascotGreeting />
        </div>
      </div>
    </ModalDialog>
  );
}

function Sidebar({
  active,
  onHome,
  onTopic,
  onNavigate,
}: {
  active: ChatTopicKey | "home" | null;
  onHome: () => void;
  onTopic: (key: ChatTopicKey) => void;
  onNavigate: () => void;
}) {
  const t = useTranslations("chat");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const item = (isActive: boolean) =>
    cn(
      "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium transition-colors",
      isActive
        ? "bg-yellow text-navy shadow-md"
        : "text-white/90 hover:bg-white/10",
    );

  return (
    <aside className="hidden w-64 shrink-0 flex-col rounded-[2rem] bg-gradient-to-b from-blue-cta to-navy px-4 py-7 text-white shadow-xl lg:flex xl:w-72">
      <Image
        src="/assets/logo-white.png"
        alt="Smart Alliance"
        width={192}
        height={64}
        className="ml-3 h-11 w-auto self-start"
      />
      <nav aria-label={t("sidebarLabel")} className="mt-8 space-y-1.5">
        <button
          type="button"
          onClick={onHome}
          aria-current={active === "home" ? "true" : undefined}
          className={item(active === "home")}
        >
          <Home className="h-6 w-6 shrink-0" />
          {t("home")}
        </button>
        {CHAT_SIDEBAR.map((key) => {
          const Icon = CHAT_TOPIC_ICONS[key]!;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTopic(key)}
              aria-current={active === key ? "true" : undefined}
              className={item(active === key)}
            >
              <Icon className="h-6 w-6 shrink-0" />
              {t(`topics.${key}.title`)}
            </button>
          );
        })}
      </nav>
      <div
        role="group"
        aria-label={tNav("switchLanguage")}
        className="mt-auto flex items-center gap-3 px-4 text-sm font-semibold"
      >
        <Globe className="h-6 w-6" />
        {locales.map((code, index) => (
          <span key={code} className="flex items-center gap-3">
            {index > 0 && (
              <span aria-hidden className="text-white/40">
                |
              </span>
            )}
            <Link
              href={pathname}
              locale={code}
              hrefLang={code}
              onClick={onNavigate}
              aria-current={code === locale ? "true" : undefined}
              className={
                code === locale
                  ? "text-white"
                  : "text-white/60 hover:text-white"
              }
            >
              {code.toUpperCase()}
            </Link>
          </span>
        ))}
      </div>
    </aside>
  );
}

function MascotGreeting() {
  const t = useTranslations("chat");
  return (
    // Both sit at the bottom, level with the chat panel's foot: the mascot
    // stands on it, and the bubble rides just above its head, tail pointing
    // down, whatever the window's height.
    <div className="hidden w-[26rem] shrink-0 flex-col items-center justify-end xl:flex">
      {/* Fixed width, so the copy wraps to a few short lines in either
          language; the copy's own line breaks pick where. */}
      <p className="relative z-10 ml-10 w-64 shrink-0 -rotate-3 rounded-[2rem] bg-white px-6 py-4 text-center text-lg font-semibold leading-snug text-navy shadow-xl">
        {t.rich("bubble", {
          br: () => <br />,
          strong: (chunks) => (
            <strong className="text-blue-cta">{chunks}</strong>
          ),
        })}
        <span
          aria-hidden
          className="absolute -bottom-2.5 left-1/2 h-6 w-6 -translate-x-1/2 rotate-45 rounded-sm bg-white"
        />
      </p>
      {/* Sized by the picture itself (not a fixed box), so the box ends at
          the top of the head and the bubble's tail meets it with no gap; on
          a short window the height cap shrinks it, still bottom-aligned. */}
      <SmartMascot
        size="lg"
        alt={t("mascotAlt")}
        className="mt-2 h-auto max-h-[80%] w-full min-h-0 object-contain object-bottom drop-shadow-2xl"
      />
    </div>
  );
}

function FaqChips({
  onAsk,
  className,
}: {
  onAsk: (key: ChatFaqKey) => void;
  className?: string;
}) {
  const t = useTranslations("chat");
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {CHAT_FAQ.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onAsk(key)}
          className="rounded-full bg-white px-3.5 py-1.5 text-sm text-navy shadow-sm ring-1 ring-white transition-colors hover:bg-blue-cta hover:text-white"
        >
          {t(`faq.${key}.question`)}
        </button>
      ))}
    </div>
  );
}

function BotMessage({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Image
        src="/assets/mascot-smart-face.webp"
        alt=""
        width={256}
        height={256}
        className="h-10 w-10 shrink-0 rounded-full bg-white object-cover shadow ring-2 ring-white sm:h-12 sm:w-12"
      />
      <div className="max-w-[90%] flex-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 leading-relaxed text-ink shadow-sm sm:px-5 sm:py-4">
        {children}
      </div>
    </li>
  );
}

function BotReply({
  reply,
  onAskFaq,
  onNavigate,
}: {
  reply: ChatReply;
  onAskFaq: (key: ChatFaqKey) => void;
  onNavigate: () => void;
}) {
  const t = useTranslations("chat");
  const tServices = useTranslations("services.items");
  const locale = useLocale();

  const linkKey = reply.kind === "fallback" ? "fallback" : reply.key;
  const more = (
    <Link
      href={CHAT_REPLY_LINKS[linkKey]}
      onClick={onNavigate}
      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-cta hover:underline"
    >
      {t(`links.${linkKey}`)}
      <ArrowRight className="h-3 w-auto" />
    </Link>
  );

  const serviceLink = (key: ServiceKey) => {
    const service = SERVICE_ITEMS.find((item) => item.key === key)!;
    return (
      <Link
        href={`/services/${service.slug}`}
        onClick={onNavigate}
        className="text-navy hover:text-blue-cta hover:underline"
      >
        {tServices(`${key}.title`)}
      </Link>
    );
  };

  const contactValues = {
    phone: siteConfig.phone,
    email: siteConfig.email,
    phoneLink: (chunks: ReactNode) => (
      <a
        href={siteConfig.phoneHref}
        className="font-semibold text-blue-cta hover:underline"
      >
        {chunks}
      </a>
    ),
    emailLink: (chunks: ReactNode) => (
      <a
        href={`mailto:${siteConfig.email}`}
        className="font-semibold text-blue-cta hover:underline"
      >
        {chunks}
      </a>
    ),
  };

  const clientNames = ABOUT_CLIENTS.slice(0, CHAT_CLIENT_NAMES)
    .map((client) => (locale === "th" ? client.th : client.en))
    .join(locale === "th" ? " " : ", ");

  if (reply.kind === "fallback") {
    return (
      <>
        <p>{t("replies.fallback")}</p>
        {more}
      </>
    );
  }

  if (reply.kind === "faq") {
    return (
      <>
        <p>{t(`faq.${reply.key}.answer`, { names: clientNames })}</p>
        {more}
      </>
    );
  }

  switch (reply.key) {
    case "services":
      return (
        <>
          <p>{t("replies.services", { count: SERVICE_ITEMS.length })}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {SERVICE_ITEMS.map((service) => (
              <li key={service.key}>{serviceLink(service.key)}</li>
            ))}
          </ul>
          {more}
        </>
      );
    case "industries":
      return (
        <>
          <p>{t("replies.industries")}</p>
          <ul className="mt-2 space-y-2 text-sm">
            {CHAT_INDUSTRIES.map((group) => (
              <li key={group.key}>
                <span className="font-semibold text-navy">
                  {t(`industries.${group.key}`)}
                </span>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {group.services.map((key) => (
                    <li key={key}>{serviceLink(key)}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          {more}
        </>
      );
    case "faq":
      return (
        <>
          <p>{t("replies.faq")}</p>
          <FaqChips onAsk={onAskFaq} className="mt-3" />
        </>
      );
    case "contact":
      return (
        <>
          <p>
            {t.rich("replies.contact", {
              ...contactValues,
              address: [
                siteConfig.address.building,
                siteConfig.address.line1,
                siteConfig.address.line2,
              ].join(" "),
            })}
          </p>
          {more}
        </>
      );
    case "staff":
      return (
        <>
          <p>{t.rich("replies.staff", contactValues)}</p>
          {more}
        </>
      );
    case "clients":
      return (
        <>
          <p>{t("replies.clients", { names: clientNames })}</p>
          {more}
        </>
      );
    default:
      return (
        <>
          <p>{t(`replies.${reply.key}`)}</p>
          {more}
        </>
      );
  }
}

function MinimizeIcon() {
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
      <path d="M5 12h14" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5z" />
    </svg>
  );
}
