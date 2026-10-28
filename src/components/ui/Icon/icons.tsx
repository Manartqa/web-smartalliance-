import type { SVGProps } from "react";

export function ChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 7 12"
      width="7"
      height="12"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M1 1l5 5-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 10"
      width="16"
      height="10"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M0 5h13.5M9.5 1l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Check(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 14 12"
      width="14"
      height="12"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M1.5 6l3.5 3.5L12.5 1.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
/**
 * 24×24 outline icons for the certification cards. They share one frame, so
 * each is just its paths; size them with `className` (h-5 w-5 and up).
 */
function StrokeIcon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function Target(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
      <path d="M12 3V1.5M21 12h1.5" />
    </StrokeIcon>
  );
}

export function FileText(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </StrokeIcon>
  );
}

export function Building(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M15 9h3a2 2 0 0 1 2 2v10" />
      <path d="M2.5 21h19M8 7h3M8 11h3M8 15h3" />
    </StrokeIcon>
  );
}

export function Calendar(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </StrokeIcon>
  );
}

export function Search(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </StrokeIcon>
  );
}

export function Download(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M4 19.5h16" />
    </StrokeIcon>
  );
}

/* Outline icons for the service detail pages, on the same 24×24 frame. */

export function Layers(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z" />
      <path d="M3.5 12L12 16.5l8.5-4.5M3.5 16L12 20.5l8.5-4.5" />
    </StrokeIcon>
  );
}

export function ListChecks(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M7.5 8.5h1M11 8.5h5.5M7.5 12h1M11 12h5.5M7.5 15.5h1M11 15.5h5.5" />
    </StrokeIcon>
  );
}

export function Gear(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
      <circle cx="12" cy="12" r="6.5" />
    </StrokeIcon>
  );
}

export function Users(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14a6.5 6.5 0 0 1 3.5 6" />
    </StrokeIcon>
  );
}

export function Lock(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" />
    </StrokeIcon>
  );
}

export function BarChart(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M3.5 20.5h17M6.5 20.5v-6M11 20.5V9M15.5 20.5v-8.5M20 20.5V4.5" />
    </StrokeIcon>
  );
}

export function Monitor(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <rect x="2.5" y="4" width="19" height="12.5" rx="1.5" />
      <path d="M8.5 20.5h7M12 16.5v4" />
    </StrokeIcon>
  );
}

export function Smartphone(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2" />
      <path d="M11 18h2" />
    </StrokeIcon>
  );
}

export function Cloud(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9a4.75 4.75 0 0 1-.5 9.5z" />
    </StrokeIcon>
  );
}

export function Shield(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 2.5l7.5 3v6c0 4.7-3.2 8.4-7.5 10-4.3-1.6-7.5-5.3-7.5-10v-6z" />
      <path d="M8.75 12l2.25 2.25 4.25-4.5" />
    </StrokeIcon>
  );
}

export function Database(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
      <path d="M4.5 5.5v13c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-13M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3" />
    </StrokeIcon>
  );
}

export function Cpu(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <path d="M9.5 9.5h5v5h-5zM9.5 2.5V6M14.5 2.5V6M9.5 18v3.5M14.5 18v3.5M2.5 9.5H6M2.5 14.5H6M18 9.5h3.5M18 14.5h3.5" />
    </StrokeIcon>
  );
}

export function Headset(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="3" y="13.5" width="4" height="6" rx="1.5" />
      <rect x="17" y="13.5" width="4" height="6" rx="1.5" />
      <path d="M19 19.5c0 1.5-2 2-5 2" />
    </StrokeIcon>
  );
}

export function Code(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15" />
    </StrokeIcon>
  );
}

export function Camera(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.7l1.6-2.5h6.4L16.8 7h2.7A1.5 1.5 0 0 1 21 8.5v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" />
      <circle cx="12" cy="13" r="3.75" />
    </StrokeIcon>
  );
}

export function Bell(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 21h4" />
    </StrokeIcon>
  );
}

export function Clock(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </StrokeIcon>
  );
}

export function Star(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </StrokeIcon>
  );
}

export function Home(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9v11h4.5v-6h4v6h4.5V9" />
    </StrokeIcon>
  );
}

export function Phone(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M5 3.5h3.5l1.5 4.5-2.25 1.5a11 11 0 0 0 6.75 6.75L16 14l4.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5A16 16 0 0 1 3.5 5 1.5 1.5 0 0 1 5 3.5z" />
    </StrokeIcon>
  );
}

export function HelpCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.25a2.5 2.5 0 1 1 3.5 2.3c-.6.27-1 .87-1 1.53v.42M12 16.75h.01" />
    </StrokeIcon>
  );
}

export function Globe(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </StrokeIcon>
  );
}
