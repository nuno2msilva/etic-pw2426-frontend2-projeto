/**
 * ==========================================================================
 * CollapsibleSection — Reusable collapsible card with chevron toggle
 * ==========================================================================
 *
 * Wraps shadcn's Collapsible with the standard card styling used across
 * the app for category headers, manager settings sections, etc.
 *
 * Props:
 *   title      — Primary label (text-lg font-semibold)
 *   icon       — Optional emoji/icon displayed before the title
 *   badge      — Optional badge element shown after the title
 *   subtitle   — Optional smaller text below or beside the title
 *   open       — Controlled open state
 *   onToggle   — Called when the header is clicked
 *   children   — Content revealed when open
 *
 * Used in: TablePage, CustomerPage, ManagerPage
 * ==========================================================================
 */

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import CardPanel from "./CardPanel";

interface CollapsibleSectionProps {
  title: string;
  icon?: string;
  badge?: ReactNode;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** Extra classes on the content wrapper */
  contentClassName?: string;
}

const CollapsibleSection = ({
  title,
  icon,
  badge,
  subtitle,
  open,
  onToggle,
  children,
  contentClassName = "pt-3",
}: CollapsibleSectionProps) => {
  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <CardPanel
          as="button"
          className="w-full flex items-center justify-between hover:border-primary/50"
        >
          <div className="text-left">
            <div className="flex items-center gap-3">
              {icon && <span className="text-lg">{icon}</span>}
              <span className="text-lg font-semibold">{title}</span>
              {badge}
            </div>
            {subtitle && (
              <span className="text-sm text-muted-foreground block mt-0.5">
                {subtitle}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </CardPanel>
      </CollapsibleTrigger>
      <CollapsibleContent className={contentClassName}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CollapsibleSection;
