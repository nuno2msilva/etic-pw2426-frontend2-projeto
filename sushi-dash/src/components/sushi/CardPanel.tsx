/**
 * ==========================================================================
 * CardPanel — Reusable card container used throughout the app
 * ==========================================================================
 *
 * Provides consistent card styling in two variants:
 *
 *   "section"  — Admin/manager panels (border, p-6).
 *                Used by: AddMenuItemForm, MenuList, TableManager, OrderCard
 *
 *   "item"     — Interactive item cards (border-2, p-4, rounded-xl).
 *                Used by: category headers, order confirmation items,
 *                cart banner, table selector
 *
 * Props:
 *   variant    — "section" | "item" (default: "item")
 *   className  — Additional classes merged onto the base
 *   children   — Card content
 *   as         — HTML element to render ("div" | "button", default "div")
 *
 * ==========================================================================
 */

import type { ReactNode, HTMLAttributes } from "react";

type CardPanelVariant = "section" | "item";

interface CardPanelProps extends HTMLAttributes<HTMLElement> {
  variant?: CardPanelVariant;
  className?: string;
  children: ReactNode;
  as?: "div" | "button";
}

const VARIANT_STYLES: Record<CardPanelVariant, string> = {
  section: "rounded-xl border bg-card p-6",
  item: "rounded-xl border-2 border-border bg-card p-4 transition-colors",
};

const CardPanel = ({
  variant = "item",
  className = "",
  children,
  as = "div",
  ...rest
}: CardPanelProps) => {
  const baseClass = `${VARIANT_STYLES[variant]} ${className}`;

  if (as === "button") {
    return (
      <button className={baseClass} {...rest}>
        {children}
      </button>
    );
  }

  return (
    <div className={baseClass} {...rest}>
      {children}
    </div>
  );
};

export default CardPanel;
