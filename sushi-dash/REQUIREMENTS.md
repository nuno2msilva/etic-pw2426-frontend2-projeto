# Sushi Dash — Project Requirements Checklist

Comprehensive documentation mapping each project requirement to its concrete implementation with file references, code snippets, and line numbers.

---

## ✅ 1. Next.js

**Version:** `next@^16.1.6` — [package.json#L37](sushi-dash/package.json#L37)

**App Router** — full `app/` directory structure:

```
app/
├── layout.tsx              → Root layout (metadata, providers, JSON-LD)
├── providers.tsx            → Client-side provider tree
├── page.tsx                 → /  (CustomerPage)
├── not-found.tsx            → 404
├── kitchen/page.tsx         → /kitchen  (KitchenPage)
├── manager/page.tsx         → /manager  (ManagerPage)
└── table/[tableId]/page.tsx → /table/:id  (TablePage — dynamic route)
```

**Configuration** — [next.config.ts](sushi-dash/next.config.ts):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:3001/api/:path*" },
    ];
  },
};
export default nextConfig;
```

**Scripts** — [package.json#L6-L12](sushi-dash/package.json#L6-L12):

```json
"dev": "next dev --port 5173 --turbopack",
"build": "next build",
"start": "next start"
```

**Turbopack** is enabled for development via the `--turbopack` flag.

---

## ✅ 2. TypeScript

**Version:** `typescript@^5.8.3` — [package.json#L68](sushi-dash/package.json#L68)

**Configuration** — [tsconfig.json](sushi-dash/tsconfig.json):

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": false,
    "isolatedModules": true,
    "paths": { "@/*": ["./src/*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", "app/**/*.ts", "app/**/*.tsx"]
}
```

The entire codebase uses `.ts` and `.tsx` files exclusively — no JavaScript files in source.

**Type definitions** — [src/types/models.ts](sushi-dash/src/types/models.ts): `MenuItem`, `Category`, `Table`, `Order`, `OrderItem`, `OrderStatus`, `OrderSettings`.

---

## ✅ 3. Hooks — `useState` & `useEffect`

### `useState`

