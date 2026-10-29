import { CERTIFICATIONS } from "@/components/partials/Home/Home.config";
import { SERVICE_ITEMS } from "@/components/partials/Services/Services.config";
import {
  BarChart,
  Building,
  Calendar,
  Gear,
  Star,
  Target,
  Users,
} from "@/components/ui/Icon";

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

/* ------------------------------------------------------------------
   About page only — the sections below are not part of AboutDetail,
   which the home page shares.
   ------------------------------------------------------------------ */

export const ABOUT_HERO_IMAGE = "/assets/hero-about.webp";
/** The office slideshow beside the company introduction, in showing order. */
export const ABOUT_OFFICE_IMAGES = Array.from(
  { length: 8 },
  (_, i) => `/assets/about-office-${i + 1}.webp`,
);

/** Icons for `about.hero.facts`, in order. */
export const ABOUT_HERO_FACT_ICONS = [Calendar, Users, Building] as const;

const service = (key: (typeof SERVICE_ITEMS)[number]["key"]) =>
  SERVICE_ITEMS.find((item) => item.key === key)!;

/**
 * The four expertise cards. Copy is `about.expertise.items.<key>`; each card
 * links to, and borrows the illustration of, one service detail page. The
 * mockup folds infrastructure and support into one card, which points at the
 * infrastructure page.
 */
export const ABOUT_EXPERTISE = [
  { key: "custom", service: service("custom") },
  { key: "api", service: service("api") },
  { key: "workflow", service: service("workflow") },
  { key: "infra", service: service("security") },
] as const;

/** Icons for `about.timeline.items`, in order. */
export const ABOUT_TIMELINE_ICONS = [
  Building,
  Gear,
  BarChart,
  Star,
  Target,
] as const;

/** The ISO 9001 certificate, shared with the home page's certification cards. */
export const ABOUT_ISO = CERTIFICATIONS.find((cert) => cert.key === "iso9001")!;

export interface AboutClient {
  /** Stable key; also the logo's file name under `/assets/clients/`. */
  id: string;
  th: string;
  /** The Thai name is set smaller on the card, so it fits on one line. */
  thCompact?: boolean;
  en: string;
  /**
   * Path to the organization's logo, e.g. `/assets/clients/customs.png`.
   * Cards without one show the names only, so logos can arrive one at a time.
   */
  logo?: string;
}

/**
 * Client organizations: the government agencies listed in the company profile
 * ("ลูกค้าของเรา — กลุ่มหน่วยงานภาครัฐ"), in its order. Named in both languages
 * in every locale; the page puts the current locale's name first.
 */
export const ABOUT_CLIENTS: readonly AboutClient[] = [
  {
    id: "defence-industry",
    th: "กรมการอุตสาหกรรมทหาร",
    en: "Defence Industry Department",
    logo: "/assets/clients/defence-industry.png",
  },
  {
    id: "medical-sciences",
    th: "กรมวิทยาศาสตร์การแพทย์",
    en: "Department of Medical Sciences",
    logo: "/assets/clients/medical-sciences.png",
  },
  {
    id: "fda",
    th: "สำนักงานคณะกรรมการอาหารและยา",
    thCompact: true,
    en: "Food and Drug Administration",
    logo: "/assets/clients/fda.png",
  },
  {
    id: "land-development",
    th: "กรมพัฒนาที่ดิน",
    en: "Land Development Department",
    logo: "/assets/clients/land-development.png",
  },
  {
    id: "statistics",
    th: "สำนักงานสถิติแห่งชาติ",
    en: "National Statistical Office",
    logo: "/assets/clients/statistics.png",
  },
  {
    id: "national-parks",
    th: "กรมอุทยานแห่งชาติ สัตว์ป่า และพันธุ์พืช",
    thCompact: true,
    en: "Department of National Parks, Wildlife and Plant Conservation",
    logo: "/assets/clients/national-parks.png",
  },
  {
    id: "customs",
    th: "กรมศุลกากร",
    en: "The Customs Department",
    logo: "/assets/clients/customs.png",
  },
  {
    id: "nsw",
    th: "Thailand National Single Window (NSW)",
    en: "Thailand National Single Window (NSW)",
    logo: "/assets/clients/nsw.png",
  },
  {
    id: "pwa",
    th: "การประปาส่วนภูมิภาค",
    en: "Provincial Waterworks Authority",
    logo: "/assets/clients/pwa.png",
  },
  {
    id: "excise",
    th: "กรมสรรพสามิต",
    en: "Excise Department",
    logo: "/assets/clients/excise.png",
  },
  {
    id: "atoms-for-peace",
    th: "สำนักงานปรมาณูเพื่อสันติ",
    en: "Office of Atoms for Peace",
    logo: "/assets/clients/atoms-for-peace.png",
  },
  {
    id: "tint",
    th: "สถาบันเทคโนโลยีนิวเคลียร์แห่งชาติ",
    thCompact: true,
    en: "Thailand Institute of Nuclear Technology",
    logo: "/assets/clients/tint.png",
  },
];
