/**
 * Keys resolve against the `about.*` namespace in `messages/*.json`.
 *
 * Listed in reading order — down the first column, then the second — which is
 * how the mockup arranges them (left column at y 401/441/481, right column at
 * y 401/441). `AboutDetail` splits the array in half to build the two columns.
 */
export const ABOUT_POINTS = [
  "experience",
  "integration",
  "delivery",
  "custom",
  "projects",
] as const;

export const ABOUT_STATS = [
  { key: "experience", icon: "/assets/ic-badge.png" },
  { key: "projects", icon: "/assets/stat-users.png" },
  { key: "delivery", icon: "/assets/stat-box.png" },
  { key: "partner", icon: "/assets/stat-shield.png" },
] as const;
