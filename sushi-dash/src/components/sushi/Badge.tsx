/**
 * ==========================================================================
 * Badge — Reusable pill badge for status labels, cart counts, qty overlays
 * ==========================================================================
 *
 *   Variants:
 *     "primary"     — bg-primary text-primary-foreground (cart count, qty)
 *     "destructive" — bg-destructive/10 text-destructive
 *     "accent"      — bg-accent/20 text-accent-foreground (queued status)
 *     "success"     — bg-sushi-green/20 text-sushi-green (ready status)
 *     "muted"       — bg-muted text-muted-foreground (delivered status)
 *     "orange"      — bg-orange-500 text-white (HOT badge)
 *
 *   Sizes:
 *     "xs"  — text-[10px] px-1.5 py-0.5 (qty overlays, HOT badge)
 *     "sm"  — text-xs px-2 py-0.5 (cart count badges)
 *     "md"  — text-xs px-3 py-1 (status badges)
 *
 * ==========================================================================
 */

import type { ReactNode, HTMLAttributes } from "react";

type BadgeVariant =
  | "primary"
  | "destructive"
  | "accent"
  | "success"
  | "muted"
  | "orange"
  | "primary-soft";

type BadgeSize = "xs" | "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  primary: "bg-primary text-primary-foreground",
  "primary-soft": "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
  accent: "bg-accent/20 text-accent-foreground",
  success: "bg-sushi-green/20 text-sushi-green",
  muted: "bg-muted text-muted-foreground",
  orange: "bg-orange-500 text-white",
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  xs: "text-[10px] px-1.5 py-0.5",
  sm: "text-xs px-2 py-0.5",
  md: "text-xs px-3 py-1",
};

const Badge = ({
  variant = "primary",
  size = "sm",
  children,
  className = "",
  ...rest
}: BadgeProps) => {
  return (
    <span
      className={`rounded-full font-bold ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
};

export default Badge;
