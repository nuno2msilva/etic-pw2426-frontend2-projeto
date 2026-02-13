/**
 * ==========================================================================
 * Default Data — Menu items, tables, and settings
 * ==========================================================================
 *
 * Seeds the application with:
 *   - 145 menu items across 10 categories (Nigiri, Rolls, etc.)
 *   - 6 restaurant tables (the default configuration)
 *   - Order limit settings (10 items/order, 2 active orders/table)
 *
 * Each menu item has a numbered prefix (e.g., "#1 Salmon Nigiri")
 * for easy ordering by number. Popular items are flagged with
 * isPopular: true to show a "HOT" badge in the grid.
 *
 * This data is loaded into localStorage on first API call and
 * persists across page refreshes.
 * ==========================================================================
 */
import type { SushiItem } from "@/types/sushi";
/**
 * Default menu with 100+ items organized by category
 * Each item has a numbered prefix for easy ordering
 */
export declare const DEFAULT_MENU: SushiItem[];
export declare const DEFAULT_TABLES: {
    id: string;
    label: string;
}[];
export declare const DEFAULT_SETTINGS: {
    maxItemsPerOrder: number;
    maxActiveOrdersPerTable: number;
};
//# sourceMappingURL=defaultMenu.d.ts.map