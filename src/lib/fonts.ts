import { Montserrat, Noto_Sans_Thai } from "next/font/google";

/**
 * Two faces, paired by script rather than by locale.
 *
 * Montserrat sits first in the stack and carries all Latin text; it has no Thai
 * glyphs, so Thai characters fall through to Noto Sans Thai automatically. That
 * happens per character, not per page — an English product name inside a Thai
 * sentence still renders in Montserrat, which is the intent.
 *
 * Weights are limited to the ones the UI uses: 300 (`font-light`), 400 (body
 * default), 500 (`font-medium`), 600 (`font-semibold`) and 700 for `<strong>`.
 * Both families are variable and have no italic; nothing in the design asks for
 * one.
 *
 * `next/font/google` self-hosts the files at build time — no request ever goes
 * to Google at runtime.
 */
export const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/** Thai-only subset: Montserrat already covers Latin, digits and punctuation. */
export const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const fontVariables = [montserrat.variable, notoSansThai.variable].join(" ");
