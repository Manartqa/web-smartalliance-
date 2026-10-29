/** Shared field chrome for text inputs and textareas. */
export const INPUT_BASE_CLASS =
  "w-full rounded-[10px] border border-field-border bg-field-bg py-3.5 pl-11 pr-4 " +
  // 16px below sm: iOS zooms the page when a field under 16px takes focus.
  "text-base text-ink placeholder:text-placeholder focus:border-navy focus:outline-none sm:text-sm";
