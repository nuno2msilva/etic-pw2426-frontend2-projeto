/**
 * TableSelector.tsx
 * ---------------------------------------------------------------------------
 * Landing component that displays a grid of restaurant tables for the
 * customer to choose from. Each table is a large button with a chair emoji
 * and the table's label.
 *
 * Layout:
 * - Centered heading with the Sushi Dash branding.
 * - 2-column grid on mobile, 3-column on sm+ breakpoints.
 * - Max width constrained (`max-w-lg`) for a compact, balanced look.
 *
 * When a table button is clicked, `onSelectTable` fires and the parent
 * (Index.tsx) navigates to `/table/:tableId`.
 *
 * Props:
 * @prop {Table[]}  tables         — Array of available tables from the context.
 * @prop {Function} onSelectTable  — Callback receiving the selected Table object.
 *
 * Used in: Index.tsx (landing page)
 * ---------------------------------------------------------------------------
 */

import type { Table } from "@/types/sushi";
import CardPanel from "./CardPanel";

interface TableSelectorProps {
  tables: Table[];
  onSelectTable: (table: Table) => void;
}

const TableSelector = ({ tables, onSelectTable }: TableSelectorProps) => {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-display font-bold text-foreground">
          🍣 <span className="text-primary">Sushi Dash</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          All-you-can-eat! Select your table to start ordering.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
        {tables.map((table) => (
          <CardPanel
            key={table.id}
            as="button"
            onClick={() => onSelectTable(table)}
            className="p-6 text-center hover:border-primary hover:shadow-lg"
          >
            <span className="text-3xl block mb-2">🪑</span>
            <span className="font-bold text-card-foreground">{table.label}</span>
          </CardPanel>
        ))}
      </div>
    </div>
  );
};

export default TableSelector;
