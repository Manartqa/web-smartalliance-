import { getTranslations } from "next-intl/server";

import { SERVICE_ITEMS } from "@/components/partials/Services/Services.config";
import { navItems, siteConfig } from "@/config/site";
import { locales } from "@/i18n/routing";

/**
 * Builds `/llms.txt` — the plain-text site summary that AI assistants and
 * research tools read before deciding what to fetch.
 *
 * Why it exists alongside the sitemap: a sitemap lists URLs, and an assistant
 * answering "who integrates Axway in Thailand" has to fetch and read all eight
 * of them to find out. This file states what the company does, which pages
 * cover what, and the facts most questions are actually about — in the format
 * (`llmstxt.org`) those tools already look for at the site root.
 *
 * Everything is derived from the same messages and config the pages render
 * from, so it cannot drift from the site the way a hand-written summary would.
 *
 * English only, by convention: this is a machine-facing index, and the Thai
 * pages are listed with their own URLs at the end.
 */
export async function buildLlmsTxt(): Promise<string> {
  const t = await getTranslations({ locale: "en", namespace: "meta" });
  const nav = await getTranslations({ locale: "en", namespace: "nav" });
  const services = await getTranslations({
    locale: "en",
    namespace: "services.items",
  });
  const about = await getTranslations({ locale: "en", namespace: "about" });

  const url = (locale: string, path: string) =>
    `${siteConfig.url}/${locale}${path === "/" ? "" : path}`;

  const pageKeys = ["home", "about", "services", "contact"] as const;

  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${t("home.description")}`,
    "",
    `Founded ${siteConfig.foundedYear} in Bangkok, Thailand. The site is published in English and Thai; the two carry the same content at \`/en\` and \`/th\`.`,
    "",
    "## Pages",
    "",
    ...pageKeys.map(
      (key, i) =>
        `- [${nav(key)}](${url("en", navItems[i].href)}): ${t(`${key}.description`)}`,
    ),
    "",
    "## Services",
    "",
    ...SERVICE_ITEMS.map(
      ({ key }) =>
        `- **${services(`${key}.title`)}**: ${services(`${key}.body`)}`,
    ),
    "",
    "## Technology partnership",
    "",
    `- ${about("partnership.body")}`,
    `- Details: ${url("en", "/about")}#axway`,
    "",
    "## Company facts",
    "",
    `- Legal name: ${siteConfig.name}`,
    `- Founded: ${siteConfig.foundedYear}`,
    `- Address: ${siteConfig.address.line1} ${siteConfig.address.line2}`,
    `- Telephone: ${siteConfig.phone}`,
    `- Email: ${siteConfig.email}`,
    `- Languages: English, Thai`,
    `- Machine-readable company record: JSON-LD (\`Organization\` + \`LocalBusiness\`) is embedded in every page.`,
    "",
    "## Thai versions",
    "",
    ...pageKeys.map(
      (key, i) => `- [${nav(key)} (ไทย)](${url("th", navItems[i].href)})`,
    ),
    "",
  ];

  // `locales` is referenced so the two-locale assumption above fails loudly if
  // a third language is ever added (see "Adding a third locale" in the README).
  if (locales.length !== 2) {
    lines.push(`> Note: this site now has ${locales.length} locales.`, "");
  }

  return lines.join("\n");
}
