import { cn } from "@/lib/utils";

interface BaseSectionLabelProps {
  children: string;
  /** Yellow section labels sit on the dark hero; navy ones on white sections. */
  tone?: "navy" | "yellow";
  className?: string;
}

export default function BaseSectionLabel({
  children,
  tone = "navy",
  className,
}: BaseSectionLabelProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 text-sm font-semibold uppercase tracking-[0.06em]",
        tone === "yellow" ? "text-yellow" : "text-navy",
        className,
      )}
    >
      <span>{children}</span>
      <span aria-hidden className="h-[3px] w-8 rounded-sm bg-yellow" />
    </div>
  );
}
