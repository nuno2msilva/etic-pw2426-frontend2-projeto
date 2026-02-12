/**
 * ==========================================================================
 * MenuList — Displays all menu items grouped by category
 * ==========================================================================
 *
 * Manager-only component showing the full menu with:
 *   - Collapsible category sections for quick navigation
 *   - Each item with emoji, name, and "Remove" button
 *   - Total item count per category
 *
 * Used in the Manager Panel to review and delete menu items.
 *
 * ==========================================================================
 */

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { SushiItem } from "@/types/sushi";
import CardPanel from "./CardPanel";
import ActionButton from "./ActionButton";

interface MenuListProps {
  menu: SushiItem[];
  categories: string[];
  onRemoveItem: (id: string) => void;
}

const MenuList = ({ menu, categories, onRemoveItem }: MenuListProps) => {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const handleRemoveItem = (item: SushiItem) => {
    onRemoveItem(item.id);
    toast.success(`Removed ${item.name}`);
  };

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Get item count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      counts[cat] = menu.filter((m) => m.category === cat).length;
    });
    return counts;
  }, [menu, categories]);

  return (
    <CardPanel variant="section">
      <div className="space-y-2">
        {categories.map((cat) => {
          const categoryItems = menu.filter((m) => m.category === cat);
          const isOpen = openCategories.has(cat);

          return (
            <Collapsible
              key={cat}
              open={isOpen}
              onOpenChange={() => toggleCategory(cat)}
            >
              <CollapsibleTrigger className="w-full group">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 hover:bg-muted px-4 py-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {cat}
                    </h3>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {categoryCounts[cat]} items
                  </span>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2 space-y-1 pl-4">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="font-medium text-card-foreground">
                        {item.name}
                      </span>
                    </div>
                    <ActionButton variant="destructive" onClick={() => handleRemoveItem(item)}>
                      Remove
                    </ActionButton>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </CardPanel>
  );
};

export default MenuList;
