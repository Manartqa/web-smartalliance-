import { getLocale, getTranslations } from "next-intl/server";

import { ABOUT_CLIENTS } from "./About.config";
import AboutClientsCarousel from "./AboutClientsCarousel";
import AboutHeading from "./AboutHeading";

/** Client organizations; the current locale's name leads on each card. */
export default async function AboutClients() {
  const t = await getTranslations("about.clients");
  const locale = await getLocale();

  // The NSW has one name in both languages; it shows once, not twice.
  const clients = ABOUT_CLIENTS.map((client) => ({
    id: client.id,
    logo: client.logo,
    primary: locale === "th" ? client.th : client.en,
    secondary:
      client.th === client.en ? null : locale === "th" ? client.en : client.th,
  }));

  return (
    <section className="container-site py-14 lg:py-16">
      <AboutClientsCarousel
        heading={
          <AboutHeading subheading={t("subheading")}>
            {t("heading")}
          </AboutHeading>
        }
        clients={clients}
        previousLabel={t("previous")}
        nextLabel={t("next")}
      />
    </section>
  );
}
