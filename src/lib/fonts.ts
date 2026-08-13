import localFont from "next/font/local";
import { Noto_Sans_Thai } from "next/font/google";

/**
 * Latin display/body faces lifted from the original design (subset woff2).
 * Neither covers Thai glyphs, so `notoThai` sits behind them in the CSS stack
 * and the browser falls through to it automatically for Thai text.
 */
export const poppins = localFont({
  variable: "--font-poppins",
  display: "swap",
  src: [
    { path: "../fonts/poppins-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/poppins-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/poppins-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/poppins-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/poppins-700.woff2", weight: "700", style: "normal" },
  ],
});

export const jakarta = localFont({
  variable: "--font-jakarta",
  display: "swap",
  src: [
    { path: "../fonts/jakarta-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/jakarta-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/jakarta-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/jakarta-600.woff2", weight: "600", style: "normal" },
  ],
});

export const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const fontVariables = [
  poppins.variable,
  jakarta.variable,
  notoThai.variable,
].join(" ");