| File | Line | Usage |
|------|------|-------|
| [AuthContext.tsx](sushi-dash/src/context/AuthContext.tsx#L42-L44) | 42–44 | `const [customerSession, setCustomerSession] = useState<AuthSession \| null>(null)` — manages customer and staff auth sessions |
| [useOrderingFlow.ts](sushi-dash/src/hooks/useOrderingFlow.ts#L49-L53) | 49–53 | `const [cart, setCart] = useState<Record<string, number>>({})` — cart state, open categories, modals |
| [AppHeader.tsx](sushi-dash/src/components/app/AppHeader.tsx#L19-L25) | 19–25 | `const [isDark, setIsDark] = useState(...)` — dark mode toggle with lazy initializer reading from `localStorage` |
| [OrderSettingsManager.tsx](sushi-dash/src/components/app/OrderSettingsManager.tsx#L8-L9) | 8–9 | `const [maxItems, setMaxItems] = useState(settings.maxItemsPerOrder)` — local form state for admin settings |

### `useEffect`

| File | Line | Purpose |
|------|------|---------|
| [AuthContext.tsx](sushi-dash/src/context/AuthContext.tsx#L51-L60) | 51–60 | Initialise passwords and restore sessions from `localStorage` on mount |
| [SEOHead.tsx](sushi-dash/src/components/app/SEOHead.tsx#L13-L28) | 13–28 | Dynamically updates `document.title` and `<meta name="description">` when props change |
| [AppHeader.tsx](sushi-dash/src/components/app/AppHeader.tsx#L27-L32) | 27–32 | Syncs dark mode class on `<html>` element and persists preference to `localStorage` |
| [useOrderingFlow.ts](sushi-dash/src/hooks/useOrderingFlow.ts#L55-L68) | 55–68 | Restores persisted cart from `sessionStorage` on mount; auto-opens categories that have items in cart |
| [KitchenPage.tsx](sushi-dash/src/views/KitchenPage.tsx#L66-L73) | 66–73 | Redirects unauthenticated users to `/` via `router.push` |

---

## ✅ 4. Styling — Tailwind CSS

**Version:** `tailwindcss@^3.4` with `tailwindcss-animate@^1.0.7` — [package.json#L43-L44](sushi-dash/package.json#L43-L44)

**Configuration** — [tailwind.config.ts](sushi-dash/tailwind.config.ts):

```ts
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"
  ],
  // ... extensive theme with custom colors, border radius, keyframes, animations
};
```

**PostCSS** — [postcss.config.js](sushi-dash/postcss.config.js):

```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

**Global styles** — [src/index.css](sushi-dash/src/index.css#L3-L5):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Includes CSS custom properties for theming (light/dark mode), custom font imports (`@fontsource-variable/outfit`), and custom scrollbar styles.

**Usage examples:**

```tsx
/* MenuGrid.tsx — responsive grid */
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">

/* OrderCard.tsx — status-aware styling */
<Badge variant={STATUS_BADGE_VARIANT[order.status]}>{STATUS_LABELS[order.status]}</Badge>

/* AppHeader.tsx — sticky header with backdrop blur */
<header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
```

---

## ✅ 5. Authentication

### Architecture

Two independent auth sessions running simultaneously:

- **Customer session** — 4-digit PIN per table → JWT in `sushi_customer` httpOnly cookie
- **Staff session** — password-based → JWT in `sushi_staff` httpOnly cookie

### Frontend — [src/context/AuthContext.tsx](sushi-dash/src/context/AuthContext.tsx)

```tsx
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customerSession, setCustomerSession] = useState<AuthSession | null>(null);
  const [staffSession, setStaffSession] = useState<AuthSession | null>(null);

  // loginAsCustomer — verifies PIN against backend, receives JWT cookie
  // loginAsKitchen / loginAsManager — verifies hashed password
  // checkAccess('manager' | 'kitchen') — role-based guard
};
```

### Auth utilities — [src/lib/auth.ts](sushi-dash/src/lib/auth.ts)

```ts
export async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function loginTableWithPin(tableId: string, pin: string) {
  const res = await fetch(`${API_BASE}/api/auth/table`, {
    method: "POST", credentials: "include",
    body: JSON.stringify({ tableId: Number(tableId), pin }),
  });
}
```

### Backend JWT — [server/src/middleware/auth.ts](sushi-dash/server/src/middleware/auth.ts)

```ts
import jwt from "jsonwebtoken";
const TOKEN_EXPIRY = "8h";

export function issueToken(res: Response, role: AuthRole, tableId?: number, pinVersion?: number) {
  const token = jwt.sign({ role, tableId, pinVersion, jti: randomUUID() }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.cookie(role === "customer" ? COOKIE_CUSTOMER : COOKIE_STAFF, token, { httpOnly: true, sameSite: "lax" });
}
```

### Permission matrix

| Action | Customer | Kitchen | Manager |
|--------|----------|---------|---------|
| Place orders | ✅ (own table) | ❌ | ✅ |
| Update order status | ❌ | ✅ | ✅ |
| Cancel own queued orders | ✅ (own table) | ❌ | ✅ |
| Manage menu/tables/PINs | ❌ | ❌ | ✅ |

---

## ✅ 6. SEO

### Static metadata — [app/layout.tsx#L19-L65](sushi-dash/app/layout.tsx#L19-L65)

```tsx
export const metadata: Metadata = {
  title: { default: "Sushi Dash — Sushi Restaurant Ordering", template: "%s | Sushi Dash" },
  description: "Order fresh sushi from your table...",
  keywords: ["sushi", "restaurant", "ordering system", ...],
  openGraph: { title: "Sushi Dash", description: "...", type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image", title: "Sushi Dash", description: "..." },
  icons: { icon: "/favicon.ico" },
  robots: { index: true, follow: true },
};
```

### JSON-LD structured data — [app/layout.tsx#L77-L118](sushi-dash/app/layout.tsx#L77-L118)

```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Sushi Dash",
  servesCuisine: "Japanese",
  hasMenu: {
    "@type": "Menu",
    hasMenuSection: [
      { "@type": "MenuSection", name: "Nigiri", description: "Traditional hand-pressed sushi" },
      // ... 9 more sections
    ],
  },
  potentialAction: { "@type": "OrderAction", target: { "@type": "EntryPoint", urlTemplate: "..." } },
}) }} />
```

### Dynamic per-page SEO — [src/components/app/SEOHead.tsx](sushi-dash/src/components/app/SEOHead.tsx)

```tsx
const SEOHead = ({ title, description }: SEOHeadProps) => {
  useEffect(() => {
    document.title = `${title} | Sushi Dash`;
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) { metaDesc = document.createElement("meta"); ... }
      metaDesc.setAttribute("content", description);
    }
  }, [title, description]);
};
```

Used on every page: `<SEOHead title="Kitchen Dashboard" description="Process incoming sushi orders..." />`

---

## ✅ 7. API CRUD Operations (`fetch`)

All HTTP methods implemented in [src/lib/api.ts](sushi-dash/src/lib/api.ts) using the native `fetch` API:

| Operation | Method | Function | Line | Endpoint |
|-----------|--------|----------|------|----------|
| **Read** | `GET` | `fetchMenu()` | [L11](sushi-dash/src/lib/api.ts#L11) | `/api/menu` |
| **Read** | `GET` | `fetchCategories()` | [L105](sushi-dash/src/lib/api.ts#L105) | `/api/categories` |
| **Read** | `GET` | `fetchTablesWithPins()` | [L147](sushi-dash/src/lib/api.ts#L147) | `/api/tables` |
| **Read** | `GET` | `fetchOrders()` | [L224](sushi-dash/src/lib/api.ts#L224) | `/api/orders` |
| **Read** | `GET` | `fetchSettings()` | [L340](sushi-dash/src/lib/api.ts#L340) | `/api/settings` |
| **Create** | `POST` | `createMenuItem()` | [L29](sushi-dash/src/lib/api.ts#L29) | `/api/menu` |
| **Create** | `POST` | `createTable()` | [L163](sushi-dash/src/lib/api.ts#L163) | `/api/tables` |
| **Create** | `POST` | `createOrder()` | [L266](sushi-dash/src/lib/api.ts#L266) | `/api/orders/table/:tableId` |
| **Update** | `PATCH` | `toggleItemAvailability()` | [L81](sushi-dash/src/lib/api.ts#L81) | `/api/menu/:id/availability` |
| **Update** | `PATCH` | `updateOrderStatus()` | [L308](sushi-dash/src/lib/api.ts#L308) | `/api/orders/:id/status` |
| **Update** | `PUT` | `updateTable()` | [L170](sushi-dash/src/lib/api.ts#L170) | `/api/tables/:id` |
| **Update** | `PUT` | `updateSettings()` | [L355](sushi-dash/src/lib/api.ts#L355) | `/api/settings` |
| **Delete** | `DELETE` | `deleteMenuItem()` | [L95](sushi-dash/src/lib/api.ts#L95) | `/api/menu/:id` |
| **Delete** | `DELETE` | `deleteTable()` | [L185](sushi-dash/src/lib/api.ts#L185) | `/api/tables/:id` |
| **Delete** | `DELETE` | `deleteOrder()` | [L323](sushi-dash/src/lib/api.ts#L323) | `/api/orders/:id` |

**Example — POST with `fetch`:**

```ts
export async function createMenuItem(item: Omit<MenuItem, "id">): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/api/menu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name: item.name, emoji: item.emoji, category_name: item.category }),
  });
  if (!res.ok) throw new Error("Failed to create menu item");
  return res.json();
}
```

**Example — DELETE with `fetch`:**

```ts
export async function deleteMenuItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/menu/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete menu item");
}
```

---

## ✅ 8. Navigation

All navigation uses **Next.js App Router** (`next/link` and `next/navigation`):

### `next/link` — [AppHeader.tsx#L3](sushi-dash/src/components/app/AppHeader.tsx#L3)

```tsx
import Link from "next/link";

