import type { ReactNode, SVGProps } from "react";

/**
 * Footer social icons.
 *
 * These replace three PNGs that had the footer's navy baked into the bitmap.
 * Geometry is taken from those originals so the row is unchanged: a 106×106
 * box, a 2px ring at r=42.75, and the glyph filling roughly 48×48 in the
 * middle. Everything paints in `currentColor`, and the footer sets that to
 * `white/60` — which composites to the originals' #99a3b1 over #001a3d.
 */
const GLYPH_BOX = "translate(29 29) scale(2)"; // maps a 24×24 grid to 48×48, centred

function SocialFrame({
  children,
  ...props
}: { children: ReactNode } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 106 106"
      width="38"
      height="38"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <circle cx="53" cy="53" r="42.75" stroke="currentColor" strokeWidth="2" />
      {children}
    </svg>
  );
}

export function SocialFacebook(props: SVGProps<SVGSVGElement>) {
  return (
    <SocialFrame {...props}>
      {/* Official "facebook-f" outline on its native 320×512 grid, scaled to
          the ~24×39 the original bitmap used. */}
      <g transform="translate(40.8 33.5) scale(0.0762)">
        <path
          fill="currentColor"
          d="M80 299.3V512h116V299.3h86.5l18-97.8H196v-34.6c0-51.7 20.3-71.5 72.7-71.5 16.3 0 29.4 .4 37 1.2V7.9C291.4 4 256.4 0 236.2 0 129.3 0 80 50.5 80 159.4v42.1H14v97.8h66z"
        />
      </g>
    </SocialFrame>
  );
}

export function SocialMail(props: SVGProps<SVGSVGElement>) {
  return (
    <SocialFrame {...props}>
      <g
        transform={GLYPH_BOX}
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2.75" y="4.5" width="18.5" height="15" rx="2.5" />
        <path d="M4.75 7.25 12 12.75l7.25-5.5" />
      </g>
    </SocialFrame>
  );
}

export function SocialPhone(props: SVGProps<SVGSVGElement>) {
  return (
    <SocialFrame {...props}>
      <g transform={GLYPH_BOX}>
        <path
          fill="currentColor"
          d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2c.28-.28.68-.36 1.02-.25 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
        />
      </g>
    </SocialFrame>
  );
}
