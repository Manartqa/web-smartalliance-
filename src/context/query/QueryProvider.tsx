"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * No caching by default — every query refetches on mount. The site's only
 * server interaction is the contact mutation, so nothing here should be
 * served stale.
 */
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: 0, gcTime: 0, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  });

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState keeps one client per browser session and avoids sharing a client
  // between requests on the server.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
