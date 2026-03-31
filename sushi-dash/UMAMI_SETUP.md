# 📊 Umami Analytics Integration Guide

## What is Umami?

Umami is a **privacy-focused analytics platform** that tracks website usage without compromising user privacy. It's GDPR-compliant and requires no cookie consent.

**Benefits for Sushi Dash:**
- ✅ Privacy-first (no personal data collected)
- ✅ GDPR compliant (no cookie consent needed)
- ✅ Real-time analytics dashboard
- ✅ Custom event tracking
- ✅ No vendor lock-in (self-hostable)
- ✅ Lightweight (minimal JS payload impact)

---

## Setup Instructions

### 1. Choose Deployment Method

#### **Cloud (Easiest Setup)**
```bash
# 1. Go to https://app.umami.is
# 2. Sign up for free account
# 3. Add new website, get your TRACKING_ID
# NEXT_PUBLIC_UMAMI_ENDPOINT will default to https://analytics.umami.is
```

#### **Self-Hosted (More Control)**
```bash
# Deploy with Docker
docker run -d \
  --name umami \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@db:5432/umami" \
  ghcr.io/umami-software/umami:latest
```

### 2. Configure Environment Variables

**Create `.env.local`:**
```bash
# Required
NEXT_PUBLIC_UMAMI_ID=your-tracking-id-from-umami

# Optional (defaults to https://analytics.umami.is)
NEXT_PUBLIC_UMAMI_ENDPOINT=https://analytics.umami.is

# For self-hosted:
# NEXT_PUBLIC_UMAMI_ENDPOINT=http://localhost:3000
```

### 3. Verify Setup

After starting the app, check browser console:
```javascript
// Should see in console:
window.umami // ✅ Should exist if script loaded
```

---

## Using Analytics in Your App

### Basic Event Tracking

```typescript
import { customerEvents, trackEvent } from '@/features/shared';

// Track when customer selects a table
customerEvents.tableSelected('table-5');

// Track custom events
trackEvent('feature_used', { feature: 'gift_card_applied' });
```

### Feature-Specific Events

#### **Customer Feature**
```typescript
import { customerEvents } from '@/features/shared';

// In MenuOrderingView.tsx
export function MenuOrderingView() {
  const handleOrderPlace = (items) => {
    customerEvents.orderPlaced(
      tableId,
      items.length,     // item count
      totalPrice,       // total price
      sessionDuration   // how long customer ordered
    );
  };
}
```

#### **Staff Feature**
```typescript
import { staffEvents } from '@/features/shared';

// In StaffLoginForm.tsx
const handleLogin = async (password) => {
  const success = await authenticate(password);
  staffEvents.loginAttempted('kitchen', success);
  if (success) {
    staffEvents.loginSucceeded('kitchen');
  }
};
```

#### **Admin/Manager**
```typescript
import { adminEvents } from '@/features/shared';

// In MenuManager.tsx
const addMenuItem = (item) => {
  api.createMenuItem(item);
  adminEvents.menuItemAdded(item.name, item.category, item.price);
};
```

#### **Kitchen Events**
```typescript
import { kitchenEvents } from '@/features/shared';

// In KitchenPage.tsx
const updateOrderStatus = (orderId, newStatus) => {
  api.updateOrderStatus(orderId, newStatus);
  kitchenEvents.orderStatusChanged(orderId, newStatus);
};
```

---

## Recommended Events to Track

### High Priority (Core Metrics)

```typescript
// Customer journey
customerEvents.tableSelected('table-1');           // Entry point
customerEvents.sessionStarted('table-1');          // Active session
customerEvents.cartUpdated('table-1', 3, 45.99);   // Cart interactions
customerEvents.orderPlaced('table-1', 5, 85.50);   // Income indicator

// Staff access
staffEvents.loginSucceeded('manager');             // Who's accessing admin
staffEvents.loginSucceeded('kitchen');             // Kitchen staff activity

// System health
systemEvents.errorOccurred('api_error', 'Failed to fetch orders');
systemEvents.sseConnectionLost(1);                 // Connection issues
```

### Medium Priority (Feature Usage)

```typescript
// Customer behavior
customerEvents.menuItemViewed('Dragon Roll', 'Specialty Rolls');
customerEvents.menuBrowsed('Appetizers', 180);    // Time spent in category

// Admin operations
adminEvents.tableAdded(12);                       // Adding capacity
adminEvents.pinChanged(5);                        // Security changes
adminEvents.orderLimitChanged(50);                // Config changes

// Kitchen operations
kitchenEvents.orderReceived('order-123', 4);     // Order volume
kitchenEvents.averagePreparationTime('preparing', 300);
```

### Low Priority (Optional Tracking)

