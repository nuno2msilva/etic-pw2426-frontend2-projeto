# 🎯 Analytics Integration Examples

This file contains real code examples showing how to import and use the analytics tracking functions in your components.

## Import Pattern

All analytics functions are exported from the shared feature:

```typescript
import { 
  customerEvents, 
  staffEvents, 
  kitchenEvents, 
  adminEvents, 
  systemEvents,
  trackEvent,
  trackPageView 
} from '@/features/shared';
```

---

## Example 1: Customer Table Selection

**File:** `src/features/customer/components/TableSelector.tsx`

```typescript
import { useCallback } from 'react';
import { customerEvents } from '@/features/shared';
import type { Table } from '@/features/shared';

interface TableSelectorProps {
  tables: Table[];
  onTableSelect: (table: Table) => void;
}

export function TableSelector({ tables, onTableSelect }: TableSelectorProps) {
  const handleTableSelect = useCallback((table: Table) => {
    // Track that customer selected this table
    customerEvents.tableSelected(table.id);
    
    // Proceed with normal flow
    onTableSelect(table);
  }, [onTableSelect]);

  return (
    <div className="grid grid-cols-4 gap-4">
      {tables.map((table) => (
        <button
          key={table.id}
          onClick={() => handleTableSelect(table)}
          className="p-4 border-2 rounded-lg hover:bg-blue-50"
        >
          Table {table.number}
        </button>
      ))}
    </div>
  );
}
```

---

## Example 2: PIN Entry Tracking

**File:** `src/features/customer/components/PinPad.tsx`

```typescript
import { useState } from 'react';
import { customerEvents } from '@/features/shared';

interface PinPadProps {
  tableId: string;
  onSuccess: () => void;
  onFailure: () => void;
}

export function PinPad({ tableId, onSuccess, onFailure }: PinPadProps) {
  const [pin, setPin] = useState('');

  const handleVerifyPin = async () => {
    try {
      const response = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ tableId, pin })
      });

      if (response.ok) {
        // Track successful PIN entry
        customerEvents.pinEntered(tableId, true);
        
        // Track session start
        customerEvents.sessionStarted(tableId);
        
        onSuccess();
      } else {
        // Track failed PIN attempt
        customerEvents.pinEntered(tableId, false);
        onFailure();
      }
    } catch (error) {
      customerEvents.pinEntered(tableId, false);
      onFailure();
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg">
      <input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter PIN"
        maxLength={6}
      />
      <button onClick={handleVerifyPin}>
        Verify PIN
      </button>
    </div>
  );
}
```

---

## Example 3: Order Placement Tracking

**File:** `src/features/customer/context/AppContext.tsx`

```typescript
import { createContext, useState, useCallback } from 'react';
import { customerEvents } from '@/features/shared';
import type { MenuItem, OrderItem } from '@/features/shared';

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [sessionStartTime] = useState(Date.now());

  const submitOrder = useCallback(async (tableId: string) => {
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);

    try {
      // Send order to server
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          items: cart,
          totalPrice
        })
      });

      if (response.ok) {
        // Track successful order placement
        customerEvents.orderPlaced(
          tableId,
          cart.length,           // Number of items
          totalPrice,            // Total price in cents/dollars
          sessionDuration        // Time from session start to order
        );

        // Clear cart for next order
        setCart([]);
      }
    } catch (error) {
      console.error('Failed to submit order:', error);
      // Don't track failed orders
    }
  }, [cart, sessionStartTime]);

  return (
    <AppContext.Provider value={{ cart, submitOrder }}>
      {children}
    </AppContext.Provider>
  );
}
```

---

## Example 4: Menu Browsing Tracking

**File:** `src/features/customer/components/MenuGrid.tsx`

