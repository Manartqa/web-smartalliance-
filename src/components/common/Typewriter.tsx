"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

interface TypewriterLine {
  text: string;
  className?: string;
}

interface TypewriterProps {
  lines: TypewriterLine[];
  /** Milliseconds per character. */
  speed?: number;
}

const START_DELAY = 400;
const LINE_PAUSE = 350;

/**
 * Types `lines` out one character at a time, each line on its own row.
 *
 * - The full text is always in the DOM (screen-reader only), so the heading
 *   reads — and indexes — complete from the first byte of HTML.
 * - Each row keeps an invisible copy of its full text underneath, so the box
 *   is its final size from the start and nothing below it shifts.
 * - Splits by grapheme, not code unit: a Thai vowel or tone mark never appears
 *   apart from the consonant it sits on.
 * - Reduced motion shows everything at once; without scripting the hidden copy
 *   is made visible by CSS (see `.typewriter-ghost` in globals.css).
 */
export default function Typewriter({ lines, speed = 90 }: TypewriterProps) {
  const graphemes = useMemo(() => {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return lines.map((line) =>
      Array.from(segmenter.segment(line.text), (part) => part.segment),
    );
  }, [lines]);

  // Running total at the end of each line: [12, 31] for lengths 12 and 19.
  const lineEnds = graphemes.reduce<number[]>(
    (ends, chars) => [...ends, (ends.at(-1) ?? 0) + chars.length],
    [],
  );
  const total = lineEnds.at(-1) ?? 0;

  const [count, setCount] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let typed = 0;
    let timer: number;

    const tick = () => {
      typed = reduced ? total : typed + 1;
      setCount(typed);
      if (typed < total) {
        timer = window.setTimeout(
          tick,
          lineEnds.includes(typed) ? LINE_PAUSE : speed,
        );
      }
    };

    timer = window.setTimeout(tick, reduced ? 0 : START_DELAY);
    return () => window.clearTimeout(timer);
    // `lineEnds` is derived from `lines`; `total` changing covers it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, speed]);

  // The caret sits on the line being typed — `<=` keeps it at the end of a
  // finished line through the pause — and goes away once everything is typed.
  const activeLine =
    count < total ? lineEnds.findIndex((end) => count <= end) : -1;

  return (
    <>
      <span className="sr-only">
        {lines.map((line) => line.text).join(" ")}
      </span>
      <span aria-hidden>
        {lines.map((line, index) => {
          const start = index === 0 ? 0 : lineEnds[index - 1]!;
          const shown = graphemes[index]!.slice(
            0,
            Math.max(0, count - start),
          ).join("");

          return (
            <span key={index} className={cn("relative block", line.className)}>
              <span className="typewriter-ghost">{line.text}</span>
              <span className="typewriter-typed absolute inset-0">
                {shown}
                {index === activeLine && <span className="typewriter-caret" />}
              </span>
            </span>
          );
        })}
      </span>
    </>
  );
}
