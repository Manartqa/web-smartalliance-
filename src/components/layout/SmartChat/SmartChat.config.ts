import type { ComponentType, SVGProps } from "react";

import { SERVICE_ITEMS } from "@/components/partials/Services/Services.config";
import {
  Building,
  FileText,
  Headset,
  HelpCircle,
  Layers,
  Phone,
} from "@/components/ui/Icon";

/**
 * Where the privacy notice's acknowledgement is remembered (browser storage,
 * kept across visits). The stored value is the notice version, so changing
 * the wording materially and bumping the version shows it to everyone again.
 */
export const PRIVACY_ACK_KEY = "smart-chat-privacy-ack";
export const PRIVACY_NOTICE_VERSION = "2026-10-28";

/**
 * Everything น้อง SMART can answer. The first six are on the menu; `about`
 * and `clients` are reached only by typing (keywords below). Copy is
 * `chat.topics.<key>` and `chat.replies.<key>`.
 */
export type ChatTopicKey =
  | "services"
  | "contact"
  | "industries"
  | "faq"
  | "quote"
  | "staff"
  | "about"
  | "clients";

/** Frequently asked questions: `chat.faq.<key>.question` / `.answer`. */
export const CHAT_FAQ = [
  "cloud",
  "security",
  "timeline",
  "government",
] as const;
export type ChatFaqKey = (typeof CHAT_FAQ)[number];

export type ChatReply =
  | { kind: "topic"; key: ChatTopicKey }
  | { kind: "faq"; key: ChatFaqKey }
  | { kind: "fallback" };

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export const CHAT_TOPIC_ICONS: Partial<Record<ChatTopicKey, Icon>> = {
  services: Layers,
  contact: Phone,
  industries: Building,
  faq: HelpCircle,
  quote: FileText,
  staff: Headset,
};

/** The menu cards, in reading order (two columns on wide screens). */
export const CHAT_CARDS: readonly ChatTopicKey[] = [
  "services",
  "contact",
  "industries",
  "faq",
  "quote",
  "staff",
];

/** The sidebar, below its "home" item. */
export const CHAT_SIDEBAR: readonly ChatTopicKey[] = [
  "services",
  "industries",
  "quote",
  "contact",
  "faq",
];

function service(key: (typeof SERVICE_ITEMS)[number]["key"]) {
  return SERVICE_ITEMS.find((item) => item.key === key)!;
}

/** Where each answer's "read more" link goes. */
export const CHAT_REPLY_LINKS: Record<
  ChatTopicKey | ChatFaqKey | "fallback",
  string
> = {
  services: "/services",
  contact: "/contact",
  industries: "/contact",
  faq: "/contact",
  quote: "/contact",
  staff: "/contact",
  about: "/about",
  clients: "/about#clients",
  cloud: `/services/${service("security").slug}`,
  security: `/services/${service("security").slug}`,
  timeline: "/contact",
  government: "/about#clients",
  fallback: "/contact",
};

/**
 * The industries answer: which services suit which kind of organization.
 * Group labels are `chat.industries.<key>`.
 */
export const CHAT_INDUSTRIES = [
  { key: "government", services: ["workflow", "api", "custom", "security"] },
  { key: "enterprise", services: ["custom", "api", "ai", "data", "support"] },
] as const;

/**
 * Routes a typed question to an answer. Checked top to bottom, so specific
 * questions (an FAQ, a price) win over broad ones ("service"): "ราคาบริการ"
 * (service pricing) is a quote question. Thai keywords match anywhere in the
 * text (Thai has no spaces between words); Latin ones only as whole words, so
 * "ai" does not match inside "email".
 */
const MATCHERS: readonly { reply: ChatReply; keywords: readonly string[] }[] = [
  { reply: { kind: "faq", key: "cloud" }, keywords: ["คลาวด์", "cloud"] },
  {
    reply: { kind: "faq", key: "security" },
    keywords: [
      "ไซเบอร์",
      "ความปลอดภัย",
      "ความมั่นคงปลอดภัย",
      "cybersecurity",
      "cyber",
      "security",
      "mfa",
      "2fa",
    ],
  },
  {
    reply: { kind: "faq", key: "timeline" },
    keywords: [
      "ระยะเวลา",
      "กี่วัน",
      "กี่เดือน",
      "นานแค่ไหน",
      "นานไหม",
      "timeline",
      "how long",
      "duration",
    ],
  },
  {
    reply: { kind: "faq", key: "government" },
    keywords: [
      "ภาครัฐ",
      "หน่วยงานรัฐ",
      "ราชการ",
      "government",
      "public sector",
    ],
  },
  {
    reply: { kind: "topic", key: "quote" },
    keywords: [
      "ราคา",
      "ใบเสนอราคา",
      "ค่าใช้จ่าย",
      "งบประมาณ",
      "price",
      "pricing",
      "quote",
      "quotation",
      "cost",
      "budget",
    ],
  },
  {
    reply: { kind: "topic", key: "staff" },
    keywords: [
      "เจ้าหน้าที่",
      "พนักงาน",
      "คุยกับคน",
      "staff",
      "human",
      "agent",
      "person",
      "representative",
    ],
  },
  {
    reply: { kind: "topic", key: "contact" },
    keywords: [
      "ติดต่อ",
      "โทร",
      "อีเมล",
      "เบอร์",
      "ที่อยู่",
      "แผนที่",
      "สำนักงาน",
      "contact",
      "phone",
      "call",
      "email",
      "address",
      "location",
      "office",
    ],
  },
  {
    reply: { kind: "topic", key: "clients" },
    keywords: [
      "ลูกค้า",
      "หน่วยงาน",
      "ผลงาน",
      "client",
      "clients",
      "customer",
      "customers",
      "reference",
      "references",
    ],
  },
  {
    reply: { kind: "topic", key: "industries" },
    keywords: [
      "อุตสาหกรรม",
      "ธุรกิจ",
      "industry",
      "industries",
      "sector",
      "business",
    ],
  },
  {
    reply: { kind: "topic", key: "faq" },
    keywords: ["คำถามที่พบบ่อย", "faq", "frequently asked"],
  },
  {
    reply: { kind: "topic", key: "about" },
    keywords: [
      "เกี่ยวกับ",
      "บริษัท",
      "ประวัติ",
      "ประสบการณ์",
      "มาตรฐาน",
      "about",
      "company",
      "history",
      "experience",
      "iso",
      "axway",
    ],
  },
  {
    reply: { kind: "topic", key: "services" },
    keywords: [
      "บริการ",
      "ซอฟต์แวร์",
      "ระบบ",
      "เชื่อมโยง",
      "ข้อมูล",
      "service",
      "services",
      "software",
      "system",
      "integration",
      "api",
      "ai",
      "data",
      "support",
    ],
  },
];

const hasKeyword = (text: string, keyword: string) =>
  /[a-z]/.test(keyword)
    ? new RegExp(`\\b${keyword}\\b`).test(text)
    : text.includes(keyword);

/** The answer for a typed question; `fallback` when nothing matches. */
export function matchReply(question: string): ChatReply {
  const text = question.toLowerCase();
  const match = MATCHERS.find(({ keywords }) =>
    keywords.some((keyword) => hasKeyword(text, keyword)),
  );
  return match?.reply ?? { kind: "fallback" };
}

/** How many client names the clients answer lists before "and more". */
export const CHAT_CLIENT_NAMES = 6;
