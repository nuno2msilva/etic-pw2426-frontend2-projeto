// TableSelector — Landing grid of table buttons with SSE presence badges and staff-login shortcut.

import { motion } from "framer-motion";
import type { Table } from "@/types/models";
import { cardVariants } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTablePresence } from "@/hooks/useTablePresence";

interface TableSelectorProps {
  tables: Table[];
  onSelectTable: (table: Table) => void;
  onStaffLogin: () => void;
  loadError?: string | null;
  onRetryLoad?: () => void;
}

const TableSelector = ({ tables, onSelectTable, onStaffLogin, loadError = null, onRetryLoad }: TableSelectorProps) => {
  // Subscribe reactively — re-renders when SSE pushes new presence data
  const { data: presence = {} } = useTablePresence();

  const showEmptyState = Boolean(loadError) || tables.length === 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start px-4 pt-8">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center justify-center"
          >
            <p className="text-muted-foreground">
              All-you-can-eat! Select your table to start ordering.
            </p>
          </motion.div>
        </div>

        {showEmptyState ? (
          <div className="flex items-center justify-center w-full flex-1">
            <div className="text-center px-6">
              <span className="text-5xl block mb-4">🪑</span>
              <p className="text-lg font-semibold text-muted-foreground">
                No tables available
              </p>
              <p className="text-sm text-muted-foreground mt-2">
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
            {tables.map((table, index) => {
              const users = presence[Number(table.id)] ?? 0;
              const isInUse = users > 0;
              return (
                <motion.button
                  key={table.id}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
                  onClick={() => onSelectTable(table)}
                  className={cn(
                    cardVariants({ variant: "item" }),
                    "p-6 text-center relative transition-all",
                    isInUse
                      ? "border-red-500 bg-red-50/60 dark:bg-red-950/20 shadow-[0_0_0_1px_rgba(239,68,68,0.7),0_0_26px_rgba(239,68,68,0.45)]"
                      : "hover:border-primary hover:shadow-lg",
                  )}
                >
                  {isInUse && (
                    <>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-0.5 rounded-2xl border-2 border-red-500/70 table-on-wave"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-1 rounded-2xl border border-red-400/45 table-on-wave table-on-wave-delay"
                      />
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 border-red-300"
                      >
                        ON
                      </Badge>
                    </>
                  )}
                  <span className="text-3xl block mb-2">🪑</span>
                  <span className="font-bold text-card-foreground">{table.label}</span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Staff access shortcut — full-width bar pinned to bottom by flex layout */}
      <div className="w-full shrink-0 pb-4 pt-2 text-center text-sm text-muted-foreground border-t border-border/40">
        <button
          type="button"
          onClick={onStaffLogin}
          className="hover:text-foreground transition-colors underline"
        >
          🔐 Staff Login
        </button>
      </div>
    </div>
  );
};

export default TableSelector;
