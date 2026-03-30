// TableSelector — Landing grid of table buttons with SSE presence badges and staff-login shortcut.

import type { Table } from "@/types/models";
import { cardVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TableSelectorProps {
  tables: Table[];
  onSelectTable: (table: Table) => void;
  onStaffLogin: () => void;
  loadError?: string | null;
  onRetryLoad?: () => void;
}

const TableSelector = ({ tables, onSelectTable, onStaffLogin, loadError = null, onRetryLoad }: TableSelectorProps) => {
  const showEmptyState = Boolean(loadError) || tables.length === 0;

  return (
    <main aria-label="Table selection" className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start px-4 pt-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center">
            <p className="type-body-muted">
              All-you-can-eat! Select your table to start ordering.
            </p>
          </div>
        </div>

        {showEmptyState ? (
          <div className="flex items-center justify-center w-full flex-1">
            <div className="text-center px-6">
              <span className="text-5xl block mb-4">🪑</span>
              <p className="type-subtitle text-muted-foreground">
                No tables available
              </p>
              <p className="type-caption mt-2">
                If you believe this is an error, please contact management.
              </p>
              {onRetryLoad && (
                <button
                  type="button"
                  onClick={onRetryLoad}
                  className="mt-4 px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            {tables.map((table) => {
              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => onSelectTable(table)}
                  className={cn(
                    cardVariants({ variant: "item" }),
                    "p-6 text-center relative transition-colors transition-shadow duration-200",
                    "hover:border-primary hover:shadow-sm",
                  )}
                >
                  <span className="text-3xl block mb-2">🪑</span>
                  <span className="type-subtitle text-card-foreground">{table.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Staff access shortcut — full-width bar pinned to bottom by flex layout */}
      <div className="w-full shrink-0 pb-4 pt-2 text-center type-caption border-t border-border/40">
        <button
          type="button"
          onClick={onStaffLogin}
          className="hover:text-foreground transition-colors underline"
        >
          🔐 Staff Login
        </button>
      </div>
    </main>
  );
};

export default TableSelector;
