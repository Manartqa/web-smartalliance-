/** Keys resolve against the `about.*` namespace in `messages/*.json`. */
export const ABOUT_POINTS = [
  "experience",
  "custom",
  "integration",
  "projects",
  "delivery",
] as const;

export const ABOUT_STATS = [
  { key: "experience", icon: "/assets/ic-badge.png" },
  { key: "projects", icon: "/assets/stat-users.png" },
  { key: "delivery", icon: "/assets/stat-box.png" },
  { key: "partner", icon: "/assets/stat-shield.png" },
] as const;
