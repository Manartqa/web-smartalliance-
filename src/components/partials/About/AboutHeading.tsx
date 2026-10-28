import type { ReactNode } from "react";

/**
 * Section heading for the about page: a yellow bar down the left of the title
 * and its optional subheading, as the mockup marks every section.
 */
export default function AboutHeading({
  children,
  subheading,
}: {
  children: ReactNode;
  subheading?: string;
}) {
  return (
    <div className="border-l-4 border-yellow pl-3">
      <h2 className="text-xl font-semibold leading-snug text-navy lg:text-2xl">
        {children}
      </h2>
      {subheading && (
        <p className="mt-1 text-sm font-light leading-relaxed text-body lg:text-[15px]">
          {subheading}
        </p>
      )}
    </div>
  );
}
