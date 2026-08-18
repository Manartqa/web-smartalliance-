import { describe, expect, it, vi } from "vitest";

import { SERVICE_ITEMS } from "@/components/partials/Services/Services.config";
import { navItems, siteConfig } from "@/config/site";

/**
 * Stubbed the same way as the metadata tests: the resolver echoes the key, so
 * each line can be traced to the message it was built from. The point of these
 * assertions is the *document's shape* — an assistant reads it by heading —
 * not the copy, which comes from the same catalogue the pages render.
 */
vi.mock("next-intl/server", () => ({
  getTranslations: async ({ namespace }: { namespace: string }) =>
    (key: string) => `${namespace}.${key}`,
}));

const load = async () => (await import("@/lib/llms-txt")).buildLlmsTxt;

describe("buildLlmsTxt — structure", () => {
  it("opens with the company name as an h1", async () => {
    const text = await (await load())();

    expect(text.startsWith(`# ${siteConfig.name}`)).toBe(true);
  });

  it("carries the site summary as a blockquote, which is the llmstxt.org convention", async () => {
    const text = await (await load())();

    expect(text).toContain("> meta.home.description");
  });

  it.each([
    "## Pages",
    "## Services",
    "## Technology partnership",
    "## Company facts",
    "## Thai versions",
  ])("has the %s section", async (heading) => {
    expect(await (await load())()).toContain(heading);
  });

  it("keeps the sections in a stable order", async () => {
    const text = await (await load())();
    const order = [
      "## Pages",
      "## Services",
      "## Technology partnership",
      "## Company facts",
      "## Thai versions",
    ].map((heading) => text.indexOf(heading));

    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((index) => index > -1)).toBe(true);
  });
});

describe("buildLlmsTxt — links", () => {
  it("lists every nav page as an absolute English url", async () => {
    const text = await (await load())();

    for (const { href } of navItems) {
      const url = `${siteConfig.url}/en${href === "/" ? "" : href}`;
      expect(text, url).toContain(url);
    }
  });

  it("lists the Thai counterpart of every page", async () => {
    const text = await (await load())();

    for (const { href } of navItems) {
      const url = `${siteConfig.url}/th${href === "/" ? "" : href}`;
      expect(text, url).toContain(url);
    }
  });

  it("does not emit a trailing slash for the home url", async () => {
    const text = await (await load())();

    expect(text).toContain(`(${siteConfig.url}/en)`);
    expect(text).not.toContain(`${siteConfig.url}/en/)`);
  });

  it("links the partnership detail at the about page anchor", async () => {
    expect(await (await load())()).toContain(`${siteConfig.url}/en/about#axway`);
  });
});

describe("buildLlmsTxt — content derived from config", () => {
  it("lists every service the services page renders", async () => {
    // Derived from the same config the page maps over, so the file cannot
    // drift the way a hand-written summary would.
    const text = await (await load())();

    for (const { key } of SERVICE_ITEMS) {
      expect(text, key).toContain(`**services.items.${key}.title**`);
    }
  });

  it("lists exactly as many services as the config declares", async () => {
    const text = await (await load())();
    const listed = [...text.matchAll(/^- \*\*services\.items\./gm)];

    expect(listed).toHaveLength(SERVICE_ITEMS.length);
  });

  it("states the company facts from siteConfig", async () => {
    const text = await (await load())();

    expect(text).toContain(`Legal name: ${siteConfig.name}`);
    expect(text).toContain(`Founded: ${siteConfig.foundedYear}`);
    expect(text).toContain(`Telephone: ${siteConfig.phone}`);
    expect(text).toContain(`Email: ${siteConfig.email}`);
    expect(text).toContain(siteConfig.address.line1);
  });

  it("says the site is published in English and Thai", async () => {
    expect(await (await load())()).toContain("Languages: English, Thai");
  });

  it("does not warn about locale count while the site has exactly two", async () => {
    // The note fires only if a third locale is added without revisiting this
    // file's two-locale assumptions.
    expect(await (await load())()).not.toContain("this site now has");
  });

  it("ends with a newline, so the served file is well formed", async () => {
    expect((await (await load())()).endsWith("\n")).toBe(true);
  });
});
