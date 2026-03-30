# Sushi Dash 🍣

A full-stack sushi restaurant ordering system with real-time order management, role-based authentication, and a comprehensive admin panel.

## ✨ Features

- **Customer View** — Browse 145+ menu items with search, categories, and a persistent cart banner. 4-digit shuffled PinPad for table authentication with session persistence and reduced shoulder-surfing risk.
- **Real-Time Table Presence** — Server-Sent Events (SSE) with aggressive polling fallback (3s) for table status badges. Exponential backoff reconnection, 5-minute grace period for accidental tab closes. Explicit table leave signal (`goToTableSelection`) for accurate presence tracking.
- **Session Grace Period** — Customers who accidentally close their tab can restore their session within 5 minutes without re-entering PIN. `beforeunload` handler ensures graceful SSE disconnection.
- **Kitchen Dashboard** — Real-time order queue with status workflow (Queued → Preparing → Ready → Delivered).
- **Manager Panel** — Full operational control: menu CRUD, table & PIN management, order cancel/delete, and order limit configuration.
- **PIN System** — Each table has a 4-digit PIN. Changing a PIN invalidates active sessions. Managers can set or randomize PINs; randomized keypad layout and PIN scrambling reduce repeated-observation/snooping attacks in shared dining areas.
- **Idle Timeout** — Customers inactive for 30 minutes (no new orders) are automatically disconnected. Timer resets on each order placement.
- **Role-based Auth** — JWT via httpOnly cookies for customers and staff; bcrypt-hashed passwords for staff users (kitchen, manager, admin).
- **Responsive Design** — Mobile-first with Tailwind CSS and dark mode support.

## 🏗️ Architecture

```
┌─────────────┐     /api proxy     ┌──────────────┐      ┌──────────────┐
│  Next.js    │ ──────────────── → │  Express.js  │ ── → │ PostgreSQL 15│
│  port 5173  │                    │  port 3001   │      │  port 5432   │
└─────────────┘                    └──────────────┘      └──────────────┘
```

- **Frontend**: React 18, TypeScript, Next.js (App Router + Turbopack), TanStack React Query, Radix UI + shadcn/ui, Tailwind CSS
- **Backend**: Express.js, JWT (httpOnly cookies), PostgreSQL via **Prisma ORM**
- **DevContainer**: Docker Compose with app, db (postgres:15), and Adminer

## 🚀 Quick Start

### Prerequisites

- **Docker** (for DevContainer) or **Node.js 18+** & **PostgreSQL 15**

### With DevContainer (recommended)

1. Open in VS Code → "Reopen in Container"
2. Dependencies install automatically via `postCreateCommand`
3. Initialize and seed the database:
   ```sh
   cd sushi-dash/server && npm run db:reset
   ```
4. Start the backend:
   ```sh
   cd sushi-dash/server && npm run dev
   ```
5. Start the frontend:
   ```sh
   cd sushi-dash && npm run dev
   ```
6. Open **http://localhost:5173**

### Without DevContainer

1. Set up PostgreSQL and create a `sushi_dash` database
2. Create `sushi-dash/server/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:<your-password>@localhost:5432/sushi_dash
   JWT_SECRET=<generate-a-secure-secret>
   ```
3. Install dependencies:
   ```sh
   cd sushi-dash && npm install
   cd server && npm install
   ```
4. Init DB, start backend, start frontend (same as steps 3-6 above)

## ⚡ Quick Setup (Priority Make Commands)

If you want the fastest reliable setup path, run these in order from `sushi-dash/`:

```sh
make install      # 1) install frontend + server dependencies
make db-reset     # 2) create schema + seed data
make dev-all      # 3) run backend and frontend together
```

Then verify quality before/after changes:

```sh
make lint         # static checks
make test         # full Jest suite
make test-verbose # print every test case (useful for demos/grading)
make test-coverage
```

If needed, run services separately:

```sh
make dev-server   # backend only (:3001)
make dev          # frontend only (:5173)
```

