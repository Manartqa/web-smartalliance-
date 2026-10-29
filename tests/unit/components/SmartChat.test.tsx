import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import en from "../../../messages/en.json";

import { siteConfig } from "@/config/site";

/** `next/image` renders a plain <img> under jsdom, which has no optimizer. */
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

/** No Next router under jsdom; the sidebar's language links need a path. */
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/en/contact",
}));

const { default: SmartChat } =
  await import("@/components/layout/SmartChat/SmartChat");
const { PRIVACY_ACK_KEY, PRIVACY_NOTICE_VERSION } =
  await import("@/components/layout/SmartChat/SmartChat.config");

const t = en.chat;

const renderChat = () =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <SmartChat />
    </NextIntlClientProvider>,
  );

const openChat = () =>
  userEvent.click(screen.getByRole("button", { name: t.launcher }));

const chatDialog = () => screen.getByRole("dialog", { name: t.title });

/** The sidebar's topic buttons (the cards and chips repeat the same names). */
const sidebar = () =>
  within(screen.getByRole("navigation", { name: t.sidebarLabel }));

describe("SmartChat", () => {
  beforeAll(() => {
    // jsdom has <dialog> but not its modal methods.
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    };
  });

  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("shows the privacy notice before the chat the first time", async () => {
    renderChat();
    await openChat();

    const notice = screen.getByRole("dialog", { name: t.notice.title });
    expect(
      within(notice).getByRole("link", { name: t.notice.policy }),
    ).toHaveAttribute("href", "/en/privacy-policy");
    expect(screen.queryByRole("dialog", { name: t.title })).toBeNull();
  });

  it("remembers the acknowledgement and opens the chat", async () => {
    renderChat();
    await openChat();
    await userEvent.click(
      screen.getByRole("button", { name: t.notice.accept }),
    );

    expect(window.sessionStorage.getItem(PRIVACY_ACK_KEY)).toBe(
      PRIVACY_NOTICE_VERSION,
    );
    expect(chatDialog()).toBeInTheDocument();
  });

  it("goes straight to the chat once acknowledged", async () => {
    window.sessionStorage.setItem(PRIVACY_ACK_KEY, PRIVACY_NOTICE_VERSION);
    renderChat();
    await openChat();

    expect(screen.queryByRole("dialog", { name: t.notice.title })).toBeNull();
    expect(chatDialog()).toBeInTheDocument();
  });

  it("shows the notice on a new visit, like the cookie notice", async () => {
    // What a visit before the switch to session storage left behind; a new
    // visit starts with empty session storage.
    window.localStorage.setItem(PRIVACY_ACK_KEY, PRIVACY_NOTICE_VERSION);
    renderChat();
    await openChat();

    expect(
      screen.getByRole("dialog", { name: t.notice.title }),
    ).toBeInTheDocument();
  });

  it("shows the notice again when its version changes", async () => {
    window.sessionStorage.setItem(PRIVACY_ACK_KEY, "an-older-version");
    renderChat();
    await openChat();

    expect(
      screen.getByRole("dialog", { name: t.notice.title }),
    ).toBeInTheDocument();
  });

  it("closing the notice does not open the chat", async () => {
    renderChat();
    await openChat();
    await userEvent.click(screen.getByRole("button", { name: t.notice.close }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.sessionStorage.getItem(PRIVACY_ACK_KEY)).toBeNull();
  });

  describe("conversation", () => {
    beforeEach(async () => {
      window.sessionStorage.setItem(PRIVACY_ACK_KEY, PRIVACY_NOTICE_VERSION);
      renderChat();
      await openChat();
    });

    it("answers a topic with contact links", async () => {
      await userEvent.click(
        sidebar().getByRole("button", { name: t.topics.contact.title }),
      );

      expect(
        screen.getByRole("link", { name: siteConfig.phone }),
      ).toHaveAttribute("href", siteConfig.phoneHref);
      expect(
        screen.getByRole("link", { name: t.links.contact }),
      ).toHaveAttribute("href", "/en/contact");
    });

    it("lists every service with a link to its page", async () => {
      await userEvent.click(
        sidebar().getByRole("button", { name: t.topics.services.title }),
      );

      expect(
        screen.getByRole("link", { name: en.services.items.ai.title }),
      ).toHaveAttribute("href", "/en/services/ai-intelligent-solutions");
    });

    it("marks the asked topic in the sidebar, and home resets", async () => {
      const home = sidebar().getByRole("button", { name: t.home });
      expect(home).toHaveAttribute("aria-current", "true");

      await userEvent.click(
        sidebar().getByRole("button", { name: t.topics.quote.title }),
      );
      expect(
        sidebar().getByRole("button", { name: t.topics.quote.title }),
      ).toHaveAttribute("aria-current", "true");
      expect(screen.getByText(t.replies.quote)).toBeInTheDocument();

      await userEvent.click(home);
      expect(home).toHaveAttribute("aria-current", "true");
      expect(screen.queryByText(t.replies.quote)).toBeNull();
    });

    it("answers a popular question", async () => {
      await userEvent.click(
        screen.getByRole("button", { name: t.faq.timeline.question }),
      );

      expect(screen.getByText(t.faq.timeline.answer)).toBeInTheDocument();
    });

    it("answers a typed question by keyword", async () => {
      await userEvent.type(
        screen.getByLabelText(t.placeholder),
        "Which clients do you work with?{Enter}",
      );

      expect(
        screen.getByText("Which clients do you work with?"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: t.links.clients }),
      ).toHaveAttribute("href", "/en/about#clients");
      expect(screen.getByLabelText(t.placeholder)).toHaveValue("");
    });

    it("falls back to the contact form when nothing matches", async () => {
      await userEvent.type(
        screen.getByLabelText(t.placeholder),
        "hello{Enter}",
      );

      expect(screen.getByText(t.replies.fallback)).toBeInTheDocument();
    });

    it("ignores an empty message", async () => {
      await userEvent.type(screen.getByLabelText(t.placeholder), "   {Enter}");

      expect(screen.queryByText(t.replies.fallback)).toBeNull();
    });

    it("keeps the conversation when minimized or closed with Esc", async () => {
      await userEvent.click(
        screen.getByRole("button", { name: t.faq.cloud.question }),
      );
      await userEvent.click(screen.getByRole("button", { name: t.minimize }));
      expect(screen.queryByRole("dialog")).toBeNull();

      await openChat();
      expect(screen.getByText(t.faq.cloud.answer)).toBeInTheDocument();

      fireEvent(chatDialog(), new Event("cancel", { cancelable: true }));
      expect(screen.queryByRole("dialog")).toBeNull();

      await openChat();
      expect(screen.getByText(t.faq.cloud.answer)).toBeInTheDocument();
    });

    it("clears the conversation when closed", async () => {
      await userEvent.click(
        screen.getByRole("button", { name: t.faq.cloud.question }),
      );
      await userEvent.click(screen.getByRole("button", { name: t.close }));

      await openChat();
      expect(screen.queryByText(t.faq.cloud.answer)).toBeNull();
    });
  });
});
