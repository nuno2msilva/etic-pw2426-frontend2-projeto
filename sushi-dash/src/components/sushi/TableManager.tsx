/**
 * ==========================================================================
 * TableManager — Add/remove tables + PIN management
 * ==========================================================================
 *
 * Manager-only component for table configuration:
 *   - Add new tables
 *   - Remove existing tables
 *   - View each table's 4-digit PIN in plaintext
 *   - Randomize a table's PIN (invalidates customer sessions)
 *   - Manually set a table's PIN
 *
 * PINs are managed via the backend API. Changes are reflected immediately.
 *
 * ==========================================================================
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Table } from "@/types/sushi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shuffle, Pencil, X, Check, QrCode } from "lucide-react";
import { fetchTablesWithPins, setTablePin, randomizeTablePin } from "@/lib/api";
import { TableQRModal } from "@/components/sushi";

interface TableManagerProps {
  tables: Table[];
  onAddTable: (label: string) => Promise<void>;
  onRemoveTable: (id: string) => Promise<void>;
  onUpdateTable: (id: string, label: string) => Promise<void>;
}

const TableManager = ({ tables, onAddTable, onRemoveTable, onUpdateTable }: TableManagerProps) => {
  const [tableName, setTableName] = useState("");

  // PIN data from backend (includes plaintext PINs)
  const [pinData, setPinData] = useState<Record<string, { pin: string; pin_version: number }>>({});
  const [editingPin, setEditingPin] = useState<Record<string, string>>({});
  const [editingName, setEditingName] = useState<Record<string, string>>({});

  // QR modal state
  const [qrTable, setQrTable] = useState<Table | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Delete confirmation state
  const [deletingTable, setDeletingTable] = useState<Table | null>(null);

  // Fetch PINs from backend
  const loadPins = useCallback(async () => {
    try {
      const data = await fetchTablesWithPins();
      const map: Record<string, { pin: string; pin_version: number }> = {};
      for (const t of data) {
        if (t.pin) map[t.id] = { pin: t.pin, pin_version: t.pin_version ?? 1 };
      }
      setPinData(map);
    } catch {
      // Backend may not be reachable — silently skip
    }
  }, []);

  // Re-fetch PINs whenever the tables data changes (SSE invalidation
  // triggers a React Query refetch → new tables array reference)
  useEffect(() => {
    loadPins();
  }, [loadPins, tables]);

  const handleAddTable = async () => {
    if (!tableName.trim()) {
      toast.error("Enter a table name!");
      return;
    }

    const name = tableName.trim();
    try {
      await onAddTable(name);
      setTableName("");
      toast.success(`Added ${name}!`);
    } catch {
      toast.error(`Failed to add table "${name}"`);
    }
  };

  const handleRemoveTable = async (table: Table) => {
    try {
      await onRemoveTable(table.id);
      toast.success(`Removed ${table.label}`);
    } catch {
      toast.error(`Failed to remove ${table.label}`);
    } finally {
      setDeletingTable(null);
    }
  };

  const handleRandomize = async (table: Table) => {
    try {
      const result = await randomizeTablePin(table.id);
      setPinData((prev) => ({
        ...prev,
        [table.id]: { pin: result.pin, pin_version: result.pin_version },
      }));
      toast.success(`PIN randomized for ${table.label} — active sessions invalidated`);
    } catch {
      toast.error("Failed to randomize PIN");
    }
  };

  const handleSetPin = async (table: Table) => {
    const pin = editingPin[table.id];
    if (!pin || !/^\d{4}$/.test(pin)) {
      toast.error("PIN must be exactly 4 digits");
      return false;
    }
    try {
      const result = await setTablePin(table.id, pin);
      setPinData((prev) => ({
        ...prev,
        [table.id]: { pin: result.pin, pin_version: prev[table.id]?.pin_version ?? 1 },
      }));
      return true;
    } catch {
      toast.error("Failed to set PIN");
      return false;
    }
  };

  const handleUpdateName = async (table: Table) => {
    const newName = editingName[table.id];
    if (!newName?.trim()) {
      toast.error("Table name cannot be empty");
      return false;
    }
    try {
      await onUpdateTable(table.id, newName.trim());
      return true;
    } catch {
      toast.error("Failed to rename table");
      return false;
    }
  };

  /** Unified save: commits whichever edits are active (name and/or PIN).
   *  If the name changed but the PIN was left untouched, auto-randomize
   *  the PIN so existing QR codes / sessions are invalidated.
   *  If nothing actually changed, do nothing. */
  const handleSaveEdits = async (table: Table) => {
    const hasName = table.id in editingName;
    const hasPin = table.id in editingPin;

    // Detect whether values actually differ from the originals
    const nameChanged = hasName && editingName[table.id].trim() !== table.label;
    const pd = pinData[table.id];
    const pinChanged = hasPin && pd && editingPin[table.id] !== pd.pin;

    // Nothing changed — just close the edit mode
    if (!nameChanged && !pinChanged) {
      handleCancelEdits(table.id);
      return;
    }

    const results: boolean[] = [];

    if (nameChanged) results.push(await handleUpdateName(table));
    if (pinChanged) results.push(await handleSetPin(table));

    if (results.length > 0 && results.every(Boolean)) {
      // Auto-randomize PIN when only the name changed
      if (nameChanged && !pinChanged) {
        try {
          const result = await randomizeTablePin(table.id);
          setPinData((prev) => ({
            ...prev,
            [table.id]: { pin: result.pin, pin_version: result.pin_version },
          }));
          toast.success("Name updated — PIN auto-randomized");
        } catch {
          toast.success("Name updated (PIN randomization failed)");
        }
      } else {
        toast.success("Changes saved");
      }
    }

    // Always clear edit state when done
    handleCancelEdits(table.id);
  };

  /** Cancel all edits for a table */
  const handleCancelEdits = (tableId: string) => {
    setEditingName(prev => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
    setEditingPin(prev => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
  };

  return (
    <Card variant="section">
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
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddTable(); }}
          className="flex-1 px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button onClick={handleAddTable}>
          Add
        </Button>
      </div>

      {/* Tables List */}
      <div className="space-y-1">
        {tables.map((table) => {
          const pd = pinData[table.id];
          const isEditingName = table.id in editingName;
          const isEditingPinVal = table.id in editingPin;
          const isEditing = isEditingName || isEditingPinVal;

          return (
            <div
              key={table.id}
              className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2"
            >
              {/* Name (or edit input) */}
              <span className="text-base shrink-0">🪑</span>
              {isEditingName ? (
                <Input
                  value={editingName[table.id] ?? table.label}
                  onChange={(e) => setEditingName(prev => ({ ...prev, [table.id]: e.target.value }))}
                  className="w-40 h-7 text-sm"
                  placeholder="Table name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdits(table);
                    if (e.key === 'Escape') handleCancelEdits(table.id);
                  }}
                  autoFocus
                />
              ) : (
                <span className="font-medium text-foreground text-sm">
                  {table.label}
                </span>
              )}

              {/* Spacer pushes PIN + buttons to the right */}
              <div className="flex-1" />

              {/* PIN display + inline edit — right-aligned */}
              {pd && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-muted-foreground text-xs">PIN:</span>
                  {isEditingPinVal ? (
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="\d{4}"
                      maxLength={4}
                      value={editingPin[table.id] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setEditingPin((prev) => ({ ...prev, [table.id]: val }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdits(table);
                        if (e.key === 'Escape') handleCancelEdits(table.id);
                      }}
                      className="w-16 h-7 font-mono tracking-widest text-center text-sm"
                      autoFocus={!isEditingName}
                    />
                  ) : (
                    <span className="font-mono text-sm font-bold tracking-widest bg-muted px-2 py-0.5 rounded">
                      {pd.pin}
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleSaveEdits(table)}
                      className="text-green-600 hover:text-green-700 p-1 rounded transition-colors"
                      title="Save changes"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleCancelEdits(table.id)}
                      className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingName(prev => ({ ...prev, [table.id]: table.label }));
                        if (pd) setEditingPin(prev => ({ ...prev, [table.id]: pd.pin }));
                      }}
                      className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                      title="Edit table"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {pd && (
                      <>
                        <button
                          onClick={() => {
                            setQrTable(table);
                            setShowQR(true);
                          }}
                          className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                          title="Show QR code"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRandomize(table)}
                          className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                          title="Randomize PIN (invalidates sessions)"
                        >
                          <Shuffle className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setDeletingTable(table)}
                      className="text-destructive/70 hover:text-destructive p-1 rounded transition-colors"
                      title="Delete table"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal */}
      <TableQRModal
        isOpen={showQR}
        onClose={() => {
          setShowQR(false);
          setQrTable(null);
        }}
        table={qrTable}
        pin={qrTable ? pinData[qrTable.id]?.pin ?? null : null}
      />

      {/* Delete Table Confirmation Modal */}
      <Dialog
        open={!!deletingTable}
        onOpenChange={(open) => !open && setDeletingTable(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deletingTable?.label}&rdquo;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTable(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingTable && handleRemoveTable(deletingTable)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TableManager;
