import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import en from "../../../messages/en.json";

const { default: CookieNotice, COOKIE_NOTICE_KEY } =
  await import("@/components/layout/CookieNotice/CookieNotice");

const t = en.cookieNotice;

const renderNotice = () =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CookieNotice />
    </NextIntlClientProvider>,
  );

describe("CookieNotice", () => {
  beforeEach(() => {
    // jsdom has no ResizeObserver; the notice only uses it to publish its height.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    document.cookie = `${COOKIE_NOTICE_KEY}=; Max-Age=0; Path=/`;
  });

  it("shows the notice with a link to the privacy policy", () => {
    renderNotice();

    expect(screen.getByRole("region", { name: t.title })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/en/privacy-policy");
  });

  it("hides on acceptance and remembers it in a one-day cookie", async () => {
    const setCookie = vi.spyOn(Document.prototype, "cookie", "set");
    renderNotice();

    await userEvent.click(screen.getByRole("button", { name: t.accept }));

    expect(screen.queryByRole("region", { name: t.title })).toBeNull();
    expect(setCookie).toHaveBeenCalledWith(
      `${COOKIE_NOTICE_KEY}=1; Max-Age=86400; Path=/; SameSite=Lax`,
    );
    expect(document.cookie).toContain(`${COOKIE_NOTICE_KEY}=1`);
  });

  it("stays hidden while the acceptance cookie is set", () => {
    document.cookie = `${COOKIE_NOTICE_KEY}=1; Path=/`;
    renderNotice();

    expect(screen.queryByRole("region", { name: t.title })).toBeNull();
  });

  it("still hides when the cookie cannot be set", async () => {
    vi.spyOn(Document.prototype, "cookie", "set").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderNotice();

    await userEvent.click(screen.getByRole("button", { name: t.accept }));

    expect(screen.queryByRole("region", { name: t.title })).toBeNull();
  });
});
