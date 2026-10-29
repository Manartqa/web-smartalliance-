"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** How long each photo stays before the next fades in. */
const SLIDE_MS = 4000;

/**
 * The office photos, one at a time: each fades into the next while drifting
 * in slightly, then the set starts over. Every photo is stacked in the same
 * box, so the change is a cross-fade with no layout movement.
 *
 * It holds still while the tab is in the background, and for visitors who ask
 * for reduced motion it shows the first photo only.
 */
export default function AboutOfficeSlideshow({
  images,
  sizes,
}: {
  images: readonly string[];
  sizes: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      if (document.hidden) return;
      setActive((current) => (current + 1) % images.length);
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <>
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes={sizes}
          // A 1.2s fade, and a slow 6s drift in that outlasts the photo's
          // turn, so the zoom never visibly stops.
          className={cn(
            "object-cover ease-out transition-[opacity,transform] [transition-duration:1200ms,6000ms]",
            index === active ? "scale-105 opacity-100" : "scale-100 opacity-0",
          )}
        />
      ))}
    </>
  );
}
