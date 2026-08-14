import type { ReactNode } from "react";

/**
 * Everything below the hero.
 *
 * The hero is `sticky top-0 z-0`, so it stays pinned while this wrapper — which
 * is opaque and sits on a higher layer — scrolls up over it. That gives the
 * "fixed hero" look without locking 73% of the viewport the way a genuinely
 * fixed hero plus an inner scroll container would.
 *
 * The white background is load-bearing: without it the pinned hero shows
 * through the sections that have no background of their own.
 */
export function PageBody({ children }: { children: ReactNode }) {
  return <div className="relative z-10 bg-white">{children}</div>;
}