## 📦 Available Commands

### Frontend (`sushi-dash/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server with Turbopack (port 5173) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run Jest test suite |
| `npm run lint` | Run ESLint |

### Backend (`sushi-dash/server/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Express with tsx watch |
| `npm run db:check` | Verify API can connect to database |
| `npm run db:push` | Sync Prisma schema to database |
| `npm run db:seed` | Seed menu, tables, settings, and default admin user |
| `npm run db:reset` | Drop & recreate tables + seed |
| `npm run db:generate` | Regenerate Prisma client |

### Makefile (`sushi-dash/`)

```sh
make help           # Show all commands
make install        # Install dependencies
make dev            # Start Next.js dev server
make dev-server     # Start Express API server
make dev-all        # Start backend + frontend concurrently
make build          # Production build
make test           # Run all frontend tests (Jest)
make test-verbose   # Run all tests with every test case printed
make test-watch     # Run tests in watch mode
make test-coverage  # Run tests with coverage report
make db-check       # Verify API can connect to database
make db-push        # Sync Prisma schema to database
make db-seed        # Seed with default data
make db-reset       # Drop & recreate (Prisma push + seed)
make db-generate    # Regenerate Prisma client
make lint           # Run ESLint
make clean          # Remove node_modules and build output
```

## 🔐 Authentication

### Customer Access

Customers select a table and enter its 4-digit PIN via a shuffled PinPad. The randomized keypad order is an anti-snooping measure: it makes repeated screen observation and finger-path memorization less useful to bystanders. Sessions persist until the table's PIN is changed by a manager.

### Staff Login

Click "Staff Login" on the table selector page to open the login modal:
- Enter your **username or email + password**
- Kitchen users are redirected to Kitchen Dashboard
- Manager users are redirected to Manager Panel
- Admin users are redirected to Admin Panel

Default seeded admin credentials:
- Username: **admin**
- Email: **admin@sushidash.dev**
- Password: **Admin@12345**

Credentials are defined in sushi-dash/server/src/db/seed.ts. For production, change/reset this credential immediately after first login.

### Permission Matrix

| Action | Customer | Kitchen | Manager | Admin |
|--------|----------|---------|---------|-------|
| Place orders | ✅  | ✅ | ✅ | ✅ |
| Update order status | ❌ | ✅ | ✅ | ❌ |
| Cancel own queued orders | ✅ | ❌ | ✅ | ❌ |
| Delete orders | ❌ | ❌ | ✅ | ❌ |
| Manage menu/tables/PINs | ❌ | ❌ | ✅ | ❌ |
| Manage users/permissions | ❌ | ❌ | ❌ | ✅ |
| Reset staff passwords | ❌ | ❌ | ❌ | ✅ |
| Change own password | ❌ | ✅ | ✅ | ✅ |

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** — React framework with App Router & Turbopack
- **React 18** + **TypeScript**
- **TanStack React Query** — Server state & caching
- **Server-Sent Events (SSE)** — Real-time table presence, order updates, PIN changes
- **Polling Fallback** — 8-second presence interval for Vercel resilience (exponential backoff + polling endpoint)
- **Radix UI / shadcn/ui** — Accessible component primitives
- **Tailwind CSS** — Utility-first styling
- **Sonner** — Toast notifications
- **Lucide React** — Icons

### Backend
- **Express.js** — REST API with SSE broadcast
- **Server-Sent Events (SSE)** — Real-time pub/sub: presence, orders, menu, PIN changes
- **Prisma ORM** — Type-safe database access
- **PostgreSQL 15** — Relational database
- **JWT** — httpOnly cookie authentication with jti-based session identity
- **Exponential Backoff** — Intelligent SSE reconnection (1s → 2s → 4s... capped at 30s)
- **Idle Timeout** — Automatic disconnection after 30 minutes without orders

