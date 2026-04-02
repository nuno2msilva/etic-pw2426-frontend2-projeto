# Sushi Dash 🍣

A full-stack, real-time sushi restaurant ordering system with role-based authentication, live kitchen queue management, and comprehensive admin panel. Built with Next.js 16, React 18, TypeScript, Prisma ORM, and PostgreSQL 15.

**Live Demo**: [https://sushi-dash.vercel.app/](https://sushi-dash.vercel.app/)  
**View Requirements**: Visit [`/about`](https://sushi-dash.vercel.app/about) in the running app for complete traceability of all 18 requirements with code snippets.

---

## 👩‍🏫 Requirements Page

> **This project was made for class assessment purposes.
There were given requirements to which I have tried to uphold to the best of my abilities. These can be viewed in the following link.**

Visit **[`/about`](https://sushi-dash.vercel.app/about)** — the dedicated requirements traceability page built for assessment:

- Every requirement numbered and titled
- Description of *why* it matters in context
- Actual code snippet from the codebase
- File paths showing exactly where it lives

**Quick verification commands** (from `sushi-dash/`):

```bash
make test-verbose   # Prints all 389 test titles — readable, no boilerplate
make build          # Production build — confirm no errors
```

**Default test credentials** (seeded automatically):

| Role | Email | Password |
|---|---|---|
| Kitchen | `kitchen@sushidash.dev` | `Kitchen@12345` |
| Manager | `manager@sushidash.dev` | `Manager@12345` |
| Admin | `admin@sushidash.dev` | `Admin@12345` |

Customer access: select any table on the home page → enter PIN shown on that table's card.

## ✨ Key Features 

### Customer Experience
- **Browse 145+ Sushi Items** — Full menu with categories (Nigiri, Rolls, Sashimi, Hot Dishes, Sides, Noodles, Drinks, Desserts)
- **Table-Based Ordering** — Select table → Enter 4-digit PIN → Order menu items
- **Shuffled PIN Pad** — Anti-snooping keypad layout prevents shoulder surfing
- **Persistent Cart Banner** — Always visible item count and subtotal
- **Real-Time Order Tracking** — Watch order status as kitchen prepares your food
- **Session Grace Period** — Accidentally closed browser? Restore within 5 minutes without re-entering PIN

### Real-Time Architecture
- **Server-Sent Events (SSE)** — Sub-second updates for table presence, order status, menu changes, PIN updates
- **Intelligent Fallback** — Polling-based reconnection if SSE drops (Vercel resilience)
- **15-Second Keep-Alive** — Optimized for mobile browsers and Vercel gateway timeouts
- **Exponential Backoff Reconnection** — 1s → 2s → 4s → ... capped at 30s

### Kitchen Dashboard
- **Live Order Queue** — Queued → Preparing → Ready → Delivered
- **Real-Time Updates** — New orders appear instantly (SSE broadcast)
- **Table-Aware Filtering** — See which table's food is ready

### Manager Panel
- **Menu Management** — Add/edit/delete sushi items with categories and prices
- **Table Settings** — Modify table names and PINs (invalidates active sessions)
- **PIN Management** — Randomize PINs to prevent memorization
- **Order Operations** — Cancel/delete orders, manage queue flow
- **Order Limits** — Configure max items per order, daily spending limits, etc.

### Admin Panel
- **Staff User Management** — Create/edit/suspend user accounts
- **Permission Control** — Assign kitchen, manager, or admin roles
- **System Settings** — Configure restaurant name, logo, working hours
- **Database Administration** — Seed data, reset tables, manage migrations

### Technical Highlights
- **Type Safety** — 100% TypeScript (ES2022), zero implicit `any`
- **389 Passing Tests** — 22 test suites covering auth, orders, presence, analytics, SEO, navigation, context, UI elements
- **CRT TV Effect** — Authentic Samsung CRT animation on all pages (boot sequence, scanlines, flicker)
- **Privacy Analytics** — Umami-powered tracking, GDPR-compliant, first-party proxy
- **Dark Mode** — Licensed theme with light/dark switcher on home page
- **Lighthouse 100 Desktop** — 100 Performance, 95+ Accessibility, 95+ Best Practices, 100 SEO on Vercel production build
- **Zero Render-Blocking CSS** — Inlined at build time, CRT font preloaded, skeleton grid matches real layout (CLS 0.002)

---

## 🏗️ Architecture

### System Design

```
┌─────────────────────────┐                  ┌──────────────────────────┐
│   Customer Browser      │                  │   Staff Browser          │
├─────────────────────────┤                  ├──────────────────────────┤
│ TableSelector (PIN)     │                  │ Kitchen Dashboard        │
│ MenuOrderingView (cart) │                  │ Manager Panel            │
│ OrderProgressModal      │                  │ Admin Console            │
└──────────────┬──────────┘                  └────────────┬─────────────┘
               │ /api proxy                                │
               └────────────────┬─────────────────────────┘
                                │
                    ┌───────────────────────┐
                    │   Next.js Frontend    │
                    │   (Turbopack, 5173)  │
                    └───────────┬───────────┘
                                │ /api/* routes
                    ┌───────────────────────┐
                    │  Express.js API       │
                    │  (JWT auth, RBAC)     │
                    │  (port 3001)          │
                    │  ├─ /auth (customer PIN, staff JWT)
                    │  ├─ /menu (CRUD items)
                    │  ├─ /tables (presence, PIN management)
                    │  ├─ /orders (status, mutations)
                    │  ├─ /settings (restaurant config)
                    │  └─ /sse (real-time broadcast)
                    └───────────┬───────────┘
                                │
                    ┌───────────────────────┐
                    │  PostgreSQL 15        │
                    │  (Prisma ORM)         │
                    │  ├─ users (staff)
                    │  ├─ tables (presence)
                    │  ├─ customer_presence (heartbeats)
                    │  ├─ menu_items (145)
                    │  ├─ orders (queued/ready)
                    │  ├─ order_items (lineitems)
                    │  └─ settings (config)
                    └───────────────────────┘
```

### Data Flow

1. **Customer Flow**: TableSelector → PIN validation → useAuth() stores JWT → MenuOrderingView renders
2. **Order Placement**: addToCart() → cart state update → placeOrder() mutation → Prisma insert → SSE broadcast to kitchen
3. **Kitchen Updates**: Express broadcasts order status change → SSE message to customer, kitchen view updates instantly
4. **Real-Time Presence**: Table presence polled every 3s (merged in-memory SSE + DB heartbeats) → SSE events trigger cache invalidation (not overwrite) → PIN shuffle force-disconnects SSE + clears DB presence → customer leaves → `goToTableSelection()` clears auth → automatic disconnect

---

## 🚀 Quick Start

### With DevContainer (Recommended for VS Code)

1. Open repo in VS Code
2. Click **"Reopen in Container"** (blue button, bottom-right)
3. DevContainer builds with Node, PostgreSQL, and all dependencies
4. In terminal:
   ```bash
   cd sushi-dash
   make install        # Install frontend + server deps
   make db-reset       # Create schema + seed data
   make dev-all        # Start backend + frontend together
   ```
5. Open **http://localhost:5173** in browser

### Manual Setup (Without DevContainer)

#### Prerequisites
- **Node.js 18+** and **npm**
- **PostgreSQL 15** running locally

#### Steps

1. **Clone and install**:
   ```bash
   cd sushi-dash
   npm install
   cd server && npm install && cd ..
   ```

2. **Configure environment**:
   ```bash
   # Create sushi-dash/server/.env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sushi_dash
   JWT_SECRET=your-secret-key-here-min-32-chars
   ```

3. **Initialize database**:
   ```bash
   cd sushi-dash/server
   npm run db:reset    # Creates schema, seeds 145 menu items + 3 staff users
   cd ..
   ```

4. **Start services**:
   ```bash
   # Terminal 1: Backend
   cd server && npm run dev

   # Terminal 2: Frontend
   npm run dev
   ```

5. **Access app**:
   - Customer: http://localhost:5173/ (select table → enter PIN)
   - Kitchen: http://localhost:5173/kitchen (staff login needed)
   - Manager: http://localhost:5173/manager (staff login needed)
   - Admin: http://localhost:5173/admin (admin login needed)

---

## 📋 Make Commands (From `sushi-dash/`)

### Setup & Build

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make install` | Install frontend + server dependencies |
| `make build` | Production build (next build) |
| `make clean` | Remove node_modules and .next/ directory |

### Development

| Command | Description |
|---------|-------------|
| `make dev` | Start Next.js (port 5173) |
| `make dev-server` | Start Express API (port 3001) |
| `make dev-all` | Start backend + frontend concurrently |

### Database

| Command | Description |
|---------|-------------|
| `make db-check` | Verify API connects to database |
| `make db-push` | Sync Prisma schema to PostgreSQL |
| `make db-seed` | Seed menu (145 items), tables, default staff users |
| `make db-reset` | Drop all tables, recreate schema, run seed |
| `make db-generate` | Regenerate Prisma client types |

### Testing & Quality

| Command | Description |
|---------|-------------|
| `make test` | Run Jest test suite (389/389 passing) |
| `make test-watch` | Run tests in watch mode (auto-rerun on file change) |
| `make test-verbose` | Show every single test case (good for grading/demos) |
| `make test-coverage` | Generate coverage report |
| `make lint` | Run ESLint |

---

## 🔐 Authentication

### Customer Access

All customers use **table-based PIN authentication**:

1. **Table Selection** — Click any table number on home page
2. **PIN Entry** — Enter 4-digit code via shuffled PinPad
3. **Session Stored** — JWT token in httpOnly cookie (secure, no XSS)
4. **Presence Broadcast** — Other staff see customer at that table (via SSE)

**Anti-Snooping Features**:
- Shuffled keypad layout changes every app load
- No PIN visible on screen during entry
- 5-minute session grace period if browser crashes
- PIN change by manager invalidates active sessions

### Staff Login

Click **"Staff"** button on table selector to open staff login modal:

**Default Credentials** (from database seed):

| Role | Username/Email | Password | Access |
|------|---|---|---|
| **Kitchen** | `kitchen@sushidash.dev` | `Kitchen@12345` | View orders, mark as ready |
| **Manager** | `manager@sushidash.dev` | `Manager@12345` | Menu/table/PIN CRUD, order deletion |
| **Admin** | `admin@sushidash.dev` | `Admin@12345` | User management, system settings |

⚠️ **IMPORTANT**: Change these credentials immediately after first login in production!

> 📋 **Grading note**: The `/about` page lists all 18 requirements with code snippets. Staff credentials above are seeded by `make db-seed`.

### Permission Matrix

| Feature | Customer | Kitchen | Manager | Admin |
|---------|----------|---------|---------|-------|
| Browse menu | ✅ | ✅ | ✅ | ❌ |
| Place orders | ✅ | ❌ | ✅ | ❌ |
| View own orders | ✅ | ❌ | ❌ | ❌ |
| View all orders | ❌ | ✅ | ✅ | ❌ |
| Update order status | ❌ | ✅ | ✅ | ❌ |
| Delete orders | ❌ | ❌ | ✅ | ❌ |
| Manage menu items | ❌ | ❌ | ✅ | ❌ |
| Manage tables/PINs | ❌ | ❌ | ✅ | ❌ |
| Manage staff users | ❌ | ❌ | ❌ | ✅ |
| Reset staff passwords | ❌ | ❌ | ❌ | ✅ |

---

## 📂 Complete Project Structure

```
sushi-dash/
├── app/                            # Next.js App Router (file-based routing)
│   ├── layout.tsx                  # Root layout (metadata, provider tree)
│   ├── providers.tsx               # Client-side context: Auth, Query, CRT
│   ├── page.tsx                    # / → CustomerPage (table selection)
│   ├── not-found.tsx               # 404 page (catch-all)
│   ├── about/
│   │   └── page.tsx                # /about → Requirements traceability (18 items)
│   ├── api/
│   │   └── v1/                     # Next.js Route Handlers
│   │       ├── auth/session/route.ts
│   │       ├── health/route.ts
│   │       ├── menu/route.ts
│   │       └── web-vitals/route.ts
│   ├── kitchen/
│   │   └── page.tsx                # /kitchen → KitchenPage (order queue)
│   ├── manager/
│   │   └── page.tsx                # /manager → ManagerPage (menu CRUD, settings)
│   ├── admin/
│   │   └── page.tsx                # /admin → AdminPanel (staff mgmt, system config)
│   ├── sitemap.ts                  # Dynamic sitemap generation
│   └── table/
│       └── [tableId]/
│           └── page.tsx            # /table/[id] → CustomerPage (personalized menu)
├── src/
│   ├── components/                 # UI components
│   │   ├── app/                    # Legacy barrel (components moved to features/)
│   │   │   ├── crt.css             # CRT animations (scanlines, boot)
│   │   │   └── index.ts            # Re-exports from features/
│   │   └── ui/                     # shadcn/ui primitives
│   │       ├── alert.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── collapsible.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── sonner.tsx          # Toast notifications
│   │       ├── tabs.tsx
│   │       └── tooltip.tsx
│   ├── context/                    # (Moved to features/shared/context)
│   ├── data/
│   │   └── seedData.ts             # 145 menu items for seeding
│   ├── features/                   # Feature-based folder structure (56 files)
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── AppHeader.tsx
│   │   │   │   ├── CRTScreen.tsx
│   │   │   │   ├── LiveUpdatesClient.tsx
│   │   │   │   ├── NotFound.tsx
│   │   │   │   ├── SEOHead.tsx
│   │   │   │   ├── WebVitalsReporter.tsx
│   │   │   │   ├── WithAppProvider.tsx
│   │   │   │   └── crt.css
│   │   │   ├── context/
│   │   │   │   ├── AuthContext.tsx
│   │   │   │   └── QueryRuntimeProvider.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useApiQueries.ts
│   │   │   │   ├── useServerEvents.ts
│   │   │   │   └── useTablePresence.ts
│   │   │   ├── lib/
│   │   │   │   ├── analytics.ts    # Umami event tracking (29 events)
│   │   │   │   ├── api.ts          # Fetch wrapper (CRUD operations)
│   │   │   │   ├── auth.ts         # Auth helpers (JWT, PIN validation)
│   │   │   │   ├── config.ts       # Feature flags (ENABLE_CRT_EFFECT, etc)
│   │   │   │   ├── notify.ts
│   │   │   │   ├── order-status.ts
│   │   │   │   ├── route-permissions.ts
│   │   │   │   ├── timeouts.ts
│   │   │   │   ├── ui-text.ts
│   │   │   │   └── utils.ts
│   │   │   ├── types/
│   │   │   │   └── models.ts       # TypeScript interfaces (Order, MenuItem, etc)
│   │   │   └── index.ts            # Barrel export (customerEvents, staffEvents, etc)
│   │   ├── customer/
│   │   │   ├── components/
│   │   │   │   ├── CartSummaryBanner.tsx
│   │   │   │   ├── CollapsibleSection.tsx
│   │   │   │   ├── CustomerMenuStep.tsx
│   │   │   │   ├── CustomerPage.tsx
│   │   │   │   ├── DeferredCustomerMenu.tsx
│   │   │   │   ├── MenuGrid.tsx
│   │   │   │   ├── MenuOrderingView.tsx
│   │   │   │   ├── OrderCard.tsx
│   │   │   │   ├── OrderConfirmation.tsx
│   │   │   │   ├── OrderProgressModal.tsx
│   │   │   │   ├── PinPad.tsx
│   │   │   │   ├── TablePage.tsx
│   │   │   │   └── TableSelector.tsx
│   │   │   ├── context/
│   │   │   │   └── AppContext.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useOrderingFlow.ts
│   │   │   └── index.ts
│   │   ├── kitchen/
│   │   │   ├── components/
│   │   │   │   └── KitchenPage.tsx
│   │   │   └── index.ts
│   │   ├── staff/
│   │   │   ├── components/
│   │   │   │   ├── PasswordChangeModal.tsx
│   │   │   │   ├── StaffHeaderMenu.tsx
│   │   │   │   ├── StaffLoginForm.tsx
│   │   │   │   └── StaffLoginModal.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useProtectedStaffRoute.ts
│   │   │   └── index.ts
│   │   └── admin/
│   │       ├── components/
│   │       │   ├── AdminPanel.tsx
│   │       │   ├── ManagerPage.tsx
│   │       │   ├── MenuManager.tsx
│   │       │   ├── OrderSettingsManager.tsx
│   │       │   ├── TableManager.tsx
│   │       │   └── TableQRModal.tsx
│   │       └── index.ts
│   ├── test/                       # Jest test suites (389 tests, 22 files)
│   │   ├── admin-panel-live-updates.test.tsx
│   │   ├── analytics.test.ts
│   │   ├── api.test.ts
│   │   ├── authorization-behavior.test.tsx
│   │   ├── auth-session-enforcement.test.tsx
│   │   ├── auth.test.ts
│   │   ├── components.test.tsx
│   │   ├── context-derived-state.test.ts
│   │   ├── crt-ux-elements.test.tsx
│   │   ├── data.test.ts
│   │   ├── menu-ordering-view.test.tsx
│   │   ├── navigation-routing.test.tsx
│   │   ├── order-status.test.ts
│   │   ├── presence-lifecycle.test.ts
│   │   ├── providers-presence.test.ts
│   │   ├── proxy-access-control.test.ts
│   │   ├── seo-metadata.test.tsx
│   │   ├── server-events-ejection.test.tsx
│   │   ├── server-events-presence-switch.test.ts
│   │   ├── staff-mobile-layout.test.tsx
│   │   ├── table-presence-stability.test.ts
│   │   ├── utils.test.ts
│   │   ├── setup.ts                # Jest configuration
│   │   └── __mocks__/
│   │       └── config.ts
│   ├── types/                      # (Moved to features/shared/types)
│   └── index.css                   # Global styles (Tailwind, CRT keyframes)
├── public/
│   ├── robots.txt
│   ├── fonts/
│   │   └── samsung-crt-tv.ttf      # Custom bitmap font for CRT "AV1" label
│   └── images/
│       └── sushi-logo.svg          # App logo
├── server/                         # Express backend
│   ├── src/
│   │   ├── index.ts                # Server entry (Express setup, SSE)
│   │   ├── events.ts               # SSE broadcast system (pub/sub)
│   │   ├── middleware/
│   │   │   └── auth.ts             # JWT + role validation
│   │   ├── routes/
│   │   │   ├── auth.ts             # /api/auth (customer PIN, staff JWT)
│   │   │   ├── categories.ts        # /api/categories
│   │   │   ├── menu.ts             # /api/menu (GET/POST/PATCH/DELETE items)
│   │   │   ├── orders.ts           # /api/orders (CRUD orders, status updates)
│   │   │   ├── settings.ts         # /api/settings (config)
│   │   │   └── tables.ts           # /api/tables (presence, PIN management)
│   │   └── db/
│   │       ├── check.ts            # DB connection health check
│   │       ├── prisma.ts           # Prisma client singleton
│   │       ├── push.ts             # Schema push (swaps to DIRECT_URL for DDL)
│   │       ├── reset.ts            # DB reset (swaps to DIRECT_URL for DDL)
│   │       └── seed.ts             # Seed script (145 items, 3 staff users, settings)
│   ├── prisma/
│   │   └── schema.prisma           # Database schema (10 models)
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── prisma.config.ts            # Prisma configuration
├── pages/
│   └── api/
│       └── [...path].ts            # Proxy endpoint (forwards /api/* to Express)
├── components.json                 # shadcn/ui config
├── eslint.config.mjs               # ESLint rules
├── jest.config.cjs                 # Jest frontend tests
├── Makefile                        # Build commands (discussed above)
├── next.config.ts                  # Next.js build config (Turbopack enabled)
├── package.json                    # Frontend dependencies
├── package-lock.json               # npm lockfile
├── bun.lockb                       # Bun lockfile
├── postcss.config.js               # PostCSS config (Tailwind processor)
├── tailwind.config.ts              # Tailwind theme (colors, spacing, custom)
├── tsconfig.json                   # TypeScript config (ES2022 target)
├── vercel.json                     # Vercel deployment config
├── CREDENTIALS.md                  # (Git-ignored) Contains seed user passwords
├── REQUIREMENTS.md                 # Project requirements (16 items)
└── README.md                       # This file!
```

---

## 🧪 Testing

### Test Coverage (389/389 Passing)

Run the full suite from `sushi-dash/`:

```bash
make test           # Run all tests once
make test-watch     # Re-run on file change
make test-verbose   # Print every single test (good for grading)
make test-coverage  # Generate coverage report
```

### Test Files (22 Suites)

| File | Tests | Purpose |
|------|-------|---------|
| **crt-ux-elements.test.tsx** | 23 | CRT animations, theme switcher, staff login, table selector, menu grid, form inputs, accessibility |
| **authorization-behavior.test.tsx** | 12 | Role-based access control, customer/kitchen/manager/admin routing |
| **components.test.tsx** | 15 | Component rendering, state management, event handlers |
| **api.test.ts** | 8 | API fetch wrapper, CRUD operations response handling |
| **auth.test.ts** | 8 | JWT validation, PIN hashing, session storage |
| **data.test.ts** | 5 | Menu item data integrity, order item calculations |
| **order-status.test.ts** | 7 | Order state machine (queued → preparing → ready → delivered) |
| **utils.test.ts** | 6 | Helper functions (formatting, calculations) |
| **presence-lifecycle.test.ts** | 51 | Table presence polling, SSE lifecycle, grace period, idle timeout, PIN shuffle disconnect, end-to-end scenarios |
| **server-events-*.test.ts** | 2 files | SSE presence switching, client ejection on PIN change |
| **table-presence-stability.test.ts** | 5 | Grace window logic, last-seen timestamp refresh, false-negative protection |
| **providers-presence.test.ts** | 6 | Header mode resolution, presence table ID selection |
| **proxy-access-control.test.ts** | 6 | Route permission helper (kitchen/manager/admin boundaries) |
| **menu-ordering-view.test.tsx** | 7 | Cart updates, order placement, mobile layout, accessibility |
| **staff-mobile-layout.test.tsx** | 4 | Responsive layout classes for kitchen/manager/admin |
| **auth-session-enforcement.test.tsx** | 8 | Session polling, staff sync, customer ejection on PIN change |
| **admin-panel-live-updates.test.tsx** | 1 | Admin panel polling refresh |
| **analytics.test.ts** | 22 | Umami event helpers: customer, staff, kitchen, admin events, retry logic |
| **seo-metadata.test.tsx** | 14 | SEOHead title/description updates, JSON-LD Restaurant schema validation |
| **navigation-routing.test.tsx** | 20 | next/link rendering, useRouter/usePathname/useParams/useSearchParams, AppHeader nav, dark mode toggle |
| **context-derived-state.test.ts** | 34 | Query key structure, context hook guards, useMemo derived values, useCallback order helpers |

### Example Test: CRT Animation Verification

```typescript
it('wraps everything in a CRT container when you flip the switch on', () => {
  const { container } = render(
    <CRTScreen enabled={true}>
      <div>Content</div>
    </CRTScreen>
  );

  const crt = container.querySelector('.crt');
  expect(crt).toBeInTheDocument();
  
  const crtScreen = container.querySelector('.crt-screen');
  expect(crtScreen).toHaveClass('crt-screen');  // Animation applied
});
```

---

## 🎬 CRT Effect

### What It Is

The **Cathode Ray Tube (CRT) visual effect** simulates an authentic 1980s Samsung CRT television booting up. Enabled on all pages by default.

### Visual Elements

1. **Boot Sequence** (4 seconds on page load)
   - Screen appears compressed/squished
   - Brightness fades from 30% to full
   - Vertical scan lines "unsqueeze" as TV powers on
   - After 4s, content fully visible

2. **Rolling Scanline** (continuous, 8-second cycle)
   - Horizontal bright band moves top → bottom
   - Creates refresh effect like old CRT monitors
   - Repeats infinitely throughout session

3. **Flickering** (0.12s intervals)
   - Subtle opacity variations in rolling band
   - Mimics vertical sync jitter of old displays

4. **"AV1" Label** (5 seconds)
   - Green text in Samsung CRT TV font
   - Appears during boot sequence
   - Fades out after power-on completes

### Configuration

In `src/features/shared/lib/config.ts`:

```typescript
export const ENABLE_CRT_EFFECT = true;  // Set to false to disable globally
```

When disabled, CRT wrapper is skipped entirely, removing all animations.

### CSS Details

All animations defined in `src/index.css`:

```css
@keyframes crt-scanline-roll {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

@keyframes crt-band-flicker {
  0%, 100% { opacity: 1; }
  25%      { opacity: 0.75; }  // Subtle jitter
  50%      { opacity: 0.85; }
  75%      { opacity: 0.78; }
}

@keyframes crt-turn-on {
  0% {
    transform: scale(1, 0.8);
    filter: brightness(30);
    opacity: 1;
  }
  11% {
    filter: contrast(0) brightness(0);
    opacity: 0;
  }
  100% {
    transform: scale(1, 1);
    filter: brightness(1.2) saturate(1.3);
    opacity: 1;
  }
}
```

Applied via `CRTScreen` component:

```tsx
// app/providers.tsx
{ENABLE_CRT_EFFECT ? (
  <CRTScreen enabled>
    <div className="h-dvh flex flex-col overflow-hidden">
      {useLightHeader ? <LightHeader /> : <AppHeader />}
      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </div>
  </CRTScreen>
) : (
  <div className="h-dvh flex flex-col overflow-hidden">
    {useLightHeader ? <LightHeader /> : <AppHeader />}
    <div className="flex-1 min-h-0 overflow-auto">{children}</div>
  </div>
)}
```

---

## 📊 Requirements Traceability

**All 18 project requirements are fully implemented.** Visit `/about` in the running app for:
- Code snippets demonstrating each requirement
- File paths showing where each is implemented
- Live links to Vercel deployment

### Summary

1. ✅ **Next.js 16+ (App Router & SSR)**
2. ✅ **TypeScript (ES2022 Target)**
3. ✅ **React Hooks (useState, useEffect, Custom)**
4. ✅ **Tailwind CSS (Responsive Design)**
5. ✅ **Authentication & Authorization (JWT + RBAC)**
6. ✅ **SEO & Metadata (Open Graph, JSON-LD)**
7. ✅ **API CRUD Operations (REST with Fetch)**
8. ✅ **Navigation (Next.js Router & Dynamic Routes)**
9. ✅ **Responsive Design (Mobile-First Tailwind)**
10. ✅ **Vercel Deployment (Serverless, CI/CD)**
11. ✅ **Unit Testing (Jest + React Testing Library)** — 389/389 passing
12. ✅ **Context API (AuthContext, AppContext)**
13. ✅ **Animations & Transitions (CRT Effect + Dialog)**
14. ✅ **React Query (@tanstack/react-query)**
15. ✅ **useMemo, useCallback & useRef (Optimization)**
16. ✅ **Prisma ORM & PostgreSQL**
17. ✅ **Lighthouse Performance Verification**
18. ✅ **Analytics (Umami — Privacy-First Event Tracking)**

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16.1.6 | React framework, App Router, SSR, Turbopack |
| **React** | 18.3.1 | UI library, hooks, context |
| **TypeScript** | 5.8.3 | Type safety (ES2022 target, zero implicit `any`) |
| **Tailwind CSS** | 3.4.17 | Utility-first styling, dark mode, responsive |
| **React Query** | 5.83.0 | Server state, caching, mutations, deduping |
| **Umami Analytics** | Latest | Privacy-focused tracking, GDPR-compliant, first-party proxy |
| **Radix UI** / **shadcn/ui** | Latest | Accessible component primitives (dialog, button, tabs, etc) |
| **Sonner** | 1.7.4 | Toast notifications |
| **Lucide React** | 0.462.0 | Icon library |
| **Jest** | 30.2.0 | Unit testing framework |
| **Testing Library** | 16.3.2 | Component testing (render, screen, fireEvent) |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Express.js** | 4.21.2 | REST API, SSE, route handlers |
| **Prisma ORM** | 7.4.0 | Type-safe database access, migrations |
| **PostgreSQL** | 15 | Relational database (10 models: users, tables, orders, menu, etc) |
| **JWT** | 9.0.2 | Stateless auth tokens (httpOnly cookies) |
| **bcryptjs** | 3.0.2 | Password hashing for staff users |
| **Cookie Parser** | 1.4.7 | httpOnly cookie parsing |
| **dotenv** | 16.4.7 | Environment variable management |

### DevOps & Deployment

| Tool | Purpose |
|---|---|
| **Vercel** | Serverless deployment, auto-scaling, CDN, preview environments |
| **Docker** | DevContainer for consistent local development |
| **Docker Compose** | Multi-container setup (app, PostgreSQL, Adminer) |
| **GitHub** | Version control, CI/CD integration with Vercel |

---

## 🌍 Deployment (Vercel)

This app is automatically deployed on every push to `main`:

**Live URL**: [https://sushi-dash.vercel.app/](https://sushi-dash.vercel.app/)

### Environment Variables (Set in Vercel Dashboard)

```env
# Database
DATABASE_URL=postgresql://...  # PostgreSQL connection string

# Authentication
JWT_SECRET=<32+ char random key>  # Signing key for JWT tokens

# Analytics
NEXT_PUBLIC_UMAMI_ID=<tracking-id>        # Umami website ID (from your Umami dashboard)
NEXT_PUBLIC_UMAMI_ENDPOINT=<endpoint>     # Optional: self-hosted Umami URL (defaults to https://cloud.umami.is)

# Feature Flags
NEXT_PUBLIC_ENABLE_WEB_VITALS=false  # Disable Core Web Vitals reporter in prod
```

### Build & Deploy Process

1. Push to `main` → GitHub webhook triggers Vercel
2. Vercel runs: `prisma generate && npm run build`
3. Installs: `npm install && cd server && npm install`
4. Tests: `npm test` (389/389 passing)
5. Deploys: **11 static routes** + **API routes** to Vercel Edge Network
6. Preview: Automatic preview URL created for pull requests

---

## 📱 Lighthouse Performance

Run audits on the live app:

### Chrome DevTools (Local/Vercel)
1. Open https://sushi-dash.vercel.app/ in Chrome
2. Press **F12** → **Lighthouse** tab
3. Select **Mobile** or **Desktop** → **Analyze**
4. Wait 60-90 seconds for results

### PageSpeed Insights
https://pagespeed.web.dev/?url=https://sushi-dash.vercel.app/

### CLI
```bash
npm install -g lighthouse
lighthouse https://sushi-dash.vercel.app/ --view
```

### Expected Scores (Vercel production, Desktop)
- **Performance**: 100
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 100

### Optimizations Applied
✅ Turbopack compilation (removed 26 KiB legacy polyfills)  
✅ Dynamic imports (AppHeader, Sonner, LiveUpdatesClient, QueryRuntimeProvider)  
✅ Home route deferred menu (menu loads only after table selection)  
✅ React Query caching (5-minute staleTime, 30-second refetch)  
✅ CSS minimal (Tailwind utilities only, no bloat)  
✅ Tree-shaking (unused code excluded from bundle)  

---

## 🤝 Contributing

### Local Development Workflow

1. **Start DevContainer** (VS Code) or run `make install`
2. **Create feature branch**: `git checkout -b feature/my-feature`
3. **Make changes** — Always run tests before pushing:
   ```bash
   make test         # Verify all 382 tests pass
   make lint         # Check code style
   make build        # Verify production build
   ```
4. **Commit with message**: `git commit -m "feat: add dark mode to menu"`
5. **Push to GitHub**: `git push origin feature/my-feature`
6. **Create Pull Request** → Vercel auto-creates preview environment

### Code Standards

- **TypeScript**: No `any` types; use proper interfaces
- **Tests**: Add tests for new features (aim for 2+ test cases per feature)
- **Formatting**: ESLint auto-formats on save (`make lint`)
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc)

---

## 📄 License

Proprietary — Part of ETIC Algarve Frontend 2 course project (PW2426)

---

## 📞 Support

For issues, questions, or bugs:

1. Check **[/about](/about)** page for detailed implementation docs
2. Review **Makefile** for all available commands
3. Check **DevContainer setup** if environment issues
4. Run `make test-verbose` for detailed test output

**Demo Accounts** (seeded automatically):

**Customer**: 
- Table 1 → PIN: 1234 (check CREDENTIALS.md after `npm run db:seed`)

**Staff**:
- Kitchen: kitchen@sushidash.dev / Kitchen@12345
- Manager: manager@sushidash.dev / Manager@12345
- Admin: admin@sushidash.dev / Admin@12345

---

**Built with ❤️ for ETIC Algarve Frontend 2 Course**

**Next.js 16 + React 18 + TypeScript + Tailwind + PostgreSQL**