<Link href="/?select=true" className="flex items-center gap-2">
  <span className="text-2xl">🍣</span>
  <span className="font-display text-xl font-bold">Sushi <span className="text-primary">Dash</span></span>
</Link>
```

### `usePathname` + `useRouter` — [AppHeader.tsx#L4](sushi-dash/src/components/app/AppHeader.tsx#L4)

```tsx
import { usePathname, useRouter } from "next/navigation";
const pathname = usePathname();       // e.g. "/kitchen", "/manager"
const router = useRouter();
router.push("/");                     // programmatic navigation
```

### `useParams` (dynamic routes) — [TablePage.tsx#L14](sushi-dash/src/views/TablePage.tsx#L14)

```tsx
import { useParams, useSearchParams, useRouter } from "next/navigation";
const params = useParams<{ tableId: string }>();
const tableId = params?.tableId;       // from /table/[tableId]
```

### `useSearchParams` — [CustomerPage.tsx#L19](sushi-dash/src/views/CustomerPage.tsx#L19)

```tsx
import { useSearchParams } from "next/navigation";
const searchParams = useSearchParams();
const skipAutoRestore = searchParams.get("select") === "true";
```

### Route structure

| Route | Page | Auth |
|-------|------|------|
| `/` | Table selector + ordering | PIN required |
| `/table/[tableId]` | Direct table ordering (dynamic) | PIN |
| `/kitchen` | Real-time order dashboard | Kitchen/Manager password |
| `/manager` | Admin panel | Manager password |

---

## ✅ 9. Responsive Design

Mobile-first approach using Tailwind CSS responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`):

