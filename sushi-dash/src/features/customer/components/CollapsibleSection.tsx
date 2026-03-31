// CollapsibleSection — reusable card with animated chevron toggle, title, optional icon/badge/subtitle.

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cardVariants } from "@/components/ui/card";
import { cn } from "@/features/shared/lib/utils";

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
        <button
          className={cn(
            cardVariants({ variant: "item" }),
            "w-full flex items-center justify-between overflow-hidden hover:border-primary/50"
          )}
        >
          <div className="text-left min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-3 min-w-0">
              {icon && <span className="text-lg">{icon}</span>}
              <span className="type-subtitle truncate">{title}</span>
              {badge}
            </div>
            {subtitle && (
              <span className="type-caption block mt-0.5 truncate">
                {subtitle}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className={cn("overflow-hidden", contentClassName)}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CollapsibleSection;
