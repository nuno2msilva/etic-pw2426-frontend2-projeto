// cn() — merges CSS class names via clsx + tailwind-merge (resolves Tailwind conflicts).

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
