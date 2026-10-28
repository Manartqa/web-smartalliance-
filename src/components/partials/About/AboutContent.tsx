import { CtaBand } from "@/components/layout/CtaBand";

import AboutClients from "./AboutClients";
import AboutHero from "./AboutHero";
import AboutIntro from "./AboutIntro";
import AboutJourney from "./AboutJourney";

/**
 * Entry point for the about page. Server components throughout; the only
 * client code is the client-logo carousel's scroll buttons.
 *
 * Not built from `AboutDetail` any more — that overview now lives only on the
 * home page. The hero here is an ordinary section, not the sticky shared
 * `Hero`, so the page needs no `PageBody` to scroll over it.
 */
export default function AboutContent() {
  return (
    <>
      <AboutHero />
      <AboutIntro />
      <AboutJourney />
      <AboutClients />
      <CtaBand variant="about" />
    </>
  );
}
