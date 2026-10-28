"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react";

import { cn } from "@/lib/utils";

type RevealProps = ComponentProps<"div"> & {
  /** Milliseconds to wait after entering the viewport — staggers a list. */
  delay?: number;
};

/**
 * Plays the `.reveal` entrance (see globals.css) the first time the element
 * scrolls into view, then stops observing. Descendants marked `.reveal-item`
 * rise in after it, one by one. Hidden-until-revealed is CSS-only,
 * so reduced-motion and no-script visitors simply see the content.
 */
export default function Reveal({
  delay = 0,
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-shown={shown || undefined}
      className={cn("reveal", className)}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}
