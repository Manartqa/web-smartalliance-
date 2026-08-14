import { PageBody } from "@/components/common";
import { CtaBand } from "@/components/layout/CtaBand";

import ServicesDetail from "./ServicesDetail";
import ServicesHero from "./ServicesHero";

/** Entry point for the services page. Server component — no state, no handlers. */
export default function ServicesContent() {
  return (
    <>
      <ServicesHero />
      <PageBody>
        <ServicesDetail />
        <CtaBand variant="services" />
      </PageBody>
    </>
  );
}
