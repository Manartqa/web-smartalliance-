import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and let later Tailwind utilities win over
 * earlier ones. Every `components/ui/*` wrapper composes its defaults with the
 * caller's `className` through this helper.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