```typescript
// Performance monitoring
systemEvents.apiLatency('/api/orders', 245);      // API response times
systemEvents.idleTimeoutTriggered(1800);          // Idle behavior

// Session management
systemEvents.graceperiodUsed();                   // Grace period usage
customerEvents.sessionEnded('table-1', 1200);     // Session length
```

---

## Example Implementations

### Complete Example: MenuOrderingView

```typescript
import { useEffect, useState } from 'react';
import { customerEvents } from '@/features/shared';

export function MenuOrderingView({ table }) {
  const [browsedCategory, setBrowsedCategory] = useState('');
  const [categoryEnteredAt, setCategoryEnteredAt] = useState(0);

  const handleCategoryChange = (category) => {
    // Track time spent in previous category
    if (browsedCategory && categoryEnteredAt) {
      const timeSpent = Date.now() - categoryEnteredAt;
      customerEvents.menuBrowsed(browsedCategory, Math.round(timeSpent / 1000));
    }

    // Enter new category
    setBrowsedCategory(category);
    setCategoryEnteredAt(Date.now());
  };

  const handleMenuItemClick = (item) => {
    customerEvents.menuItemViewed(item.name, item.category);
  };

  const handleOrderSubmit = (items, total) => {
    // Calculate session duration
    const sessionDuration = Math.round((Date.now() - sessionStartedAt) / 1000);
    
    customerEvents.orderPlaced(
      table.id,
      items.length,
      total,
      sessionDuration
    );
  };

  return (
    // ... JSX
  );
}
```

### Complete Example: KitchenPage

```typescript
import { useEffect } from 'react';
import { kitchenEvents } from '@/features/shared';

export function KitchenPage() {
  const { orders } = useApp();

  // Track when new order arrives
  const previousOrderCount = useRef(0);
  useEffect(() => {
    if (orders.length > previousOrderCount.current) {
      const newOrders = orders.slice(previousOrderCount.current);
      newOrders.forEach(order => {
        kitchenEvents.orderReceived(
          order.id,
          order.items.length
        );
      });
    }
    previousOrderCount.current = orders.length;
  }, [orders]);

  const handleStatusChange = (orderId, newStatus) => {
    api.updateOrderStatus(orderId, newStatus);
    
    // Track status transitions
    kitchenEvents.orderStatusChanged(orderId, newStatus);
  };

  return (
    // ... JSX
  );
}
```

---

## Umami Dashboard Features

Once tracking is live, visit your Umami dashboard to see:

### **Real-time Activity**
- Current visitors by page
- Active sessions
- Events happening now

### **Top Pages**
- Which pages get most traffic
- Customer entry points
- Staff access patterns

### **Events**
- Custom event tracking in real-time
- Event breakdown by properties
- Trend analysis

### **Reports**
- Time-based analytics
- Funnel analysis (is pin entry → menu → order conversion optimized?)
- Visitor insights

---

## Privacy Considerations

✅ **No Cookies** - Umami uses a simple session ID, not persistent cookies  
✅ **No Fingerprinting** - No attempt to identify users across devices  
✅ **No Personal Data** - No names, emails, or IDs tracked  
✅ **Aggregated Data** - All analytics are aggregated, never personal  
✅ **GDPR Compliant** - No consent notice required  

---

## Performance Impact

| Metric | Impact |
|--------|--------|
| Script Size | ~5 KB (gzipped) |
| Load Time | <50ms async |
| Runtime Overhead | ~1-2ms per event |
| Network Calls | 1 per event (batched in some cases) |

**Verdict**: Negligible impact on performance.

---

## Troubleshooting

### Events not appearing in dashboard?

```javascript
// Check if Umami loaded
console.log(window.umami); // Should exist

// Try manual tracking
window.umami?.track('test_event');

// Check browser console for errors
// Check network tab for POST requests to analytics endpoint
```

### Wrong tracking ID?

```bash
# Update .env.local and restart:
NEXT_PUBLIC_UMAMI_ID=correct_id_here

# Rebuild and redeploy
npm run build
npm run dev
```

### Self-hosted instance not responding?

```bash
# Check container logs
docker logs umami

# Verify database connection
docker exec umami psql -U umami -c "SELECT version();"
```

---

## Next Steps

1. ✅ Configure `.env.local` with your tracking ID
2. ✅ Start the app and verify Umami script loads
3. ✅ Visit Umami dashboard and confirm data is arriving
4. ✅ Implement hooks in key user flows (see examples above)
5. ✅ Set up alerts for critical metrics (e.g., order funnel completion)
6. ✅ Review analytics weekly to identify optimization opportunities

---

**Questions?** Check [Umami Docs](https://umami.is/docs) or your deployment provider's documentation.
