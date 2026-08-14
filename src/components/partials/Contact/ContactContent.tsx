import { PageBody } from "@/components/common";
import { CtaBand } from "@/components/layout/CtaBand";

import ContactDetail from "./ContactDetail";
import ContactHero from "./ContactHero";
import ContactMap from "./ContactMap";

/** Entry point for the contact page. */
export default function ContactContent() {
  return (
    <>
      <ContactHero />
      <PageBody>
        <ContactDetail />
        <ContactMap />
        <CtaBand variant="contact" />
      </PageBody>
    </>
  );
}
