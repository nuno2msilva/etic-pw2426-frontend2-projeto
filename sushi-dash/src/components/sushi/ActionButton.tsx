/**
 * ==========================================================================
 * ActionButton — Reusable rectangular action button (form submits, CTAs)
 * ==========================================================================
 *
 *   Variants:
 *     "primary"     — bg-primary text-primary-foreground (main CTA)
 *     "success"     — bg-sushi-green text-sushi-green-foreground (Add to Menu)
 *     "destructive" — bg-destructive/10 text-destructive (Cancel Order)
 *     "muted"       — bg-muted text-muted-foreground (Delete Order)
 *     "outline"     — border-2 border-border text-muted-foreground (Add More)
 *
 *   Sizes:
 *     "sm" — py-2 text-sm  (form actions, modal buttons)
 *     "md" — py-3 text-base (page-level CTAs)
 *
 * ==========================================================================
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonVariant =
  | "primary"
  | "success"
  | "destructive"
  | "muted"
  | "outline";

type ActionButtonSize = "sm" | "md";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_STYLES: Record<ActionButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity",
  success:
    "bg-sushi-green text-sushi-green-foreground font-bold hover:opacity-90 transition-opacity",
  destructive:
    "bg-destructive/10 text-destructive font-bold hover:bg-destructive/20 transition-colors",
  muted:
    "bg-muted text-muted-foreground font-bold hover:bg-destructive/10 hover:text-destructive transition-colors",
  outline:
    "border-2 border-border text-muted-foreground font-medium hover:text-foreground transition-colors",
};

const SIZE_STYLES: Record<ActionButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-6 py-3 text-base rounded-xl",
};

const ActionButton = ({
  variant = "primary",
  size = "sm",
  fullWidth = false,
  children,
  className = "",
  ...rest
}: ActionButtonProps) => {
  return (
    <button
      className={`${SIZE_STYLES[size]} ${VARIANT_STYLES[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export default ActionButton;
