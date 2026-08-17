import { notFound } from "next/navigation";

/**
 * Catches every unmatched path under a locale and hands it to
 * `[locale]/not-found.tsx`.
 *
 * Without this, `/en/anything` never enters the locale segment at all: Next
 * falls back to the *root* not-found, which renders outside this layout — no
 * header, no footer, no translations, and no way back into the site. A static
 * route always wins over a catch-all, so the four real pages are unaffected.
 */
export default function CatchAllPage() {
  notFound();
}
