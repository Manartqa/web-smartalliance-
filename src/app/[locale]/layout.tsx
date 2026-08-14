import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { JsonLd } from "@/components/common";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { UIProvider } from "@/components/providers";
import { routing, type Locale } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { siteGraph } from "@/lib/structured-data";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Opts every page in this segment into static rendering.
  setRequestLocale(locale);

  // The company record travels with every page rather than the home page
  // alone — search engines index each URL on its own, and a deep link is often
  // the only page a crawler sees.
  const t = await getTranslations({ locale, namespace: "meta.home" });
  const graph = siteGraph(locale as Locale, t("description"));

  return (
    // `suppressHydrationWarning`: browser extensions (screen recorders, password
    // managers) stamp their own attributes on <html> before React hydrates, so
    // the server HTML can never match. Scoped to this element only — children
    // still report real mismatches.
    <html
      lang={locale}
      className={fontVariables}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      {/* No `overflow-x-hidden` on <body>: it turns body into a scroll
          container, which silently kills `position: sticky` on the hero. */}
      <body className="flex min-h-screen flex-col">
        {/* Provider order: NextIntl → UIProvider (React Query) → app. */}
        <NextIntlClientProvider>
          <UIProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <JsonLd data={graph} />
          </UIProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
