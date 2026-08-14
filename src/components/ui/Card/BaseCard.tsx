import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type BaseCardProps = ComponentProps<"div">;

export default function BaseCard({
  className,
  children,
  ...rest
}: BaseCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-white shadow-card",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
