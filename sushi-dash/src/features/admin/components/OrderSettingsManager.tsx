// OrderSettingsManager — manager card for configuring max items/order and max active orders/table.

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { OrderSettings } from '@/features/customer/context/AppContext';
import { DEFAULT_SETTINGS } from '@/data/seedData';

interface OrderSettingsManagerProps {
  settings: OrderSettings;
  onUpdateSettings: (settings: Partial<OrderSettings>) => void;
}

export function OrderSettingsManager({ settings, onUpdateSettings }: OrderSettingsManagerProps) {
  const [maxItems, setMaxItems] = useState(String(settings.maxItemsPerOrder));
  const [maxOrders, setMaxOrders] = useState(String(settings.maxActiveOrdersPerTable));

  const handleSave = () => {
    const newMaxItems = parseInt(maxItems, 10);
    const newMaxOrders = parseInt(maxOrders, 10);

    if (isNaN(newMaxItems) || newMaxItems < 1) {
      toast.error('Max items per order must be at least 1');
      return;
    }

    if (isNaN(newMaxOrders) || newMaxOrders < 1) {
      toast.error('Max orders per table must be at least 1');
      return;
    }

    onUpdateSettings({
      maxItemsPerOrder: newMaxItems,
      maxActiveOrdersPerTable: newMaxOrders,
    });

    toast.success('Order limits have been updated');
  };

  const handleReset = () => {
    setMaxItems(String(DEFAULT_SETTINGS.maxItemsPerOrder));
    setMaxOrders(String(DEFAULT_SETTINGS.maxActiveOrdersPerTable));
    onUpdateSettings(DEFAULT_SETTINGS);
    
    toast.success('Order limits have been reset to defaults');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Order Limits
        </CardTitle>
        <CardDescription>
          Configure maximum items per order and active orders per table
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5">
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

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button onClick={handleSave} className="w-full sm:flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
          <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
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