```typescript
import { useState, useRef, useEffect } from 'react';
import { customerEvents } from '@/features/shared';
import type { MenuItem } from '@/features/shared';

interface MenuGridProps {
  category: string;
  items: MenuItem[];
}

export function MenuGrid({ category, items }: MenuGridProps) {
  const categoryEnteredAt = useRef(Date.now());
  const [previousCategory, setPreviousCategory] = useState(category);

  // Track time spent in category
  useEffect(() => {
    if (previousCategory && previousCategory !== category) {
      const timeSpent = Math.round((Date.now() - categoryEnteredAt.current) / 1000);
      
      customerEvents.menuBrowsed(previousCategory, timeSpent);
    }
    
    setPreviousCategory(category);
    categoryEnteredAt.current = Date.now();
  }, [category, previousCategory]);

  const handleMenuItemClick = (item: MenuItem) => {
    // Track which items customer is viewing
    customerEvents.menuItemViewed(item.name, item.category);
    
    // Add to cart logic...
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => handleMenuItemClick(item)}
          className="p-4 border rounded cursor-pointer hover:shadow-lg"
        >
          <h3>{item.name}</h3>
          <p className="text-gray-600">${item.price.toFixed(2)}</p>
          <p className="text-sm text-gray-400">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Example 5: Staff Authentication Tracking

**File:** `src/features/shared/context/AuthContext.tsx`

```typescript
import { createContext, useCallback } from 'react';
import { staffEvents } from '@/features/shared';

interface AuthContextType {
  loginAsStaff: (password: string, role: 'kitchen' | 'manager') => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>(null);

export function AuthProvider({ children }) {
  const loginAsStaff = useCallback(
    async (password: string, role: 'kitchen' | 'manager') => {
      const startTime = Date.now();

      try {
        const response = await fetch('/api/auth/staff-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, role })
        });

        if (response.ok) {
          // Track successful staff login
          staffEvents.loginSucceeded(role);
          return true;
        } else {
          // Track failed login attempt
          staffEvents.loginAttempted(role, false);
          return false;
        }
      } catch (error) {
        // Track login error
        staffEvents.loginAttempted(role, false);
        return false;
      }
    },
    []
  );

  const logout = useCallback(() => {
    // Get session duration from localStorage or state
    const sessionStart = localStorage.getItem('sessionStart');
    const role = localStorage.getItem('staffRole') as 'kitchen' | 'manager';

    if (sessionStart && role) {
      const duration = Math.floor((Date.now() - parseInt(sessionStart)) / 1000);
      
      // Track logout with session duration
      // (requires extending staffEvents.logout to accept duration)
      staffEvents.loginAttempted(role, true); // Simplified
    }

    // Clear session
    localStorage.removeItem('sessionStart');
    localStorage.removeItem('staffRole');
    localStorage.removeItem('authToken');
  }, []);

