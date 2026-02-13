# Sushi Dash 🍣

A full-stack sushi restaurant ordering system with real-time order management, role-based authentication, and a comprehensive admin panel.

## ✨ Features

- **Customer View** — Browse 145+ menu items with search, categories, and a persistent cart banner. 4-digit shuffled PinPad for table authentication with session persistence.
- **Kitchen Dashboard** — Real-time order queue with status workflow (Queued → Preparing → Ready → Delivered).
- **Manager Panel** — Full administrative control: menu CRUD, table & PIN management, order cancel/delete, password management, order limit configuration.
- **PIN System** — Each table has a 4-digit PIN. Changing a PIN invalidates active sessions. Managers can set or randomize PINs.
- **Role-based Auth** — JWT via httpOnly cookies for customers; SHA-256 password hashing for staff roles.
- **Responsive Design** — Mobile-first with Tailwind CSS and dark mode support.

## 🏗️ Architecture

```
┌─────────────┐     /api proxy     ┌──────────────┐      ┌──────────────┐
│  React+Vite │ ──────────────── → │  Express.js  │ ── → │ PostgreSQL 15│
│  port 8080  │                    │  port 3001   │      │  port 5432   │
└─────────────┘                    └──────────────┘      └──────────────┘
```

- **Frontend**: React 18, TypeScript, Vite, TanStack React Query, Radix UI + shadcn/ui, Tailwind CSS
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
6. Open **http://localhost:8080**

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

## 📦 Available Commands

### Frontend (`sushi-dash/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 8080) |
| `npm run build` | Production build → `dist/` |
| `npm test` | Run Jest test suite |
| `npm run lint` | Run ESLint |

### Backend (`sushi-dash/server/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Express with tsx watch |
| `npm run db:push` | Sync Prisma schema to database |
| `npm run db:seed` | Seed menu, tables, passwords |
| `npm run db:reset` | Drop & recreate tables + seed |
| `npm run db:generate` | Regenerate Prisma client |

### Makefile (`sushi-dash/`)

```sh
make help           # Show all commands
make install        # Install dependencies
make dev            # Start Vite dev server
make dev-server     # Start Express API server
make dev-all        # Start backend + frontend concurrently
make build          # Production build
make test           # Run all frontend tests (Jest)
make test-watch     # Run tests in watch mode
make test-coverage  # Run tests with coverage report
make db-push        # Sync Prisma schema to database
make db-seed        # Seed with default data
make db-reset       # Drop & recreate (Prisma push + seed)
make db-generate    # Regenerate Prisma client
make lint           # Run ESLint
make clean          # Remove node_modules and dist
```

## 🔐 Authentication

### Customer Access

Customers select a table and enter its 4-digit PIN via a shuffled PinPad. Sessions persist until the table's PIN is changed by a manager.

### Staff Login

Visit `/staff` for a unified login page:
- Enter the **kitchen password** → Kitchen Dashboard
- Enter the **manager password** → Manager Panel

> Default credentials are defined in `server/src/db/seed.ts` (for PINs) and `src/lib/auth.ts` (for staff passwords). Change them in production.

### Permission Matrix

| Action | Customer | Kitchen | Manager |
|--------|----------|---------|---------|
| Place orders | ✅ (own table) | ❌ | ✅ |
| Update order status | ❌ | ✅ | ✅ |
| Cancel own queued orders | ✅ (own table) | ❌ | ✅ |
| Delete orders | ❌ | ❌ | ✅ |
| Manage menu/tables/PINs | ❌ | ❌ | ✅ |
| Change passwords | ❌ | ❌ | ✅ |

## 🛠️ Tech Stack

### Frontend
- **Vite** — Build tool with HMR
- **React 18** + **TypeScript**
- **TanStack React Query** — Server state & caching
- **Radix UI / shadcn/ui** — Accessible component primitives
- **Tailwind CSS** — Utility-first styling
- **Sonner** — Toast notifications
- **Lucide React** — Icons

### Backend
- **Express.js** — REST API
- **Prisma ORM** — Type-safe database access
- **PostgreSQL 15** — Relational database
- **JWT** — httpOnly cookie authentication
- **dotenv** — Environment configuration

