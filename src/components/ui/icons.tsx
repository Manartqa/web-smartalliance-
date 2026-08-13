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
