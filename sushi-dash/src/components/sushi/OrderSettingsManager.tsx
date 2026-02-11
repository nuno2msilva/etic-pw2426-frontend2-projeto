/**
 * OrderSettingsManager.tsx
 * ---------------------------------------------------------------------------
 * Manager-only card for configuring order constraints. The two settings are:
 *
 *   1. **Max Items Per Order** — limits how many sushi items a customer can
 *      add to a single order (default 10).
 *   2. **Max Active Orders Per Table** — limits how many undelivered orders
 *      a table can have at the same time (default 2).
 *
 * The component keeps local state for the two input fields and syncs back to
 * the SushiContext via `onUpdateSettings`. A "Reset" button restores both
 * values to the defaults defined in `data/defaultMenu.ts`.
 *
 * Validation:
 * - Both values must be positive integers (≥ 1).
 * - Toast feedback on save and reset.
 *
 * Props:
 * @prop {OrderSettings} settings          — Current settings from context.
 * @prop {Function}      onUpdateSettings  — Callback to persist new values.
 *
 * Used in: ManagerPage (Order Settings section)
 * ---------------------------------------------------------------------------
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { OrderSettings } from '@/context/SushiContext';
import { DEFAULT_SETTINGS } from '@/data/defaultMenu';

interface OrderSettingsManagerProps {
  settings: OrderSettings;
  onUpdateSettings: (settings: Partial<OrderSettings>) => void;
}

export function OrderSettingsManager({ settings, onUpdateSettings }: OrderSettingsManagerProps) {
  const { toast } = useToast();
  const [maxItems, setMaxItems] = useState(String(settings.maxItemsPerOrder));
  const [maxOrders, setMaxOrders] = useState(String(settings.maxActiveOrdersPerTable));

  const handleSave = () => {
    const newMaxItems = parseInt(maxItems, 10);
    const newMaxOrders = parseInt(maxOrders, 10);

    if (isNaN(newMaxItems) || newMaxItems < 1) {
      toast({
        title: 'Invalid Value',
        description: 'Max items per order must be at least 1',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(newMaxOrders) || newMaxOrders < 1) {
      toast({
        title: 'Invalid Value',
        description: 'Max orders per table must be at least 1',
        variant: 'destructive',
      });
      return;
    }

    onUpdateSettings({
      maxItemsPerOrder: newMaxItems,
      maxActiveOrdersPerTable: newMaxOrders,
    });

    toast({
      title: 'Settings Saved',
      description: 'Order limits have been updated',
    });
  };

  const handleReset = () => {
    setMaxItems(String(DEFAULT_SETTINGS.maxItemsPerOrder));
    setMaxOrders(String(DEFAULT_SETTINGS.maxActiveOrdersPerTable));
    onUpdateSettings(DEFAULT_SETTINGS);
    
    toast({
      title: 'Settings Reset',
      description: 'Order limits have been reset to defaults',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Order Limits
        </CardTitle>
        <CardDescription>
          Configure maximum items per order and active orders per table
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxItems">Max Items Per Order</Label>
            <Input
              id="maxItems"
              type="number"
              min="1"
              max="100"
              value={maxItems}
              onChange={(e) => setMaxItems(e.target.value)}
              placeholder="10"
            />
            <p className="text-xs text-muted-foreground">
              Customers cannot add more than this many items to a single order
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxOrders">Max Active Orders Per Table</Label>
            <Input
              id="maxOrders"
              type="number"
              min="1"
              max="10"
              value={maxOrders}
              onChange={(e) => setMaxOrders(e.target.value)}
              placeholder="2"
            />
            <p className="text-xs text-muted-foreground">
              Tables must wait for orders to be delivered before placing new ones
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Current limits:</strong> {settings.maxItemsPerOrder} items/order, {settings.maxActiveOrdersPerTable} active orders/table
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
