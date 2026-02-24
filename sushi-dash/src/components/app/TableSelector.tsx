// TableSelector — Landing grid of table buttons with SSE presence badges and staff-login shortcut.

import { useQuery } from "@tanstack/react-query";
import type { Table } from "@/types/models";
import { cardVariants } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { presenceKey } from "@/hooks/useServerEvents";

interface TableSelectorProps {
  tables: Table[];
  onSelectTable: (table: Table) => void;
  onStaffLogin?: () => void;
}

const TableSelector = ({ tables, onSelectTable, onStaffLogin }: TableSelectorProps) => {
  // Subscribe reactively — re-renders when SSE pushes new presence data
  const { data: presence = {} } = useQuery<Record<number, number>>({
    queryKey: [...presenceKey],
    queryFn: () => ({}),
    staleTime: Infinity,  // never refetch — data arrives via SSE setQueryData
  });

  return (
    <div className="h-[calc(100dvh-4rem)] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-foreground">
            🍣 <span className="text-primary">Sushi Dash</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            All-you-can-eat! Select your table to start ordering.
          </p>
        </div>

        {tables.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: "calc(100dvh - 16rem)" }}>
            <div className="text-center px-6">
              <span className="text-5xl block mb-4">🪑</span>
              <p className="text-lg font-semibold text-muted-foreground">
                No tables available
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                If you believe this is an error, please contact management.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            {tables.map((table) => {
              const users = presence[Number(table.id)] ?? 0;
              return (
                <button
                  key={table.id}
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
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Staff access shortcut — full-width bar pinned to bottom by flex layout */}
      <div className="w-full shrink-0 pb-4 pt-2 text-center text-sm text-muted-foreground border-t border-border/40">
        <button
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
