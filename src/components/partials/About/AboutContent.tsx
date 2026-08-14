import { PageBody } from "@/components/common";
import { CtaBand } from "@/components/layout/CtaBand";

import AboutDetail from "./AboutDetail";
import AboutHero from "./AboutHero";

/**
 * Entry point for the about page. Stays a server component — nothing on this
 * page holds state or handles events, so there is no `"use client"` boundary.
 */
export default function AboutContent() {
  return (
    <>
      <AboutHero />
      <PageBody>
        <AboutDetail />
        <CtaBand variant="home" />
      </PageBody>
    </>
  );
}
