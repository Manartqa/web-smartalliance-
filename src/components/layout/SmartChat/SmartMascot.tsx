/**
 * The animated น้อง SMART (from the supplied video, background keyed out).
 * A plain `<picture>`, not `next/image`: the optimizer would turn the
 * animated WebP into a still, and it cannot swap sources by media query.
 * `sm` (240px tall) is for the launcher and the privacy notice; `lg` (560px)
 * is for the chat screen and is only fetched once the chat opens.
 *
 * Visitors who ask for reduced motion get the animation's first frame.
 * `<picture>` is `display: contents`, so the classes on the image size it as
 * if the picture were not there.
 */
const SOURCES = {
  sm: { src: "/assets/mascot-smart-wave-sm.webp", width: 241, height: 240 },
  lg: { src: "/assets/mascot-smart-wave.webp", width: 561, height: 560 },
} as const;

export default function SmartMascot({
  size,
  alt = "",
  className,
}: {
  size: keyof typeof SOURCES;
  alt?: string;
  className?: string;
}) {
  const { src, width, height } = SOURCES[size];
  return (
    <picture className="contents">
      <source
        media="(prefers-reduced-motion: reduce)"
        srcSet="/assets/mascot-smart.webp"
      />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
