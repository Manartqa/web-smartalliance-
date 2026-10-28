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
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("shows the notice with a link to the privacy policy", () => {
    renderNotice();

    expect(screen.getByRole("region", { name: t.title })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/en/privacy-policy");
  });

  it("hides on acceptance and remembers it for the visit", async () => {
    renderNotice();

    await userEvent.click(screen.getByRole("button", { name: t.accept }));

    expect(screen.queryByRole("region", { name: t.title })).toBeNull();
    expect(window.sessionStorage.getItem(COOKIE_NOTICE_KEY)).toBe("1");
    expect(window.localStorage.getItem(COOKIE_NOTICE_KEY)).toBeNull();
  });

  it("stays hidden for the rest of the visit once accepted", () => {
    window.sessionStorage.setItem(COOKIE_NOTICE_KEY, "1");
    renderNotice();

    expect(screen.queryByRole("region", { name: t.title })).toBeNull();
  });

  it("still hides when storage cannot be written", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderNotice();

    await userEvent.click(screen.getByRole("button", { name: t.accept }));

    expect(screen.queryByRole("region", { name: t.title })).toBeNull();
  });
});
