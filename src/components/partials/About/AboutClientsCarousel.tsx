"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Building, ChevronRight } from "@/components/ui/Icon";

/** How long each card position holds before the row moves on by one card. */
const AUTOPLAY_MS = 2000;

interface Client {
  id: string;
  logo?: string;
  primary: string;
  secondary: string | null;
}

interface AboutClientsCarouselProps {
  heading: ReactNode;
  clients: Client[];
  previousLabel: string;
  nextLabel: string;
}

/**
 * A row of client cards that scrolls sideways. The arrows page by most of the
 * visible width; touch and trackpad scrolling work as well, and snap points
 * keep a card from stopping half cut off.
 *
 * The row also advances by itself, one card at a time, and returns to the
 * first card after the last. It holds still while the pointer or keyboard
 * focus is on it, and for visitors who ask for reduced motion.
 */
export default function AboutClientsCarousel({
  heading,
  clients,
  previousLabel,
  nextLabel,
}: AboutClientsCarouselProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      const list = listRef.current;
      const card = list?.firstElementChild as HTMLElement | null;
      if (!list || !card) return;
      const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 1;
      if (atEnd) {
        list.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
        list.scrollBy({ left: card.offsetWidth + gap, behavior: "smooth" });
      }
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused]);

  const page = (direction: 1 | -1) => {
    const list = listRef.current;
    if (!list) return;
    list.scrollBy({
      left: direction * list.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  const arrowClass =
    "flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-navy shadow-sm transition-colors hover:bg-navy hover:text-white";

  return (
    <div
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-end justify-between gap-6">
        {heading}
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => page(-1)}
            aria-label={previousLabel}
            className={arrowClass}
          >
            <ChevronRight className="h-3 w-auto rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            aria-label={nextLabel}
            className={arrowClass}
          >
            <ChevronRight className="h-3 w-auto" />
          </button>
        </div>
      </div>

      <ul
        ref={listRef}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {clients.map((client) => (
          <li
            key={client.id}
            className="w-60 shrink-0 snap-start rounded-xl border border-line bg-white px-5 py-4"
          >
            {client.logo ? (
              <Image
                src={client.logo}
                // The names below already say whose logo it is.
                alt=""
                width={160}
                height={64}
                className="mb-3 h-14 w-auto max-w-full object-contain"
              />
            ) : (
              // Holds the logo's slot until one is supplied, so every card's
              // name starts at the same height.
              <span
                aria-hidden
                className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-body/50"
              >
                <Building className="h-7 w-7" />
              </span>
            )}
            <p className="text-sm font-semibold leading-snug text-navy">
              {client.primary}
            </p>
            {client.secondary && (
              <p className="mt-1 text-xs font-light leading-snug text-body">
                {client.secondary}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
