import type { ComponentProps, ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import {
  BUTTON_BASE_CLASS,
  BUTTON_VARIANT_CLASS,
  type ButtonVariant,
} from "./Button.config";

interface BaseLinkButtonProps
  extends Omit<ComponentProps<typeof Link>, "className" | "children"> {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}

/** Button-shaped link. Uses the locale-aware `Link` from `@/i18n/navigation`. */
export default function BaseLinkButton({
  variant = "yellow",
  className,
  children,
  ...rest
}: BaseLinkButtonProps) {
  return (
    <Link
      className={cn(BUTTON_BASE_CLASS, BUTTON_VARIANT_CLASS[variant], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
