import type { Metadata } from "next";

import { NotFoundContent } from "@/components/partials/NotFound";

/**
 * 404 boundary for everything under `/[locale]`. Renders inside the locale
 * layout, so the header, footer and translations are already in place.
 *
 * The `noindex` is belt and braces — the response already carries a 404 status,
 * which is what a crawler acts on — but it also covers the case where a proxy
 * or CDN rewrites the status on the way out.
 */
export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: true },
};

export default function LocaleNotFound() {
  return <NotFoundContent />;
}
