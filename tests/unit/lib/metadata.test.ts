import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { siteConfig } from "@/config/site";

/**
 * `getTranslations` is next-intl's server API and needs a request context that
 * does not exist in a unit test. Stubbed with a resolver that echoes the key
 * back, so assertions can tell *which* message each field was filled from.
 */
vi.mock("next-intl/server", () => ({
  getTranslations: async ({
    locale,
    namespace,
  }: {
    locale: string;
    namespace: string;
  }) => (key: string) => `${locale}:${namespace}.${key}`,
}));

const load = async () => (await import("@/lib/metadata")).buildMetadata;

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildMetadata — titles and description", () => {
  it("reads the per-page namespace rather than a shared one", async () => {
    // Every page previously carried the company name as its title, which left
    // search results looking identical and invited Google to rewrite them.
    const meta = await (await load())("en", "about", "/about");

    expect(meta.title).toBe("en:meta.about.title");
    expect(meta.description).toBe("en:meta.about.description");
  });

  it("reads the requested locale's messages", async () => {
    const meta = await (await load())("th", "services", "/services");

    expect(meta.title).toBe("th:meta.services.title");
  });

  it("sets metadataBase from siteConfig so relative urls resolve", async () => {
    const meta = await (await load())("en", "home", "/");

    expect(meta.metadataBase?.toString()).toBe(new URL(siteConfig.url).toString());
    expect(meta.applicationName).toBe(siteConfig.name);
  });
});

describe("buildMetadata — canonical and hreflang", () => {
  it("points the canonical at the locale-prefixed path", async () => {
    const meta = await (await load())("th", "about", "/about");

    expect(meta.alternates?.canonical).toBe("/th/about");
  });

  it("collapses the home path so the canonical is not /en/", async () => {
    const meta = await (await load())("en", "home", "/");

    expect(meta.alternates?.canonical).toBe("/en");
  });

  it("pairs both language versions of the same page", async () => {
    const meta = await (await load())("en", "services", "/services");

    expect(meta.alternates?.languages).toMatchObject({
      en: "/en/services",
      th: "/th/services",
    });
  });

  it("declares English as x-default", async () => {
    // Without it, a searcher in an unlisted locale gets whichever version the
    // crawler happened to index first.
    const meta = await (await load())("th", "contact", "/contact");

    expect(meta.alternates?.languages?.["x-default"]).toBe("/en/contact");
  });

  it("gives the home page hreflang entries without a trailing slash", async () => {
    const meta = await (await load())("en", "home", "/");

    expect(meta.alternates?.languages).toMatchObject({
      en: "/en",
      th: "/th",
      "x-default": "/en",
    });
  });
});

describe("buildMetadata — social cards", () => {
  it("names the generated card explicitly on every page", async () => {
    // A child segment declaring `openGraph` replaces the parent's whole object,
    // so relying on the file convention would ship /about with no image.
    const meta = await (await load())("en", "about", "/about");

    expect(meta.openGraph?.images).toEqual([
      {
        url: "/en/opengraph-image",
        width: 1200,
        height: 630,
        alt: "en:meta.about.title",
      },
    ]);
  });

  it("uses the twitter route for the twitter card", async () => {
    const meta = await (await load())("en", "home", "/");

    // Asserted through `toMatchObject` rather than property access: Next types
    // `twitter` as a union of card shapes, and `card` is not on every member.
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      images: [expect.objectContaining({ url: "/en/twitter-image" })],
    });
  });

  it.each([
    ["en", "en_US", "th_TH"],
    ["th", "th_TH", "en_US"],
  ] as const)(
    "declares %s as the og locale with the other as an alternate",
    async (locale, ogLocale, alternate) => {
      const meta = await (await load())(locale, "home", "/");

      expect(meta.openGraph).toMatchObject({
        locale: ogLocale,
        alternateLocale: [alternate],
        type: "website",
        siteName: siteConfig.name,
      });
    },
  );
});

describe("buildMetadata — robots", () => {
  it("allows indexing and following", async () => {
    const meta = await (await load())("en", "home", "/");

    expect(meta.robots).toMatchObject({ index: true, follow: true });
  });

  it("opts out of the snippet and preview caps", async () => {
    // The defaults truncate the snippet and force a thumbnail; a B2B result
    // reads better with the full text and a large image.
    const meta = await (await load())("en", "home", "/");

    expect(meta.robots).toMatchObject({
      googleBot: {
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    });
  });
});

describe("buildMetadata — site verification", () => {
  it("omits both tags when neither token is configured", async () => {
    // Undefined keys are dropped by Next rather than rendered empty, so an
    // unconfigured deployment simply ships no tag.
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION", "");
    vi.stubEnv("NEXT_PUBLIC_BING_SITE_VERIFICATION", "");

    const meta = await (await load())("en", "home", "/");

    expect(meta.verification?.google).toBeUndefined();
    expect(meta.verification?.other).toBeUndefined();
  });

  it("carries the Google token when it is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION", "google-token");

    const meta = await (await load())("en", "home", "/");

    expect(meta.verification?.google).toBe("google-token");
  });

  it("carries the Bing token under msvalidate.01", async () => {
    vi.stubEnv("NEXT_PUBLIC_BING_SITE_VERIFICATION", "bing-token");

    const meta = await (await load())("en", "home", "/");

    expect(meta.verification?.other).toEqual({ "msvalidate.01": "bing-token" });
  });
});
