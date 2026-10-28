"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Pace of the first pass, which draws the rail and brings each milestone in. */
const INTRO_STEP_MS = 400;
/** How long each milestone stays highlighted once the first pass is done. */
const CYCLE_MS = 2000;

interface Milestone {
  period: string;
  body: string;
  icon: ReactNode;
}

/**
 * The company timeline. When it scrolls into view the rail draws itself left
 * to right and each milestone fades in as the rail reaches it; after that the
 * highlight moves on one milestone every few seconds and starts over after
 * the last. It holds still under the pointer, and for visitors who ask for
 * reduced motion it is a still picture, as it is before hydration.
 */
export default function AboutTimeline({
  milestones,
}: {
  milestones: Milestone[];
}) {
  const listRef = useRef<HTMLOListElement>(null);
  // null: the still picture. -1: waiting to scroll into view.
  // 0 and up: the highlighted milestone.
  const [active, setActive] = useState<number | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const [paused, setPaused] = useState(false);
  const last = milestones.length - 1;

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // The first callback arrives straight away with the starting position, so
    // a timeline below the fold hides until it is scrolled to.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          setActive(-1);
          return;
        }
        setActive(0);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (active === null || active < 0 || paused) return;
    // The last milestone holds as long as any other before the loop restarts.
    const holding = introDone || active === last;
    const timer = setTimeout(
      () => {
        if (active === last) setIntroDone(true);
        setActive((active + 1) % milestones.length);
      },
      holding ? CYCLE_MS : INTRO_STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [active, introDone, paused, last, milestones.length]);

  const animated = active !== null;
  const current = active ?? -1;

  return (
    // No column gap on desktop: each milestone draws its own two halves of
    // the rail edge to edge (out across its `px-2`), so the pieces meet into
    // one line — the first starting and the last ending at their dot.
    <ol
      ref={listRef}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0"
    >
      {milestones.map((milestone, i) => {
        const isActive = animated && i === current;
        const shown = !animated || introDone || i <= current;
        return (
          <li
            key={milestone.period}
            className={cn(
              "flex flex-col items-center text-center transition duration-500 lg:px-2",
              !shown && "translate-y-3 opacity-0",
            )}
          >
            <p className="whitespace-nowrap font-semibold leading-snug text-navy">
              {milestone.period}
            </p>
            <div className="relative mt-3 flex w-full justify-center">
              {i > 0 && (
                <RailHalf
                  className="-left-2 right-1/2"
                  // Starts once the previous milestone's right half is drawn.
                  fillClassName="delay-300"
                  filled={animated && i <= current}
                />
              )}
              {i < last && (
                <RailHalf
                  className="left-1/2 -right-2"
                  filled={animated && i < current}
                />
              )}
              <span
                aria-hidden
                className={cn(
                  "relative block h-3.5 w-3.5 rounded-full ring-4 ring-[#f4f8fe] transition duration-300",
                  isActive
                    ? "scale-125 bg-yellow"
                    : !animated || i <= current
                      ? "bg-blue-cta"
                      : "bg-blue-cta/40",
                )}
              />
            </div>
            <div
              className={cn(
                "mt-4 transition-transform duration-300",
                isActive && "scale-125",
              )}
            >
              {milestone.icon}
            </div>
            <p
              className={cn(
                "mt-2 text-sm font-light leading-relaxed transition-colors duration-300",
                isActive ? "text-navy" : "text-body",
              )}
            >
              {milestone.body}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/** One half of a milestone's piece of the rail, with a fill that grows left to right. */
function RailHalf({
  className,
  fillClassName,
  filled,
}: {
  className: string;
  fillClassName?: string;
  filled: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute top-1/2 hidden h-0.5 -translate-y-1/2 bg-blue-cta/30 lg:block",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-0 origin-left bg-blue-cta transition-transform duration-300",
          filled ? "scale-x-100" : "scale-x-0",
          fillClassName,
        )}
      />
    </span>
  );
}
