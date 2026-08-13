import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type Variant = "yellow" | "outline" | "navyOutline";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-[10px] px-6 py-3.5 " +
  "text-[13px] font-semibold leading-none tracking-[0.4px] transition-colors " +
  "text-center whitespace-normal";

const variants: Record<Variant, string> = {
  yellow: "bg-yellow text-navy hover:bg-[#e6b000]",
  outline:
    "border-[1.5px] border-white text-white hover:bg-white hover:text-navy",
  navyOutline:
    "border-[1.5px] border-navy bg-white text-navy hover:bg-navy hover:text-white",
};

interface ButtonBaseProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

type LinkButtonProps = ButtonBaseProps &
  Omit<ComponentProps<typeof Link>, "className" | "children">;

export function LinkButton({
  variant = "yellow",
  className = "",
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

type ButtonProps = ButtonBaseProps &
  Omit<ComponentProps<"button">, "className" | "children">;

export function Button({
  variant = "yellow",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