### Menu grid — [MenuGrid.tsx](sushi-dash/src/components/app/MenuGrid.tsx#L33)

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
```

2 columns on mobile → 6 columns on extra-large screens.

### Table selector — [TableSelector.tsx](sushi-dash/src/components/app/TableSelector.tsx#L73)

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
```

### Kitchen order grid — [KitchenPage.tsx](sushi-dash/src/views/KitchenPage.tsx#L104)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

Single column on mobile → 2 columns on desktop.

### Responsive text visibility — [AppHeader.tsx](sushi-dash/src/components/app/AppHeader.tsx#L94)

```tsx
<span className="hidden sm:inline">Logout</span>
```

Text hidden on mobile, only icon shown; text appears on `sm:` and above.

### Max-width container constraint

```tsx
<main className="max-w-5xl mx-auto px-4 py-8">
```

Content centered with horizontal padding on all pages.

---

## ✅ 10. Bonus: Hosted Online (Vercel)

**Deployment configuration** — [vercel.json](sushi-dash/vercel.json):

```json
{
  "buildCommand": "prisma generate --schema=server/prisma/schema.prisma && next build",
  "installCommand": "npm install && cd server && npm install",
  "framework": "nextjs"
}
```

**Metadata URL** — [app/layout.tsx#L34](sushi-dash/app/layout.tsx#L34):

```tsx
metadataBase: new URL("https://sushi-dash.vercel.app"),
```

The application is deployed and accessible at the Vercel URL configured in the metadata.

---

## ✅ 11. Unit Testing (Jest)

**Version:** `jest@^30.2.0` with `@testing-library/react@^16.3.2` — [package.json#L48-L51](sushi-dash/package.json#L48-L51)

**Configuration** — [jest.config.cjs](sushi-dash/jest.config.cjs):

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/lib/config$': '<rootDir>/src/test/__mocks__/config.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterSetup: ['<rootDir>/src/test/setup.ts'],
};
```

**Test results: 22 suites, 373 tests — all passing ✅**

| Suite | File | Tests |
|-------|------|-------|
| API | [api.test.ts](sushi-dash/src/test/api.test.ts) | 47 |
| Auth | [auth.test.ts](sushi-dash/src/test/auth.test.ts) | 52 |
| Components | [components.test.tsx](sushi-dash/src/test/components.test.tsx) | 36 |
| Data | [data.test.ts](sushi-dash/src/test/data.test.ts) | 13 |
| Order Status | [order-status.test.ts](sushi-dash/src/test/order-status.test.ts) | 8 |
| Utils | [utils.test.ts](sushi-dash/src/test/utils.test.ts) | 6 |
| CRT UX Elements | [crt-ux-elements.test.tsx](sushi-dash/src/test/crt-ux-elements.test.tsx) | 14 |
| Presence Lifecycle | [presence-lifecycle.test.ts](sushi-dash/src/test/presence-lifecycle.test.ts) | 45 |
| Analytics | [analytics.test.ts](sushi-dash/src/test/analytics.test.ts) | 22 |
| SEO Metadata | [seo-metadata.test.tsx](sushi-dash/src/test/seo-metadata.test.tsx) | 14 |
| Navigation Routing | [navigation-routing.test.tsx](sushi-dash/src/test/navigation-routing.test.tsx) | 20 |
| Context & Derived State | [context-derived-state.test.ts](sushi-dash/src/test/context-derived-state.test.ts) | 34 |
| Authorization Behavior | [authorization-behavior.test.tsx](sushi-dash/src/test/authorization-behavior.test.tsx) | 12 |
| Auth Session Enforcement | [auth-session-enforcement.test.tsx](sushi-dash/src/test/auth-session-enforcement.test.tsx) | 8 |
| Menu Ordering View | [menu-ordering-view.test.tsx](sushi-dash/src/test/menu-ordering-view.test.tsx) | 7 |
| Staff Mobile Layout | [staff-mobile-layout.test.tsx](sushi-dash/src/test/staff-mobile-layout.test.tsx) | 4 |
| Proxy Access Control | [proxy-access-control.test.ts](sushi-dash/src/test/proxy-access-control.test.ts) | 6 |
| Providers Presence | [providers-presence.test.ts](sushi-dash/src/test/providers-presence.test.ts) | 6 |
| Table Presence Stability | [table-presence-stability.test.ts](sushi-dash/src/test/table-presence-stability.test.ts) | 3 |
| Server Events Presence | [server-events-presence-switch.test.ts](sushi-dash/src/test/server-events-presence-switch.test.ts) | 8 |
| Server Events Ejection | [server-events-ejection.test.tsx](sushi-dash/src/test/server-events-ejection.test.tsx) | 7 |
| Admin Panel Live Updates | [admin-panel-live-updates.test.tsx](sushi-dash/src/test/admin-panel-live-updates.test.tsx) | 1 |

**Example test** — [components.test.tsx](sushi-dash/src/test/components.test.tsx):

```tsx
describe("CartSummaryBanner", () => {
  it("shows empty message when cart is empty", () => {
    render(<CartSummaryBanner summary="" />);
    expect(screen.getByText(/Start picking/)).toBeDefined();
  });

  it("renders the cart summary text when items are added", () => {
    render(<CartSummaryBanner summary="#1 Salmon Nigiri (2x)" />);
    expect(screen.getByText(/Salmon Nigiri/)).toBeDefined();
  });
});
```

**Commands:**

```sh
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## ✅ 12. Context API

Two React Contexts provide global state to all components:

### AppContext — [src/context/AppContext.tsx](sushi-dash/src/context/AppContext.tsx)

```tsx
import React, { createContext, useContext, useCallback, useMemo, useRef } from "react";

interface AppContextType {
  menu: MenuItem[];
  tables: Table[];
  orders: Order[];
  categories: string[];
  settings: OrderSettings;
  placeOrder: (tableId: string, items: { itemId: string; quantity: number }[]) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addMenuItem: (item: Omit<MenuItem, "id">) => void;
  removeMenuItem: (id: string) => void;
  // ... 10+ more actions
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
```

### AuthContext — [src/context/AuthContext.tsx](sushi-dash/src/context/AuthContext.tsx)

```tsx
const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
```

### Provider tree — [app/providers.tsx](sushi-dash/app/providers.tsx):

```tsx
<QueryClientProvider client={queryClient}>
  <TooltipProvider>
    <AuthProvider>
      <AppProvider>
        <AppHeader />
        {children}
      </AppProvider>
    </AuthProvider>
  </TooltipProvider>
</QueryClientProvider>
```

---

## ✅ 13. Animations

**Library:** `tailwindcss-animate@^1.0.7` — [package.json#L44](sushi-dash/package.json#L44)

### Dialog open/close animations — [src/components/ui/dialog.tsx](sushi-dash/src/components/ui/dialog.tsx)

```tsx
/* Overlay fade */
className="data-[state=open]:animate-in data-[state=closed]:animate-out
           data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"

/* Content zoom + slide */
className="data-[state=open]:animate-in data-[state=closed]:animate-out
           data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
           data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
           data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2
           data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]"
```

### Tooltip animations — [src/components/ui/tooltip.tsx](sushi-dash/src/components/ui/tooltip.tsx)

```tsx
className="animate-in fade-in-0 zoom-in-95
           data-[state=closed]:animate-out data-[state=closed]:fade-out-0
           data-[state=closed]:zoom-out-95
           data-[side=bottom]:slide-in-from-top-2
           data-[side=top]:slide-in-from-bottom-2"
```

### CSS transitions — used across components

```tsx
/* Button hover */      className="transition-colors"        /* button.tsx */
/* Chevron rotation */  className="transition-transform"     /* CollapsibleSection.tsx */
/* Hover scale */       className="hover:scale-105"          /* MenuGrid.tsx */
```

### Custom keyframes — [tailwind.config.ts](sushi-dash/tailwind.config.ts):

```ts
keyframes: {
  "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
  "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
},
animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up":   "accordion-up 0.2s ease-out",
},
```

---

## ✅ 14. React Query (`@tanstack/react-query`)

**Version:** `@tanstack/react-query@^5.83.0` — [package.json#L27](sushi-dash/package.json#L27)

**All hooks in** [src/hooks/useApiQueries.ts](sushi-dash/src/hooks/useApiQueries.ts):

### `useQuery` — data fetching with caching

```ts
export function useMenuQuery() {
  return useQuery({
    queryKey: queryKeys.menu,
    queryFn: api.fetchMenu,
    staleTime: 1000 * 60 * 5,    // 5 min cache
    refetchInterval: 1000 * 30,  // poll every 30s
  });
}

export function useOrdersQuery(tableId?: string) {
  return useQuery({
    queryKey: tableId ? queryKeys.ordersByTable(tableId) : queryKeys.orders,
    queryFn: () => tableId ? api.fetchOrdersByTable(tableId) : api.fetchOrders(),
    refetchInterval: 3000,       // poll every 3s for kitchen real-time
  });
}
```

### `useMutation` + `useQueryClient` — write operations with cache invalidation

```ts
export function useAddMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Omit<MenuItem, "id">) => api.createMenuItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}
```

### Query keys — centralized for consistent invalidation

```ts
const queryKeys = {
  menu: ["menu"] as const,
  categories: ["categories"] as const,
  tables: ["tables"] as const,
  orders: ["orders"] as const,
  ordersByTable: (tableId: string) => ["orders", "table", tableId] as const,
  settings: ["settings"] as const,
};
```

---

## ✅ 15. `useMemo`, `useCallback` & `useRef`

All three hooks used extensively in [src/context/AppContext.tsx](sushi-dash/src/context/AppContext.tsx) and [src/hooks/useOrderingFlow.ts](sushi-dash/src/hooks/useOrderingFlow.ts):

### `useMemo` — derived state optimization

**AppContext.tsx** — [lines 141–166](sushi-dash/src/context/AppContext.tsx#L141-L166):

```tsx
const menu = useMemo(() => menuQuery.data ?? [], [menuQuery.data]);
const tables = useMemo(() => tablesQuery.data ?? [], [tablesQuery.data]);
const categories = useMemo(() => {
  const cats = new Set(menu.map((m) => m.category));
  return Array.from(cats);
}, [menu]);
```

**useOrderingFlow.ts** — [lines 57–80](sushi-dash/src/hooks/useOrderingFlow.ts#L57-L80):

```tsx
const totalItems = useMemo(() => Object.values(cart).reduce((sum, qty) => sum + qty, 0), [cart]);
const canAddMore = useMemo(() => totalItems < settings.maxItemsPerOrder, [totalItems, settings]);
const cartSummary = useMemo(() => { /* builds "🍣 Salmon Nigiri (2x), 🍙 Tuna Roll (1x)" */ }, [cart, menu]);
const menuByCategory = useMemo(() => { /* groups menu items by category */ }, [menu]);
```

### `useRef` — stable references for callbacks

**AppContext.tsx** — [lines 152–157](sushi-dash/src/context/AppContext.tsx#L152-L157):

```tsx
const menuRef = useRef(menu);
menuRef.current = menu;
const settingsRef = useRef(settings);
settingsRef.current = settings;
const ordersRef = useRef(orders);
ordersRef.current = orders;
```

Refs keep the latest data available to `useCallback` without causing re-renders or stale closures.

### `useCallback` — stable function references

**AppContext.tsx** — [lines 171–210](sushi-dash/src/context/AppContext.tsx#L171-L210):

```tsx
const getActiveOrdersForTable = useCallback(
  (tableId: string): Order[] => {
    return ordersRef.current.filter(
      (o) => o.table.id === tableId && o.status !== "delivered" && o.status !== "cancelled"
    );
  }, []
);

const canTablePlaceOrder = useCallback(
  (tableId: string): { allowed: boolean; reason?: string } => {
    const active = getActiveOrdersForTable(tableId);
    if (active.length >= settingsRef.current.maxActiveOrdersPerTable) {
      return { allowed: false, reason: `Maximum ${settingsRef.current.maxActiveOrdersPerTable} active orders...` };
    }
    return { allowed: true };
  }, [getActiveOrdersForTable]
);

const placeOrder = useCallback(async (tableId: string, items: ...) => {
  const order = await placeOrderMutation.mutateAsync({ tableId, items });
  return order;
}, [placeOrderMutation]);
```

---

## ✅ 16. Prisma ORM

**Version:** `prisma@^7.4.0` + `@prisma/client@^7.4.0` + `@prisma/adapter-pg@^7.4.0` — [package.json#L18-L38](sushi-dash/package.json#L18-L38)

### Schema — [server/prisma/schema.prisma](sushi-dash/server/prisma/schema.prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique
  items Item[]
}

model Item {
  id           Int       @id @default(autoincrement())
  name         String
  emoji        String    @db.VarChar(10)
  is_popular   Boolean   @default(false)
  is_available Boolean   @default(true)
  category     Category  @relation(fields: [category_id], references: [id])
  category_id  Int
  order_items  OrderItem[]
}

model Order {
  id        Int         @id @default(autoincrement())
  table     TableConfig @relation(fields: [table_id], references: [id])
  table_id  Int
  status    OrderStatus @default(queued)
  createdAt DateTime    @default(now()) @map("created_at")
  items     OrderItem[]
}

enum OrderStatus { queued  preparing  ready  delivered  cancelled }
```

8 models total: `Category`, `Item`, `TableConfig`, `Password`, `Session`, `Order`, `OrderItem`, `Setting`.

### Client setup — [server/src/db/prisma.ts](sushi-dash/server/src/db/prisma.ts)

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
export default prisma;
```

### Usage in routes — [server/src/routes/orders.ts](sushi-dash/server/src/routes/orders.ts)

```ts
import prisma from "../db/prisma.js";

router.get("/", requireRole("kitchen", "manager"), async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: { include: { item: { include: { category: true } } } }, table: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders.map(formatOrder));
});

router.post("/table/:tableId", requireRole("customer", "manager"), async (req, res) => {
  const order = await prisma.order.create({
    data: {
      table_id: Number(req.params.tableId),
      items: { create: req.body.items.map((i: any) => ({ item_id: i.itemId, quantity: i.quantity })) },
    },
    include: orderInclude,
  });
  res.status(201).json(formatOrder(order));
});
```

### Database commands

```sh
npm run db:push      # Sync Prisma schema → PostgreSQL
npm run db:seed      # Seed 145 menu items, 6 tables, passwords
npm run db:reset     # Drop & recreate all tables + seed
npm run db:generate  # Regenerate Prisma client
```
