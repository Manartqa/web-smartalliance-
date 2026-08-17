import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * Crawlers that answer questions rather than return links: assistants fetching
 * a page a user asked about, and the indexers behind AI search results.
 * Allowing them is what makes the company citable in an AI answer.
 */
const AI_SEARCH_AGENTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
];

/**
 * Crawlers that collect pages for model training. Separated from the group
 * above because the trade is different — no referral traffic comes back — so
 * this is the list to flip to `disallow` if the company ever decides its copy
 * should not be trained on. Doing that costs nothing above: AI *search* keeps
 * working, because those bots are in their own group.
 */
const AI_TRAINING_AGENTS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Meta-ExternalAgent",
  "Bytespider",
];

/**
 * `/api/` is disallowed because nothing under it is a page: the contact
 * endpoint only answers POST, so a crawler that fetches it gets a 405 and
 * spends crawl budget on an error. Everything else is open.
 *
 * The AI groups repeat that rule rather than inheriting it. A named group
 * *replaces* the `*` group for the agent it names — it does not add to it — so
 * an agent listed below would otherwise be free to crawl `/api/`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/" },
      { userAgent: AI_SEARCH_AGENTS, allow: "/", disallow: "/api/" },
      { userAgent: AI_TRAINING_AGENTS, allow: "/", disallow: "/api/" },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
