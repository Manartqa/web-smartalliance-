import { PageBody } from "@/components/common";
import { CtaBand } from "@/components/layout/CtaBand";
// The company overview is owned by the About feature and reused verbatim here,
// imported through its barrel rather than duplicated.
import { AboutDetail } from "@/components/partials/About";

import HomeHero from "./HomeHero";

/** Entry point for the home page. Server component — no state, no handlers. */
export default function HomeContent() {
  return (
    <>
      <HomeHero />
      <PageBody>
        <AboutDetail />
        <CtaBand variant="home" />
      </PageBody>
    </>
  );
}
