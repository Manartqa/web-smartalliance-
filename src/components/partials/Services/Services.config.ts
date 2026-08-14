/** Keys resolve against `services.items.*` in `messages/*.json`. */
export const SERVICE_ITEMS = [
  { key: "custom", icon: "/assets/svc-custom.png" },
  { key: "api", icon: "/assets/svc-api.png" },
  { key: "workflow", icon: "/assets/svc-workflow.png" },
  { key: "ai", icon: "/assets/svc-ai.png" },
  { key: "security", icon: "/assets/svc-security.png" },
  { key: "data", icon: "/assets/svc-data.png" },
  { key: "support", icon: "/assets/svc-support.png" },
] as const;

/**
 * Cards per row on `lg`. The grid itself is declared with twice this many
 * columns so a card spans 2 — that half-column granularity is what lets an
 * incomplete last row be centred (see below).
 */
export const SERVICES_GRID_COLUMNS = 4;

/**
 * Where the first card of an incomplete last row starts, keyed by how many
 * cards are left over. With 7 services the remainder is 3, so the row begins at
 * column 2 of 8 and ends at column 7 — centred, exactly as the mockup lays it
 * out (row 2 spans 230–1210 on the 1440 canvas, dead centre).
 *
 * Written out as literal class names because Tailwind scans source text and
 * cannot see a class built by string interpolation.
 */
export const SERVICES_LAST_ROW_START_CLASS: Record<number, string> = {
  1: "lg:col-start-4",
  2: "lg:col-start-3",
  3: "lg:col-start-2",
};
