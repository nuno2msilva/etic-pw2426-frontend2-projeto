// TableSelector — Landing grid of table buttons with SSE presence badges and staff-login shortcut.

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Table } from "@/types/models";
import { cardVariants } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { presenceKey } from "@/hooks/useServerEvents";

interface TableSelectorProps {
  tables: Table[];
  onSelectTable: (table: Table) => void;
  onStaffLogin: () => void;
  loadError?: string | null;
  onRetryLoad?: () => void;
}

const TableSelector = ({ tables, onSelectTable, onStaffLogin, loadError = null, onRetryLoad }: TableSelectorProps) => {
  // Subscribe reactively — re-renders when SSE pushes new presence data
  const { data: presence = {} } = useQuery<Record<number, number>>({
    queryKey: [...presenceKey],
    queryFn: () => ({}),
    staleTime: Infinity,  // never refetch — data arrives via SSE setQueryData
  });

  const showEmptyState = Boolean(loadError) || tables.length === 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start px-4 pt-8">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center justify-center gap-2"
          >
            <Image
              src="/images/sushi-logo.svg"
              alt="Sushi Dash logo"
              width={38}
              height={38}
              priority
            />
            <h1 className="text-4xl font-display font-bold text-foreground">
              <span className="text-primary">Sushi Dash</span>
            </h1>
          </motion.div>
          <p className="text-muted-foreground mt-2">
            All-you-can-eat! Select your table to start ordering.
          </p>
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
              return (
                <motion.button
                  key={table.id}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
                  onClick={() => onSelectTable(table)}
                  className={cn(cardVariants({ variant: "item" }), "p-6 text-center hover:border-primary hover:shadow-lg relative")}
                >
                  {users > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 border-green-200"
                    >
                      IN USE
                    </Badge>
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
