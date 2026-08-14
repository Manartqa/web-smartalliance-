export type ButtonVariant = "yellow" | "outline" | "navyOutline";

export const BUTTON_BASE_CLASS =
  "inline-flex items-center justify-center gap-2.5 rounded-[10px] px-6 py-3.5 " +
  "text-[13px] font-semibold leading-none tracking-[0.4px] transition-colors " +
  "text-center whitespace-normal";

export const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  yellow: "bg-yellow text-navy hover:bg-[#e6b000]",
  outline:
    "border-[1.5px] border-white text-white hover:bg-white hover:text-navy",
  navyOutline:
    "border-[1.5px] border-navy bg-white text-navy hover:bg-navy hover:text-white",
};
