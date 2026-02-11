          /**
 * ==========================================================================
 * AddMenuItemForm — Form to add new items to the restaurant menu
 * ==========================================================================
 *
 * Manager-only component that provides:
 *   - Text input for item name
 *   - Category selection from preset options
 *   - Emoji picker for visual icon
 *   - Submit button that calls onAddItem callback
 *
 * Form resets after successful submission and shows a toast notification.
 *
 * ==========================================================================
 */

import { useState } from "react";
import { toast } from "sonner";

const EMOJI_OPTIONS = ["🍣", "🍙", "🍤", "🍜", "🐉", "🥟", "🍱", "🦐", "🥢", "🍘", "🫘", "🐟"];
const CATEGORY_PRESETS = ["Nigiri", "Rolls", "Sides", "Sashimi", "Dessert", "Drinks"];

interface AddMenuItemFormProps {
  onAddItem: (item: { name: string; emoji: string; category: string }) => void;
}

const AddMenuItemForm = ({ onAddItem }: AddMenuItemFormProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Nigiri");
  const [emoji, setEmoji] = useState("🍣");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Enter a sushi name!");
      return;
    }

    onAddItem({ name: name.trim(), emoji, category });
    setName("");
    toast.success(`Added ${emoji} ${name}!`);
  };

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="text-lg font-bold text-card-foreground mb-4">
        Add Menu Item
      </h2>

      {/* Name Input */}
      <input
        type="text"
        placeholder="Sushi name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3"
      />

      {/* Category Selection */}
      <div className="mb-3">
        <label className="text-sm font-medium text-muted-foreground mb-1 block">
          Category
        </label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Emoji Selection */}
      <div className="mb-4">
        <label className="text-sm font-medium text-muted-foreground mb-1 block">
          Emoji
        </label>
        <div className="flex gap-2 flex-wrap">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                emoji === e
                  ? "bg-primary text-primary-foreground scale-110"
                  : "bg-secondary hover:bg-muted"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="px-6 py-2 rounded-lg bg-sushi-green text-sushi-green-foreground font-bold hover:opacity-90 transition-opacity"
      >
        Add to Menu ✨
      </button>
    </div>
  );
};

export default AddMenuItemForm;
