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
import CardPanel from "./CardPanel";
import ActionButton from "./ActionButton";

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
    <CardPanel variant="section">
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
        <ActionButton variant="primary" onClick={handleAddTable}>
          Add
        </ActionButton>
      </div>

      {/* Tables List */}
      <div className="space-y-2">
        {tables.map((table) => (
          <div
            key={table.id}
            className="flex items-center justify-between rounded-lg border bg-background px-4 py-2"
          >
            <span className="font-medium text-foreground">🪑 {table.label}</span>
            <ActionButton variant="destructive" onClick={() => handleRemoveTable(table)}>
              Remove
            </ActionButton>
          </div>
        ))}
      </div>
    </CardPanel>
  );
};

export default TableManager;