### Testing
- **Jest** + **Testing Library** — 162 tests across 6 suites
- API, auth, components, data integrity, order-status, and utility tests

## 📂 Project Structure

```
sushi-dash/
├── src/
│   ├── components/
│   │   ├── sushi/        # App-specific components (15 files)
│   │   └── ui/           # shadcn/ui primitives (12 files)
│   ├── context/
│   │   ├── AuthContext.tsx      # Auth state & sessions
│   │   └── SushiContext.tsx     # Menu, tables, orders, settings
│   ├── data/
│   │   └── defaultMenu.ts       # Seed data (145 items)
│   ├── hooks/
│   │   ├── useQueries.ts        # React Query hooks
│   │   └── useSound.ts         # Sound effects hook
│   ├── lib/
│   │   ├── api.ts              # REST API client
│   │   ├── auth.ts             # Auth utilities & hashing
│   │   ├── order-status.ts     # Shared status constants
│   │   └── utils.ts            # Tailwind class merger
│   ├── pages/
│   │   ├── CustomerPage.tsx    # Table select → PinPad → menu → order
│   │   ├── KitchenPage.tsx     # Kitchen order dashboard
│   │   ├── ManagerPage.tsx     # Admin panel
│   │   ├── StaffLoginPage.tsx  # Unified staff login
│   │   └── NotFound.tsx        # 404 page
│   ├── test/                   # Jest test suites
│   └── types/
│       └── sushi.ts            # TypeScript interfaces
├── server/
│   └── src/
│       ├── index.ts            # Express entry point
│       ├── db/                 # Prisma client, seed
│       ├── middleware/auth.ts  # JWT middleware
│       └── routes/             # API routes (auth, menu, orders, tables, etc.)
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

## 🗺️ Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Table selector | No |
| `/table/:id` | Customer ordering (PinPad required) | PIN |
| `/staff` | Unified staff login | Password |
| `/kitchen` | Kitchen order dashboard | Kitchen/Manager |
| `/manager` | Admin panel | Manager |

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

162 tests across 6 suites:
- **API** (47): Menu, category, table, order, and settings CRUD — success + error cases, fetch mocking
- **Auth** (52): Password hashing, initialization, backend verify, table PIN login, session management (isolation, expiry, categories), role-based access control, order permissions
- **Components** (36): CartSummaryBanner, OrderConfirmation, SEOHead, StaffLoginModal, CollapsibleSection, SushiGrid — rendering, interaction, props
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

## 🚢 Deployment

### Local Production Build

The frontend builds to a static `dist/` folder. The backend is a standalone Express server.

```sh
cd sushi-dash && npm run build   # Frontend → dist/
cd server && npm run build       # Backend → dist/
```

Set `JWT_SECRET` and database connection variables in your production environment.

### 🚀 Deploy to Vercel

Sushi Dash can be deployed as two separate Vercel projects: one for the **frontend** (static React app) and one for the **backend** (Express API).

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

# Seed default menu items, tables, and passwords
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

> After seeding, your database will contain 145 menu items, default tables with PINs, and staff passwords defined in `server/src/db/seed.ts`.

#### 4. Deploy the Frontend

1. Go to [vercel.com/new](https://vercel.com/new) and import the **same repository** again (as a separate project).

2. Configure the project:
   - **Root Directory**: `sushi-dash`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. Add an environment variable to point the frontend's API calls to your deployed backend:
   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://your-backend.vercel.app` |

4. Update the Vite proxy or API client to use `VITE_API_URL` in production. In `src/lib/api.ts`, the `BASE_URL` should resolve to the backend URL:
   ```ts
   const BASE_URL = import.meta.env.VITE_API_URL || "";
   ```

5. Click **Deploy**.

#### 5. Configure CORS

In `server/src/index.ts`, ensure the CORS origin includes your frontend's Vercel URL:

```ts
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:8080",
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
       { "source": "/api/(.*)", "destination": "/api" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
3. Deploy as a single Vercel project with root directory `sushi-dash`.

> This approach avoids CORS configuration but requires restructuring the Express app as a serverless handler.

## 📄 License

MIT

---

**Built for academic purposes** — ETIC 2024/26 Frontend 2 Project