### Real-Time Architecture
- **SSE Keep-Alive**: 15 seconds (reduced from 30s for Vercel proxy tolerance)
- **Session Grace Period**: 5 minutes (allows tab reload without re-entering PIN)
- **Presence Polling Fallback**: 8-second interval (optimized for mobile browser resource usage)
- **Staff Session Validation**: 10-second interval (manager/kitchen presence checks)
- **Customer Session Validation**: 5-second interval (table authentication keep-alive)
- **Timeout Configuration**: All intervals defined in `src/lib/timeouts.ts` for easy customization

### Design System

Sushi Dash uses shared utility classes in `src/index.css` to maintain consistent spacing, typography, and layout across desktop and mobile without losing responsive behavior.

#### Page Shell Utilities
Used in all major route layouts (Kitchen, Manager, Admin, Customer Menu):

| Class | Purpose | Mobile | Desktop |
|-------|---------|--------|---------|
| `.page-shell` | Base container (height, overflow, padding) | Full-height minus header (100dvh-4rem) | Full height |
| `.page-shell-tight` | Compact vertical padding | pt-4 pb-3.5 | pt-6 pb-6 |
| `.page-shell-roomy` | Generous vertical padding | pt-6 pb-4 | pt-8 pb-8 |
| `.section-heading` | Subsection titles | text-base | text-lg |

**Applied in**: [KitchenPage](src/views/KitchenPage.tsx), [ManagerPage](src/views/ManagerPage.tsx), [MenuOrderingView](src/components/app/MenuOrderingView.tsx), [TablePage](src/views/TablePage.tsx)

#### Typography Utilities
Unified type scale with consistent breakpoints (mobile → desktop):

| Class | Size | Weight | Use Case |
|-------|------|--------|----------|
| `.type-display` | text-xl sm:text-2xl | bold | Major page headings (table ordering h1) |
| `.type-title` | text-lg sm:text-xl | bold | Section titles, component branding |
| `.type-subtitle` | text-base sm:text-lg | semibold | Card titles, subsection headings |
| `.type-body` | text-sm sm:text-base | regular | Primary content text |
| `.type-body-muted` | text-sm sm:text-base | regular, muted | Secondary/helper text, labels |
| `.type-caption` | text-xs sm:text-sm | regular, muted | Labels, hints, timestamps |

**Applied in**: [AppHeader](src/components/app/AppHeader.tsx) (branding, logout label), [TableSelector](src/components/app/TableSelector.tsx) (messaging, instructions), [CollapsibleSection](src/components/app/CollapsibleSection.tsx) (section titles), [MenuOrderingView](src/components/app/MenuOrderingView.tsx) (table heading), [OrderCard](src/components/app/OrderCard.tsx) (order titles)

#### Component Density Unification
UI primitives made responsive to balance mobile tightness with desktop roominess:

| Component | Property | Mobile | Desktop | File |
|-----------|----------|--------|---------|------|
| **Button** | rounded | lg | lg | [button.tsx](src/components/ui/button.tsx) |
| **Card** | padding (section) | p-4 | sm:p-6 | [card.tsx](src/components/ui/card.tsx) |
| **Card** | padding (item) | p-3.5 | sm:p-4 | [card.tsx](src/components/ui/card.tsx) |
| **Input** | rounded | lg | lg | [input.tsx](src/components/ui/input.tsx) |
| **Dialog** | content padding | p-4 | sm:p-6 | [dialog.tsx](src/components/ui/dialog.tsx) |
| **Dialog** | close button pos | right-3 top-3 | sm:right-4 sm:top-4 | [dialog.tsx](src/components/ui/dialog.tsx) |

#### Adding New Components
When creating new components or pages:

1. **Page shells** use `.page-shell` + `.page-shell-tight` or `.page-shell-roomy` for consistent container behavior
2. **Headings** use `.type-display`, `.type-title`, or `.type-subtitle` based on hierarchy
3. **Body text** use `.type-body` (or `.type-body-muted` for secondary)
4. **Labels/hints** use `.type-caption`
5. **Card/component padding** follow the pattern: `p-X sm:p-Y` (tight mobile, roomy desktop)

