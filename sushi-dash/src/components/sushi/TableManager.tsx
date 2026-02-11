/**
 * ==========================================================================
 * TableManager — Add and remove restaurant tables
 * ==========================================================================
 *
 * Manager-only component for table configuration:
 *   - Text input + "Add" button to create new tables
 *   - List of all tables with "Remove" button for each
 *   - Toast notifications on add/remove actions
 *
 * Changes are persisted through the SushiContext → API layer.
 *
 * ==========================================================================
 */

import { useState } from "react";
import { toast } from "sonner";
import type { Table } from "@/types/sushi";

interface TableManagerProps {
  tables: Table[];
  onAddTable: (label: string) => void;
  onRemoveTable: (id: string) => void;
}

const TableManager = ({ tables, onAddTable, onRemoveTable }: TableManagerProps) => {
  const [tableName, setTableName] = useState("");

  const handleAddTable = () => {
    if (!tableName.trim()) {
      toast.error("Enter a table name!");
      return;
    }

    onAddTable(tableName.trim());
    setTableName("");
    toast.success(`Added ${tableName}!`);
  };

  const handleRemoveTable = (table: Table) => {
    onRemoveTable(table.id);
    toast.success(`Removed ${table.label}`);
  };

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="text-lg font-bold text-card-foreground mb-4">
        Manage Tables
      </h2>

      {/* Add Table Form */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="e.g. Table 7"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleAddTable}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
        >
          Add
        </button>
      </div>

      {/* Tables List */}
      <div className="space-y-2">
        {tables.map((table) => (
          <div
            key={table.id}
            className="flex items-center justify-between rounded-lg border bg-background px-4 py-2"
          >
            <span className="font-medium text-foreground">🪑 {table.label}</span>
            <button
              onClick={() => handleRemoveTable(table)}
              className="px-3 py-1 rounded-lg text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableManager;
