import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";
import {
  axwayPartnershipGraph,
  breadcrumbGraph,
  servicesGraph,
  siteGraph,
} from "@/lib/structured-data";

/**
 * JSON-LD is emitted into every page's `<head>`. It has no visible failure
 * mode: a broken `@id` reference or a malformed node simply stops Google
 * associating the record, silently, until someone checks Search Console.
 */
const ORG_ID = `${siteConfig.url}/#organization`;

describe("siteGraph", () => {
  it("is serialisable, since it is written into a script tag", () => {
    expect(() => JSON.stringify(siteGraph("en", "desc"))).not.toThrow();
  });

  it("declares the schema.org context and a @graph", () => {
    const graph = siteGraph("en", "desc");

    expect(graph["@context"]).toBe("https://schema.org");
    expect(Array.isArray(graph["@graph"])).toBe(true);
  });

  it("types the company as both Organization and LocalBusiness", () => {
    // `Organization` alone is read as a company record, not a place of
    // business, and does not qualify for local results.
    const [org] = siteGraph("en", "desc")["@graph"];

    expect(org["@type"]).toEqual(["Organization", "LocalBusiness"]);
  });

  it("carries the contact details from siteConfig, not a copy", () => {
    const [org] = siteGraph("en", "desc")["@graph"];

    expect(org).toMatchObject({
      "@id": ORG_ID,
      name: siteConfig.name,
      url: siteConfig.url,
      email: siteConfig.email,
      telephone: siteConfig.phone,
      foundingDate: String(siteConfig.foundedYear),
    });
  });

  it("states the Axway expertise as a fact on the company record", () => {
    // Otherwise a crawler has to infer from prose whether the company sells
    // Axway or merely mentions it.
    const [org] = siteGraph("en", "desc")["@graph"];

    expect(org.knowsAbout).toEqual(
      expect.arrayContaining(["Axway", "Axway API Management", "Axway Amplify"]),
    );
  });

  it("gives a geo point matching the configured office coordinates", () => {
    const [org] = siteGraph("en", "desc")["@graph"];

    expect(org.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: siteConfig.coords.lat,
      longitude: siteConfig.coords.lng,
    });
  });

  it("links the profiles Google needs to resolve the same entity", () => {
    const [org] = siteGraph("en", "desc")["@graph"];

    expect(org.sameAs).toContain(siteConfig.social.facebook);
    expect(org.sameAs).toContain(siteConfig.mapsUrl);
  });

  it("points the WebSite node at the Organization by @id", () => {
    const [, site] = siteGraph("en", "desc")["@graph"];

    expect(site["@type"]).toBe("WebSite");
    expect(site.publisher).toEqual({ "@id": ORG_ID });
  });

  it.each([
    ["en", "en-US", `${siteConfig.url}/en`],
    ["th", "th-TH", `${siteConfig.url}/th`],
  ] as const)(
    "renders the %s WebSite node with the right language and url",
    (locale, bcp47, url) => {
      const [, site] = siteGraph(locale, "desc")["@graph"];

      expect(site.inLanguage).toBe(bcp47);
      expect(site.url).toBe(url);
    },
  );

  it("uses the description it is given on both nodes", () => {
    const [org, site] = siteGraph("en", "A description.")["@graph"];

    expect(org.description).toBe("A description.");
    expect(site.description).toBe("A description.");
  });
});

describe("servicesGraph", () => {
  const items = [
    { name: "API Management", description: "Axway Amplify." },
    { name: "MFT", description: "Managed file transfer." },
    { name: "Integration", description: "System integration." },
  ];

  it("numbers the list positions from one, in order", () => {
    // `position` is what tells a crawler this is the catalogue as the page
    // presents it, rather than three unrelated nodes.
    const graph = servicesGraph("en", items);

    expect(graph.itemListElement.map((entry) => entry.position)).toEqual([1, 2, 3]);
    expect(graph.itemListElement.map((entry) => entry.item.name)).toEqual([
      "API Management",
      "MFT",
      "Integration",
    ]);
  });

  it("attributes every service back to the Organization node", () => {
    const graph = servicesGraph("en", items);

    for (const entry of graph.itemListElement) {
      expect(entry.item.provider).toEqual({ "@id": ORG_ID });
    }
  });

  it("scopes the list @id to the locale's services page", () => {
    expect(servicesGraph("th", items)["@id"]).toBe(
      `${siteConfig.url}/th/services#catalogue`,
    );
  });

  it("tags each service with the page's language", () => {
    const graph = servicesGraph("th", items);

    for (const entry of graph.itemListElement) {
      expect(entry.item.inLanguage).toBe("th-TH");
    }
  });

  it("produces an empty list rather than throwing when given no items", () => {
    expect(servicesGraph("en", []).itemListElement).toEqual([]);
  });
});

describe("axwayPartnershipGraph", () => {
  const service = { name: "Axway partnership", description: "Official partner." };

  it("attributes the service to the company and the brand to Axway", () => {
    // This is what separates "we resell Axway" from "we name-drop Axway".
    const graph = axwayPartnershipGraph("en", service);

    expect(graph.provider).toEqual({ "@id": ORG_ID });
    expect(graph.brand).toMatchObject({
      "@type": "Brand",
      name: "Axway",
      url: "https://www.axway.com",
    });
  });

  it("keeps a stable @id so both pages that emit it describe one entity", () => {
    // Home and about both carry the partnership card; two different ids would
    // register as two different services.
    expect(axwayPartnershipGraph("en", service)["@id"]).toBe(
      axwayPartnershipGraph("th", service)["@id"],
    );
  });

  it("carries the supplied copy and the page language", () => {
    const graph = axwayPartnershipGraph("th", service);

    expect(graph.name).toBe("Axway partnership");
    expect(graph.description).toBe("Official partner.");
    expect(graph.inLanguage).toBe("th-TH");
  });
});

describe("breadcrumbGraph", () => {
  it("puts home first and the page second", () => {
    const graph = breadcrumbGraph("en", { name: "About", path: "/about" }, "Home");

    expect(graph.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteConfig.url}/en`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "About",
        item: `${siteConfig.url}/en/about`,
      },
    ]);
  });

  it("keeps the crumb inside the current locale", () => {
    const graph = breadcrumbGraph("th", { name: "เกี่ยวกับ", path: "/about" }, "หน้าแรก");

    for (const crumb of graph.itemListElement) {
      expect(crumb.item).toContain(`${siteConfig.url}/th`);
    }
  });
});
