"use client";

import { useSyncExternalStore } from "react";

/**
 * The animated น้อง SMART (from the supplied video, background keyed out).
 * A plain `<picture>`, not `next/image`: the optimizer would turn the
 * animated WebP into a still, and it cannot swap sources by media query.
 * `sm` (240px tall) is for the launcher and the privacy notice; `lg` (560px)
 * is for the chat screen and is only fetched once the chat opens.
 *
 * The animations are heavy (0.6 MB and 1.6 MB), and the launcher is on every
 * page, so the still pose shows first and the animation replaces it once the
 * page has loaded and the browser is idle. The still stays on screen until
 * the animation has arrived.
 *
 * Lazy, so a copy hidden with `display: none` (the launcher on phones)
 * downloads nothing.
 *
 * Visitors who ask for reduced motion get the still only.
 * `<picture>` is `display: contents`, so the classes on the image size it as
 * if the picture were not there.
 */
const STILL = "/assets/mascot-smart.webp";

const SOURCES = {
  sm: { src: "/assets/mascot-smart-wave-sm.webp", width: 241, height: 240 },
  lg: { src: "/assets/mascot-smart-wave.webp", width: 561, height: 560 },
} as const;

let idle = false;
let waiting = false;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (!idle && !waiting) {
    waiting = true;
    const done = () => {
      idle = true;
      listeners.forEach((notify) => notify());
    };
    const afterLoad = () =>
      "requestIdleCallback" in window
        ? window.requestIdleCallback(done, { timeout: 3000 })
        : setTimeout(done, 1500);
    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });
  }
  return () => {
    listeners.delete(listener);
  };
};

export default function SmartMascot({
  size,
  alt = "",
  className,
}: {
  size: keyof typeof SOURCES;
  alt?: string;
  className?: string;
}) {
  const animate = useSyncExternalStore(
    subscribe,
    () => idle,
    () => false,
  );
  const { src, width, height } = SOURCES[size];
  return (
    <picture className="contents">
      <source media="(prefers-reduced-motion: reduce)" srcSet={STILL} />
      <img
        src={animate ? src : STILL}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={className}
      />
    </picture>
  );
}
