import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // Design assets are PNG; serve modern formats where the browser supports them.
    formats: ["image/avif", "image/webp"],
  },
};

export default withNextIntl(nextConfig);
