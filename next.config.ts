import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
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
