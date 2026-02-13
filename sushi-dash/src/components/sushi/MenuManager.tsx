/**
 * ==========================================================================
 * MenuManager — Category-first menu management for the Manager Panel
 * ==========================================================================
 *
 * Replaces AddMenuItemForm + MenuList with a unified view:
 *   - Categories displayed as collapsible cards
 *   - "Add Item" button on the right of each category header
 *   - "Add Category" button at the bottom
 *   - Inline item editing (name, emoji)
 *   - Toggle availability / delete items
 *   - Delete entire category (with confirmation)
 *
 * ==========================================================================
 */

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  X,
  Check,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SushiItem, Category } from "@/types/sushi";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip leading "#N " prefix from item names (legacy DB format) */
function stripNumberPrefix(name: string): string {
  return name.replace(/^#\d+\s+/, "");
}

// ---------------------------------------------------------------------------
// Emoji presets — the user picks from these when adding/editing items
// ---------------------------------------------------------------------------
const EMOJI_OPTIONS = [
  "🍣", "🍙", "🍤", "🍜", "🐉", "🥟", "🍱", "🦐", "🥢", "🍘", "🫘", "🐟",
  "🍡", "🍵", "🥗", "🍗", "🍛", "🧁", "🍢", "🍥", "🥠", "🫕", "🥮", "🧃",
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface MenuManagerProps {
  menu: SushiItem[];
  categoryList: Category[];
  onAddItem: (item: Omit<SushiItem, "id"> & { categoryId?: number }) => void;
  onUpdateItem: (id: string, updates: { name?: string; emoji?: string }) => void;
  onRemoveItem: (id: string) => void;
  onToggleAvailability: (id: string, isAvailable: boolean) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const MenuManager = ({
  menu,
  categoryList,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onToggleAvailability,
  onAddCategory,
  onDeleteCategory,
}: MenuManagerProps) => {
  // ---------- state ----------
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  // Add-category form
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Add-item modal
  const [addItemModal, setAddItemModal] = useState<{ categoryId: number; categoryName: string } | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemEmoji, setNewItemEmoji] = useState("🍣");

  // Edit-item modal
  const [editingItem, setEditingItem] = useState<SushiItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");

  // Delete-category confirmation
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Delete-item confirmation
  const [deletingItem, setDeletingItem] = useState<SushiItem | null>(null);

  // ---------- derived ----------
  const itemsByCategory = useMemo(() => {
    const map: Record<string, SushiItem[]> = {};
    for (const cat of categoryList) {
      map[cat.name] = menu.filter((m) => m.category === cat.name);
    }
    return map;
  }, [menu, categoryList]);

  // ---------- handlers ----------
  const toggleCategory = useCallback((name: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  // -- Add category --
  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Category name cannot be empty");
      return;
    }
    onAddCategory(name);
    setNewCategoryName("");
    setShowAddCategory(false);
    toast.success(`Category "${name}" created`);
  };

  // -- Delete category --
  const handleConfirmDeleteCategory = () => {
    if (!deletingCategory) return;
    onDeleteCategory(deletingCategory.id);
    toast.success(`Category "${deletingCategory.name}" deleted`);
    setDeletingCategory(null);
  };

  // -- Add item --
  const openAddItemModal = (cat: Category) => {
    setAddItemModal({ categoryId: cat.id, categoryName: cat.name });
    setNewItemName("");
    setNewItemEmoji("🍣");
  };

  const handleAddItem = () => {
    if (!addItemModal) return;
    const name = newItemName.trim();
    if (!name) {
      toast.error("Item name cannot be empty");
      return;
    }
    onAddItem({
      name,
      emoji: newItemEmoji,
      category: addItemModal.categoryName,
      categoryId: addItemModal.categoryId,
      isAvailable: true,
    });
    setAddItemModal(null);
    toast.success(`Added ${newItemEmoji} ${name}`);
  };

  // -- Edit item --
  const openEditModal = (item: SushiItem) => {
    setEditingItem(item);
    setEditName(stripNumberPrefix(item.name));
    setEditEmoji(item.emoji);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const name = editName.trim();
    if (!name) {
      toast.error("Name cannot be empty");
      return;
    }
    onUpdateItem(editingItem.id, { name, emoji: editEmoji });
    toast.success(`Updated "${name}"`);
    setEditingItem(null);
  };

  // -- Toggle availability --
  const handleToggle = (item: SushiItem) => {
    const newAvail = !(item.isAvailable ?? true);
    onToggleAvailability(item.id, newAvail);
    toast.success(
      newAvail
        ? `${item.emoji} ${item.name} is now available`
        : `${item.emoji} ${item.name} marked as unavailable`
    );
  };

  // -- Delete item --
  const handleDeleteItem = (item: SushiItem) => {
    onRemoveItem(item.id);
    toast.success(`Removed ${item.emoji} ${item.name}`);
    setDeletingItem(null);
  };

  // ---------- render ----------
  return (
    <Card variant="section">
      <div className="space-y-2">
        {categoryList.map((cat) => {
          const items = itemsByCategory[cat.name] ?? [];
          const isOpen = openCategories.has(cat.name);
          const availCount = items.filter((i) => i.isAvailable !== false).length;

          return (
            <Collapsible
              key={cat.id}
              open={isOpen}
              onOpenChange={() => toggleCategory(cat.name)}
            >
              {/* Category header row */}
              <div className="flex items-center rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <CollapsibleTrigger className="flex-1 group">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      {cat.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {availCount}/{items.length} available
                    </span>
                  </div>
                </CollapsibleTrigger>

                {/* Right-side actions */}
                <div className="flex items-center gap-1 pr-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddItemModal(cat);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Add Item
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingCategory(cat);
                    }}
                    title={`Delete category "${cat.name}"`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Items list */}
              <CollapsibleContent className="mt-1 space-y-1 pl-4 pr-1">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-2 pl-2">
                    No items yet — click "Add Item" above.
                  </p>
                ) : (
                  items.map((item, idx) => {
                    const available = item.isAvailable !== false;
                    const displayName = stripNumberPrefix(item.name);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between rounded-lg border bg-card px-4 py-2.5",
                          !available && "opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl flex-shrink-0">{item.emoji}</span>
                          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">#{idx + 1}</span>
                          <span className={cn(
                            "font-medium text-card-foreground truncate",
                            !available && "line-through"
                          )}>
                            {displayName}
                          </span>
                          {!available && (
                            <span className="text-xs text-destructive font-medium flex-shrink-0">
                              Unavailable
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => openEditModal(item)}
                            title="Edit item"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          {/* Toggle availability */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleToggle(item)}
                            title={available ? "Mark unavailable" : "Mark available"}
                          >
                            {available ? (
                              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 text-green-500" />
                            )}
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeletingItem(item)}
                            title="Delete item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* ── Add Category ── */}
        {showAddCategory ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border bg-muted/30">
            <Input
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              className="flex-1"
              autoFocus
            />
            <Button size="sm" onClick={handleAddCategory}>
              <Check className="h-4 w-4 mr-1" />
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddCategory(false);
                setNewCategoryName("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowAddCategory(true)}
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════
           ADD ITEM MODAL
         ════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!addItemModal}
        onOpenChange={(open) => !open && setAddItemModal(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Add Item to "{addItemModal?.categoryName}"
            </DialogTitle>
            <DialogDescription>
              Choose an emoji and enter the item name.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="new-item-name">Name</Label>
              <Input
                id="new-item-name"
                placeholder="e.g. Salmon Nigiri"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                autoFocus
              />
            </div>

            {/* Emoji picker */}
            <div className="space-y-1.5">
              <Label>Emoji</Label>
              <div className="flex gap-2 flex-wrap">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setNewItemEmoji(e)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all",
                      newItemEmoji === e
                        ? "bg-primary text-primary-foreground scale-110 ring-2 ring-primary"
                        : "bg-secondary hover:bg-muted"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={!newItemName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════
           EDIT ITEM MODAL
         ════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Edit "{editingItem?.name}"
            </DialogTitle>
            <DialogDescription>
              Update the item&apos;s name and emoji.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-item-name">Name</Label>
              <Input
                id="edit-item-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                autoFocus
              />
            </div>

            {/* Emoji picker */}
            <div className="space-y-1.5">
              <Label>Emoji</Label>
              <div className="flex gap-2 flex-wrap">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEditEmoji(e)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all",
                      editEmoji === e
                        ? "bg-primary text-primary-foreground scale-110 ring-2 ring-primary"
                        : "bg-secondary hover:bg-muted"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
              <Check className="h-4 w-4 mr-1" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════
           DELETE CATEGORY CONFIRMATION MODAL
         ════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"?
              All items in this category will also be removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteCategory}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════
           DELETE ITEM CONFIRMATION MODAL
         ════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingItem?.emoji} &ldquo;{deletingItem?.name}&rdquo;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingItem && handleDeleteItem(deletingItem)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MenuManager;
