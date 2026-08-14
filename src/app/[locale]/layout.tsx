import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { UIProvider } from "@/components/providers";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
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
          </UIProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
