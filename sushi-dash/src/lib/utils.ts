/**
 * ==========================================================================
 * Utility Functions
 * ==========================================================================
 *
 * cn() — Merges CSS class names using clsx (conditional logic) +
 * tailwind-merge (resolves Tailwind CSS conflicts, e.g., px-4 + px-8 = px-8).
 *
 * Usage:
 *   cn("px-4 py-2", isActive && "bg-primary", className)
 *
 * ==========================================================================
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
