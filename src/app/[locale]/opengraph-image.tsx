import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";
import { locales } from "@/i18n/routing";

/**
 * The social card every share of this site falls back to.
 *
 * Drawn rather than shipped as a PNG so it cannot drift from the brand colours
 * or the 1200×630 that Facebook, LinkedIn and X all crop to. Copy is English
 * for both locales on purpose: the bundled font has no Thai glyphs, and Thai
 * text would render as empty boxes.
 */

export const alt = "Smart Alliance — Beyond Software. We Build Solutions.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Prerenders one card per locale instead of generating them on request. */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const NAVY = "#002a62";
const ACCENT = "#ffc300";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: NAVY,
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{ width: 14, height: 44, background: ACCENT, borderRadius: 3 }}
          />
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.02em",
            }}
          >
            SMART Alliance
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Two elements rather than one with a <br>: Satori refuses any node
              with more than one child unless `display` is set explicitly. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.15,
              color: "#ffffff",
              maxWidth: 900,
            }}
          >
            <div>Beyond Software.</div>
            <div>We Build Solutions.</div>
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 28,
              lineHeight: 1.4,
              color: "#a9bede",
              maxWidth: 860,
            }}
          >
            {/* One interpolated string, not text + expression + text: Satori
                counts those as three children and rejects the node. */}
            {`Custom software, system integration and digital solutions for government agencies and enterprises — since ${siteConfig.foundedYear}.`}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 24,
            color: ACCENT,
          }}
        >
          {siteConfig.website}
        </div>
      </div>
    ),
    size,
  );
}
