"use client";

import type { ReactNode } from "react";

import { QueryProvider } from "@/context/query/QueryProvider";

/**
 * Single mount point for every client-side provider, wrapped once in the locale
 * layout — never per page.
 *
 * Order (outermost → innermost): QueryProvider → app. `NextIntlClientProvider`
 * stays in the layout above this because it is fed by the server request
 * config, and there is no `NextAuthProvider` — the site has no authenticated
 * area.
 *
 * The UI layer is shadcn/ui-style: Tailwind v4 tokens in `globals.css` plus
 * locally owned components under `components/ui/*`, so no theme provider is
 * required.
 */
export function UIProvider({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