  return (
    <AuthContext.Provider value={{ loginAsStaff, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## Example 6: Kitchen Order Status Tracking

**File:** `src/features/kitchen/components/KitchenPage.tsx`

```typescript
import { useEffect, useRef } from 'react';
import { kitchenEvents } from '@/features/shared';
import type { Order, OrderStatus } from '@/features/shared';

export function KitchenPage() {
  const { orders } = useApp();
  const previousOrderCountRef = useRef(0);
  const orderTimersRef = useRef<Record<string, number>>({});

  // Track when new orders arrive at kitchen
  useEffect(() => {
    const newOrderCount = orders.length;
    
    if (newOrderCount > previousOrderCountRef.current) {
      const newOrders = orders.slice(previousOrderCountRef.current);
      
      newOrders.forEach((order) => {
        kitchenEvents.orderReceived(
          order.id,
          order.items.length
        );
        
        // Initialize timer for this order
        orderTimersRef.current[order.id] = Date.now();
      });
    }
    
    previousOrderCountRef.current = newOrderCount;
  }, [orders]);

  const handleOrderStatusChange = (orderId: string, newStatus: OrderStatus) => {
    // Update order status
    api.updateOrderStatus(orderId, newStatus);
    
    // Track status transition
    kitchenEvents.orderStatusChanged(orderId, newStatus);

    // If order is complete, calculate preparation time
    if (newStatus === 'ready') {
      const startTime = orderTimersRef.current[orderId];
      if (startTime) {
        const prepTime = Math.floor((Date.now() - startTime) / 1000);
        kitchenEvents.averagePreparationTime('preparing', prepTime);
        delete orderTimersRef.current[orderId];
      }
    }
  };

  return (
    <div className="p-6">
      {orders.map((order) => (
        <div key={order.id} className="mb-4 p-4 border rounded">
          <h3>Order #{order.number}</h3>
          <p>{order.items.length} items</p>
          
          <div className="mt-4 space-y-2">
            {['received', 'preparing', 'ready'].map((status) => (
              <button
                key={status}
                onClick={() => handleOrderStatusChange(order.id, status as OrderStatus)}
                className={`block w-full p-2 text-left ${
                  order.status === status ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Example 7: Admin Menu Management Tracking

**File:** `src/features/admin/components/MenuManager.tsx`

```typescript
import { useState } from 'react';
import { adminEvents } from '@/features/shared';
import type { MenuItem } from '@/features/shared';

export function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);

  const handleAddMenuItem = async (newItem: MenuItem) => {
    try {
      const response = await fetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        const added = await response.json();
        setItems([...items, added]);

        // Track menu addition
        adminEvents.menuItemAdded(
          newItem.name,
          newItem.category,
          newItem.price
        );
      }
    } catch (error) {
      console.error('Failed to add menu item:', error);
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    try {
      await fetch(`/api/menu/items/${itemId}`, { method: 'DELETE' });
      setItems(items.filter((item) => item.id !== itemId));

      // Track menu deletion
      adminEvents.menuItemDeleted(itemId);
    } catch (error) {
      console.error('Failed to delete menu item:', error);
    }
  };

  const handleChangePIN = async (newPin: string) => {
    try {
      await fetch('/api/settings/pin', {
        method: 'PUT',
        body: JSON.stringify({ pin: newPin })
      });

      // Track PIN change
      adminEvents.pinChanged(newPin.length);
    } catch (error) {
      console.error('Failed to change PIN:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Menu Manager</h1>

      {/* Menu items list */}
      <div className="mb-8">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-4 border rounded mb-2">
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-gray-600">${item.price.toFixed(2)}</p>
            </div>
            <button
              onClick={() => handleDeleteMenuItem(item.id)}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Add new item button */}
      <button
        onClick={() => {
          const name = prompt('Item name:');
          if (name) {
            handleAddMenuItem({
              id: Date.now().toString(),
              name,
              category: 'Uncategorized',
              price: 0
            });
          }
        }}
        className="bg-green-500 text-white px-6 py-2 rounded mb-8"
      >
        Add New Item
      </button>

      {/* PIN settings */}
      <div className="mt-8 p-4 border-t">
        <h2 className="text-xl font-bold mb-4">Security Settings</h2>
        <button
          onClick={() => {
            const pin = prompt('New PIN:');
            if (pin) handleChangePIN(pin);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Change PIN
        </button>
      </div>
    </div>
  );
}
```

---

## Example 8: Error Tracking

**File:** `src/features/shared/components/ErrorBoundary.tsx`

```typescript
import { Component, ReactNode } from 'react';
import { systemEvents } from '@/features/shared';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Track error in analytics
    systemEvents.errorOccurred(
      'react_error',
      `${error.message}\n${error.stack}`
    );

    // Also log to console for debugging
    console.error('Error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded">
          <h1 className="text-xl font-bold text-red-600 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Integration Checklist

Use this checklist to track analytics integration across your app:

- [ ] **Customer Feature**
  - [ ] Table selection tracking (TableSelector)
  - [ ] PIN entry tracking (PinPad)
  - [ ] Session start/end (AuthContext integration)
  - [ ] Menu browsing tracking (MenuGrid)
  - [ ] Menu item views (MenuGrid)
  - [ ] Order placement (AppContext)

- [ ] **Staff Feature**
  - [ ] Login tracking (StaffLoginForm)
  - [ ] Password change tracking (PasswordManager)
  - [ ] Logout tracking (AuthContext)

- [ ] **Kitchen Feature**
  - [ ] Order received (KitchenPage)
  - [ ] Status changes (KitchenPage)
  - [ ] Order cancelled (KitchenPage)
  - [ ] Prep time calculation (KitchenPage)

- [ ] **Admin/Manager Feature**
  - [ ] Menu item add/edit/delete (MenuManager)
  - [ ] Table add/delete (TableManager)
  - [ ] PIN changes (SecuritySettings)
  - [ ] Settings updates (SettingsManager)

- [ ] **System Events**
  - [ ] Error boundary (ErrorBoundary)
  - [ ] API latency tracking (hooks)
  - [ ] SSE connection monitoring (useServerEvents)
  - [ ] Idle timeout (idle timer hook)

---

## Testing Your Integration

```bash
# 1. Start the app
npm run dev

# 2. Open browser DevTools (F12)

# 3. Check console for Umami
window.umami

# 4. Manually trigger events to test
window.umami?.track('test_event', { property: 'value' })

# 5. Visit Umami dashboard
# Check Events tab to see events arriving in real-time

# 6. Run tests to ensure no regressions
npm run test
```

---

**Next:** Follow the examples above and add analytics calls to your components!
