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
  // Static: a not-found boundary gets no params, so no locale to translate by.
  title: "Page not found — Smart Alliance",
  robots: { index: false, follow: true },
};

export default function LocaleNotFound() {
  return <NotFoundContent />;
}