This ensures new components automatically align with existing visual rhythm across all breakpoints.

### Testing
- **Jest** + **Testing Library** — 255 tests across 18 suites
- API, auth, components, data integrity, order-status, presence lifecycle, idle timeout, and utility tests

## 📂 Project Structure

```
sushi-dash/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (metadata, providers)
│   ├── providers.tsx           # Client-side provider tree
│   ├── page.tsx                # / → CustomerPage
│   ├── not-found.tsx           # 404 page
│   ├── kitchen/page.tsx        # /kitchen → KitchenPage
│   ├── manager/page.tsx        # /manager → ManagerPage
│   └── table/[tableId]/page.tsx # /table/:id → TablePage
├── src/
│   ├── components/
│   │   ├── app/                # App-level components (18 files)
│   │   └── ui/                 # shadcn/ui primitives (12 files)
│   ├── context/
│   │   ├── AuthContext.tsx      # Auth state & sessions
│   │   └── AppContext.tsx       # Menu, tables, orders, settings
│   ├── data/
│   │   └── seedData.ts          # Seed data (145 items, tables, settings)
│   ├── hooks/
│   │   ├── useApiQueries.ts     # React Query hooks (CRUD, mutations)
│   │   ├── useOrderingFlow.ts   # Shared cart & ordering logic
│   │   └── useServerEvents.ts   # SSE real-time updates
│   ├── lib/
│   │   ├── api.ts               # REST API client
│   │   ├── auth.ts              # Auth utilities & hashing
│   │   ├── config.ts            # Environment config
│   │   ├── order-status.ts      # Shared status constants
│   │   └── utils.ts             # Tailwind class merger
│   ├── views/
│   │   ├── CustomerPage.tsx     # Table select → PinPad → menu → order
│   │   ├── KitchenPage.tsx      # Kitchen order dashboard
│   │   ├── ManagerPage.tsx      # Manager operations panel
│   │   ├── TablePage.tsx        # Direct table ordering (/table/:id)
│   │   └── NotFound.tsx         # 404 page
│   ├── test/                    # Jest test suites (6 files)
│   └── types/
│       └── models.ts            # TypeScript interfaces & constants
├── server/
│   └── src/
│       ├── index.ts             # Express entry point + SSE broadcast
│       ├── db/                  # Prisma client, seed
│       ├── middleware/auth.ts   # JWT middleware
│       └── routes/              # API routes (auth, menu, orders, tables, etc.)
├── next.config.ts               # Next.js config (API proxy rewrites)
├── package.json
└── tailwind.config.ts
```

## 🗺️ Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Table selector + ordering | No (PIN required) |
| `/table/:id` | Direct table ordering | PIN |
| `/kitchen` | Kitchen order dashboard | Kitchen/Manager |
| `/manager` | Manager operations panel | Manager |
| `/admin` | User management panel | Admin |

## 🧪 Testing

### Frontend (Jest)

```sh
cd sushi-dash && npm test            # Run all tests
cd sushi-dash && npm run test:watch  # Watch mode
cd sushi-dash && npm run test:coverage  # With coverage
# or via Makefile:
make test
make test-coverage
```

198 tests across 13 suites:
- **API** (47): Menu, category, table, order, and settings CRUD — success + error cases, fetch mocking
- **Auth** (52): Password hashing, initialization, backend verify, table PIN login, session management (isolation, expiry, categories), role-based access control, order permissions
- **Components** (36): CartSummaryBanner, OrderConfirmation, SEOHead, StaffLoginModal, CollapsibleSection, MenuGrid — rendering, interaction, props
- **Data** (13): Default menu integrity, table config, settings validation
- **Order Status** (8): Badge variant mapping, status labels, emoji prefixes, key completeness
- **Utils** (6): `cn()` class name merging

### Database

