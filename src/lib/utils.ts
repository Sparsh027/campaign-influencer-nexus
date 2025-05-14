
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safe date formatter that handles invalid dates
 * @param dateString Date string to format
 * @param formatFn Formatting function to apply
 * @param fallback Fallback value if date is invalid
 * @returns Formatted date string or fallback value
 */
export function safeFormatDate<T>(
  dateString: string | null | undefined,
  formatFn: (date: Date) => T,
  fallback: T
): T {
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) return fallback;
    return formatFn(date);
  } catch (e) {
    return fallback;
  }
}
