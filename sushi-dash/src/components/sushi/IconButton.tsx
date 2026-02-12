/**
 * ==========================================================================
 * IconButton — Reusable round icon button for +/−/trash/confirm/cancel
 * ==========================================================================
 *
 * Provides consistent circular icon button styling across the app:
 *
 *   Variants:
 *     "primary"     — Soft primary bg (bg-primary/10 text-primary)
 *     "destructive" — Soft destructive bg (bg-destructive/10 text-destructive)
 *     "ghost"       — No bg, coloured text only (hover shows bg)
 *     "solid"       — Full primary bg (bg-primary text-primary-foreground)
 *     "solid-danger" — Full destructive bg (bg-destructive text-destructive-foreground)
 *     "muted"       — Muted bg (bg-muted text-muted-foreground)
 *     "outline"     — Border only (border border-border text-foreground)
 *
 *   Sizes:
 *     "sm" — w-8 h-8  (OrderConfirmation controls)
 *     "md" — w-10 h-10 (SushiGrid +/−, QuantityPickerModal)
 *
 * ==========================================================================
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonVariant =
  | "primary"
  | "destructive"
  | "ghost"
  | "solid"
  | "solid-danger"
  | "muted"
  | "outline";

type IconButtonSize = "sm" | "md";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  children: ReactNode;
}

const VARIANT_STYLES: Record<IconButtonVariant, string> = {
  primary:
    "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
  destructive:
    "bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors",
  ghost:
    "text-destructive hover:bg-destructive/10 transition-colors",
  solid:
    "bg-primary text-primary-foreground hover:opacity-90 transition-colors",
  "solid-danger":
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors",
  muted:
    "bg-muted text-muted-foreground hover:text-foreground transition-colors",
  outline:
    "border border-border text-foreground hover:bg-secondary transition-colors",
};

const SIZE_STYLES: Record<IconButtonSize, string> = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
};

const IconButton = ({
  variant = "primary",
  size = "sm",
  children,
  className = "",
  ...rest
}: IconButtonProps) => {
  return (
    <button
      className={`${SIZE_STYLES[size]} rounded-full flex items-center justify-center ${VARIANT_STYLES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export default IconButton;