```sh
make db-push   # Sync Prisma schema to database
make db-reset  # Drop & recreate tables + seed data
```

Uses Prisma ORM for type-safe schema management and database access.

## 🔒 Security Notes

- `.env` files are excluded via `.gitignore` — never commit secrets
- `JWT_SECRET` is **required** in production (server throws if missing)
- Default dev credentials exist only for local development
- Customer sessions use httpOnly cookies (not accessible via JS)
- PIN changes automatically invalidate all active sessions for that table
- Shuffled PinPad + manager PIN randomization are anti-snooping controls: they reduce PIN disclosure risk from nearby observers and force re-authentication after potential exposure

## 🚢 Deployment

### Local Production Build

```sh
cd sushi-dash && npm run build   # Frontend → .next/
cd server && npm run build       # Backend → dist/
```

Set `JWT_SECRET` and database connection variables in your production environment.

### 🚀 Deploy to Vercel

Sushi Dash can be deployed as two separate Vercel projects: one for the **frontend** (Next.js app) and one for the **backend** (Express API).

#### 1. Set Up a Production Database

You need a PostgreSQL database accessible from the internet. Recommended providers:

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) | 256 MB | Tightly integrated with Vercel |
| [Neon](https://neon.tech) | 512 MB | Serverless Postgres, generous free tier |
| [Supabase](https://supabase.com) | 500 MB | Full Postgres with extras |
| [Railway](https://railway.app) | $5 credit | Easy setup |

After creating a database, copy its connection string (e.g. `postgresql://user:pass@host:5432/dbname`).

#### 2. Deploy the Backend

1. Push your repo to GitHub.

2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.

3. Configure the project:
   - **Root Directory**: `sushi-dash/server`
   - **Framework Preset**: Other
   - **Build Command**: `npx prisma generate && npm run build`
   - **Output Directory**: `dist`

4. Add environment variables:
   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your PostgreSQL connection string |
   | `JWT_SECRET` | A long random secret (e.g. `openssl rand -hex 32`) |

5. Click **Deploy**.

#### 3. Populate the Database

After the backend deploys, populate the database with schema and seed data:

**Option A — From your local machine** (easiest):

```sh
cd sushi-dash/server

# Point to the production database
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Push the Prisma schema to create all tables
npx prisma db push

# Seed default menu items, tables, settings, and admin user
npm run db:seed
```

**Option B — Via Vercel CLI**:

```sh
# Install Vercel CLI if needed
npm i -g vercel

# Link to your backend project
cd sushi-dash/server && vercel link

# Run seed using production env vars
vercel env pull .env.local
source .env.local
npx prisma db push
npm run db:seed
```

> After seeding, your database will contain 145 menu items, default tables with PINs, app settings, and one admin user defined in sushi-dash/server/src/db/seed.ts.

#### 4. Deploy the Frontend

1. Go to [vercel.com/new](https://vercel.com/new) and import the **same repository** again (as a separate project).

2. Configure the project:
   - **Root Directory**: `sushi-dash`
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`

3. Add an environment variable to point the frontend's API calls to your deployed backend:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://your-backend.vercel.app` |

4. Click **Deploy**.

#### 5. Configure CORS

In `server/src/index.ts`, ensure the CORS origin includes your frontend's Vercel URL:

```ts
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
```

Add `CORS_ORIGIN=https://your-frontend.vercel.app` as an environment variable in the backend project.

#### Alternative: Single-Project Deploy with Vercel Serverless

If you prefer a single project, you can convert the Express API into a Vercel serverless function:

1. Create `sushi-dash/api/index.ts` that imports and re-exports the Express app.
2. Add a `vercel.json` in `sushi-dash/`:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "/api" }
     ]
   }
   ```
3. Deploy as a single Vercel project with root directory `sushi-dash`.

> This approach avoids CORS configuration but requires restructuring the Express app as a serverless handler.

## 📄 License

MIT

---

**Built for academic purposes** — ETIC 2024/26 Frontend 2 Project
