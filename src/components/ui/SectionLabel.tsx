interface SectionLabelProps {
  children: string;
  /** Yellow section labels sit on the dark hero; navy ones on white sections. */
  tone?: "navy" | "yellow";
  className?: string;
}

export function SectionLabel({
  children,
  tone = "navy",
  className = "",
}: SectionLabelProps) {
  return (
    <div
      className={`flex items-center gap-4 text-sm font-semibold uppercase tracking-[0.06em] ${
        tone === "yellow" ? "text-yellow" : "text-navy"
      } ${className}`}
    >
      <span>{children}</span>
      <span aria-hidden className="h-[3px] w-8 rounded-sm bg-yellow" />
    </div>
  );
}
