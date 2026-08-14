import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  BUTTON_BASE_CLASS,
  BUTTON_VARIANT_CLASS,
  type ButtonVariant,
} from "./Button.config";

interface BaseButtonProps extends Omit<ComponentProps<"button">, "children"> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export default function BaseButton({
  variant = "yellow",
  className,
  children,
  ...rest
}: BaseButtonProps) {
  return (
    <button
      className={cn(
        BUTTON_BASE_CLASS,
        BUTTON_VARIANT_CLASS[variant],
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
