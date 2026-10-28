import {
  BarChart,
  Bell,
  Building,
  Calendar,
  Camera,
  Clock,
  Cloud,
  Code,
  Cpu,
  Database,
  Download,
  FileText,
  Gear,
  Headset,
  Layers,
  ListChecks,
  Lock,
  Monitor,
  Search,
  Shield,
  Smartphone,
  Target,
  Users,
} from "@/components/ui/Icon";

/**
 * One badge colour per service, as the mockup numbers each card in its own
 * colour. Only the badge carries it — everything else on the card stays in the
 * site's navy and yellow. Literal class names because Tailwind scans source
 * text and cannot see a class built by string interpolation.
 */
const ACCENTS = {
  blue: "bg-gradient-to-br from-blue-500 to-blue-600",
  violet: "bg-gradient-to-br from-violet-500 to-purple-600",
  emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600",
  orange: "bg-gradient-to-br from-orange-400 to-orange-500",
  rose: "bg-gradient-to-br from-rose-500 to-red-500",
  green: "bg-gradient-to-br from-green-500 to-green-600",
} as const;

/**
 * Keys resolve against `services.items.*` in `messages/*.json`.
 *
 * - `slug` is the detail page's URL segment: `/services/<slug>`.
 * - `art` is the illustration on the card, the detail hero and the
 *   related-services list.
 * - `accent` colours the numbered badge (see ACCENTS).
 * - `highlightIcons` pair, in order, with `items.<key>.highlights`.
 * - `capabilityIcons` pair, in order, with `items.<key>.capabilities`.
 */
export const SERVICE_ITEMS = [
  {
    key: "custom",
    slug: "custom-software-development",
    art: "/assets/svc-art-custom.webp",
    accent: ACCENTS.blue,
    highlightIcons: [Target, Smartphone, FileText, Layers],
    capabilityIcons: [Monitor, FileText, Gear, Smartphone],
  },
  {
    key: "api",
    slug: "api-system-integration",
    art: "/assets/svc-art-api.webp",
    accent: ACCENTS.violet,
    highlightIcons: [Cloud, Code, Lock, Users],
    capabilityIcons: [Cloud, Layers, Building, Shield],
  },
  {
    key: "workflow",
    slug: "digital-workflow-e-services",
    art: "/assets/svc-art-workflow.webp",
    accent: ACCENTS.emerald,
    highlightIcons: [FileText, Search, ListChecks, Shield],
    capabilityIcons: [FileText, Layers, Lock, Monitor],
  },
  {
    key: "ai",
    slug: "ai-intelligent-solutions",
    art: "/assets/svc-art-ai.webp",
    accent: ACCENTS.orange,
    highlightIcons: [Gear, Camera, Bell, BarChart],
    capabilityIcons: [Cpu, BarChart, Shield, Gear],
  },
  {
    key: "security",
    slug: "it-infrastructure-cybersecurity",
    art: "/assets/svc-art-security.webp",
    accent: ACCENTS.rose,
    highlightIcons: [Lock, Shield, Database, Monitor],
    capabilityIcons: [Lock, Shield, Cloud, Monitor],
  },
  {
    key: "data",
    slug: "data-analytics",
    art: "/assets/svc-art-data.webp",
    accent: ACCENTS.blue,
    highlightIcons: [Monitor, Clock, Database, Download],
    capabilityIcons: [Database, BarChart, FileText, Target],
  },
  {
    key: "support",
    slug: "support-managed-services",
    art: "/assets/svc-art-support.webp",
    accent: ACCENTS.green,
    highlightIcons: [ListChecks, Clock, Gear, Calendar],
    capabilityIcons: [Headset, Users, Gear, Target],
  },
] as const;

export type ServiceItem = (typeof SERVICE_ITEMS)[number];

/** In-page sections of a detail page; ids double as the tab anchors. */
export const SERVICE_DETAIL_SECTIONS = [
  { id: "overview", icon: Layers },
  { id: "capabilities", icon: ListChecks },
  { id: "process", icon: Gear },
] as const;

/**
 * Cards per row on `lg`. The grid is declared with 12 columns so the first
 * rows' cards span 3 and an incomplete last row can stretch to the full width,
 * as the mockup lays it out (7 services: four across, then three wider ones).
 */
export const SERVICES_GRID_COLUMNS = 4;

/**
 * Span of each card in an incomplete last row, keyed by how many cards are
 * left over. Literal class names because Tailwind scans source text and cannot
 * see a class built by string interpolation.
 */
export const SERVICES_LAST_ROW_SPAN_CLASS: Record<number, string> = {
  1: "lg:col-span-12",
  2: "lg:col-span-6",
  3: "lg:col-span-4",
};
