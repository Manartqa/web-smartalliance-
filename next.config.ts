import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isProduction = process.env.NODE_ENV === "production";

/**
 * Content Security Policy — **report-only for now, on purpose.**
 *
 * Enforcing it blind would break the site: the contact page frames Google Maps,
 * Next inlines its bootstrap script, and `next/image` writes inline `style`
 * attributes. Report-only leaves rendering untouched while violations show up
 * in the browser console, which is the evidence needed before switching the
 * header name to `Content-Security-Policy`.
 *
 * `'unsafe-inline'` in `script-src` is what the enforced version should shed
 * first, via a nonce — it is the difference between a policy that stops XSS and
 * one that only documents it.
 */
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // The Maps embed on /contact. `frame-src` governs what this page may frame;
  // `frame-ancestors` below governs who may frame this page.
  "frame-src https://www.google.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/**
 * Baseline security headers.
 *
 * None of these change a pixel — they constrain what a browser will do with the
 * response, not how it renders.
 */
const securityHeaders = [
  // Clickjacking: nothing on this site is meant to be framed. Duplicated as CSP
  // `frame-ancestors` above for browsers that prefer it.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the origin cross-site, the full URL same-site. Without this the Maps
  // iframe receives the complete referring URL.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
  // HSTS only in production: browsers ignore it over plain HTTP anyway, and
  // pinning a development host to HTTPS is a needless foot-gun.
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  /**
   * Emit `.next/standalone` — a self-contained server with only the modules the
   * app actually reaches, traced from the build.
   *
   * This is what gets deployed to App Service. Without it the artifact is the
   * whole `node_modules` tree (hundreds of MB, most of it devDependencies) and
   * the deploy has to run `npm install` on the host. With it the upload is a
   * few MB and the host runs `node server.js` against what is already there.
   *
   * The trade-off is that `.next/static` and `public` are NOT copied into it —
   * Next assumes a CDN serves them — so the packaging step in the deploy
   * workflow copies both, or the site loads with no CSS, JS or images.
   */
  output: "standalone",

  // Nothing gains from announcing the framework and version to a scanner.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  images: {
    // Design assets are PNG; serve modern formats where the browser supports them.
    formats: ["image/avif", "image/webp"],
  },
  // Testing on a real phone means loading the dev server over the LAN, and
  // `next dev` blocks cross-origin requests to `/_next/*` and the HMR socket by
  // default — the page still renders, but the dev runtime errors behind it.
  // Private ranges only, and development-only: this has no effect on `next build`.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "172.17.*.*"],
};

export default withNextIntl(nextConfig);
