/**
 * CategoryTabs.tsx
 * ---------------------------------------------------------------------------
 * Horizontal filter bar for sushi categories (e.g. Nigiri, Maki, Sashimi).
 * Renders an "All" button plus one button per category extracted from the
 * menu data.
 *
 * Features:
 * - Highlights the currently selected category with primary styling.
 * - Shows a badge on each category tab indicating how many items from that
 *   category are currently in the cart.
 * - Wraps responsively on smaller screens (`flex-wrap`).
 *
 * Props:
 * @prop {string[]}            categories       — Unique category names.
 * @prop {string | null}       selectedCategory — Currently active filter, or null for "All".
 * @prop {Function}            onSelectCategory — Called with the category name (or null).
 * @prop {SushiItem[]}         menu             — Full menu array (for computing per-category counts).
 * @prop {Record<string,number>} cart           — Current cart mapping itemId → quantity.
 *
 * Used in: TablePage (menu step)
 * ---------------------------------------------------------------------------
 */

import type { SushiItem } from "@/types/sushi";

interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  menu: SushiItem[];
  cart: Record<string, number>;
}

const CategoryTabs = ({
  categories,
  selectedCategory,
  onSelectCategory,
  menu,
  cart,
}: CategoryTabsProps) => {
  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          !selectedCategory
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        All
      </button>

      {categories.map((cat) => {
        const catItems = menu.filter((m) => m.category === cat);
        const catCart = catItems.reduce((sum, m) => sum + (cart[m.id] || 0), 0);

        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
            {catCart > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary-foreground/20 text-xs">
                {catCart}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryTabs;
