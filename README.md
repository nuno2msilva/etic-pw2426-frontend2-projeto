# Sushi Dash 🍣

A modern sushi restaurant ordering system built with React, TypeScript, and Tailwind CSS. Features real-time order management, role-based authentication, and a comprehensive admin panel.

## ✨ Features

- **Customer View** — Browse 145+ menu items with search, categories, and responsive layout. Persistent cart banner (always visible, even when empty) prevents layout shifts.
- **Kitchen Dashboard** — Real-time order queue with status workflow (Queued → Preparing → Ready → Delivered)
- **Manager Panel** — Full administrative control:
  - **Order Management** — Cancel active orders, delete completed orders (delivered/cancelled)
  - Table management, menu management, password management, order limit configuration
- **Order Limits** — Configurable max items per order and active orders per table
- **Role-based Auth** — SHA-256 password hashing with session management
- **Responsive Design** — Mobile-first with Tailwind CSS dark mode support
- **Full Test Coverage** — 97 passing tests with Jest

## 📋 Menu

The menu includes **145 items** across 9 categories:
- **Nigiri** (#1-25) - Salmon, Tuna, Yellowtail, Shrimp, Eel, Octopus, and more
- **Rolls** (#26-50) - California, Dragon, Rainbow, Spicy Tuna, and classics
- **Specialty Rolls** (#51-70) - Premium rolls like King Crab, Lobster, Samurai
- **Sashimi** (#71-85) - Fresh cuts of various fish
- **Hot Dishes** (#86-100) - Teriyaki, Katsu, Tempura, Donburi bowls
- **Sides** (#101-115) - Edamame, Gyoza, Salads, Tartare
- **Noodles** (#116-125) - Ramen, Udon, Soba, Yakisoba
- **Drinks** (#126-135) - Tea, Sake, Beer, Ramune
- **Desserts** (#136-145) - Mochi, Ice Cream, Dorayaki

## ⚙️ Order Limits (Defaults)

| Setting | Default | Description |
|---------|---------|-------------|
| Max items per order | 10 | Customers cannot exceed this in a single order |
| Max active orders per table | 2 | Tables must wait for orders to be delivered |

> Managers can change these limits from Manager Panel → Order Limits.

## 🔐 Authentication & Permissions

The app uses role-based authentication with a unified staff login page.

### Staff Login

Visit `/staff` for a unified login page that automatically routes you based on your password:
- Enter **kitchen password** → Redirected to Kitchen Dashboard
- Enter **manager password** → Redirected to Manager Panel

### Default Passwords

| Role | Password | Access |
|------|----------|--------|
| **Kitchen** | `kitchen-master` | Kitchen dashboard, can update order status |
| **Manager** | `manager-admin` | Full access: cancel/delete orders, manage menu/tables/passwords |

### Navigation Shortcuts

- **Kitchen → Manager**: Managers see a "Manager Settings →" link in the Kitchen dashboard header
- **Manager → Kitchen**: "← Kitchen Dashboard" link in the Manager panel header
- **Logout**: Click "Logout" on any staff page to return to `/staff` for quick relogging

> **Tables are now accessed directly via URL** (e.g., `/table/1`, `/table/2`, etc.) — no password required for customers.

### Permission Matrix

| Action | Customer | Kitchen | Manager |
|--------|----------|---------|---------|
| Place orders | ✅ (own table) | ❌ | ✅ |
| Update order status | ❌ | ✅ | ✅ |
| Cancel orders | ❌ | ❌ | ✅ |
| Delete orders | ❌ | ❌ | ✅ |
| View kitchen dashboard | ❌ | ✅ | ✅ |
| Manage menu/tables | ❌ | ❌ | ✅ |

> Managers can update all passwords from the Manager Panel → Security section.

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd sushi-dash

# Install dependencies
make install
# or: npm install

# Start development server
make dev
# or: npm run dev
```

Visit **http://localhost:8080**

## 📦 Available Commands (Makefile)

```sh
make help         # Show all commands
make install      # Install dependencies
make dev          # Start dev server (port 8080)
make build        # Production build
make test         # Run tests
make test-watch   # Run tests in watch mode
make clean        # Remove node_modules and dist
```

## 🛠️ Tech Stack

### Core
- **Vite 7.3** — Lightning-fast build tool with HMR
- **React 18** — UI library
- **TypeScript 5.7** — Type safety
- **React Router 7.3** — Client-side routing

### State & Data
- **React Query (TanStack Query 5.83)** — Data fetching, caching, and synchronization
- **Context API** — Global state (SushiContext + AuthContext)
- **localStorage** — Persistence layer for mock API

### UI & Styling
- **Tailwind CSS 3.4** — Utility-first CSS
- **shadcn/ui** — Accessible component library (Radix UI primitives)
- **Lucide React** — Icon library

### Testing
- **Jest** — Test framework with 97 tests, testing API, authentication, components, data structures, and utilities, either success or fail cases
- **Testing Library** — React component testing
- **ts-jest** — TypeScript support for Jest

### Code Quality
- **ESLint 9.24** — Code linting
- **TypeScript strict mode** — Type checking

## 📂 Project Structure

```
sushi-dash/
├── src/
│   ├── components/
│   │   ├── sushi/        # App-specific components (23 files)
│   │   └── ui/           # shadcn/ui components (40+ files)
│   ├── context/
│   │   ├── AuthContext.tsx      # Authentication & sessions
│   │   └── SushiContext.tsx     # Menu, tables, orders, settings
│   ├── data/
│   │   └── defaultMenu.ts       # Seed data (145 items, 6 tables)
│   ├── hooks/
│   │   ├── useQueries.ts        # React Query hooks
│   │   ├── use-toast.ts         # Toast notifications
│   │   └── use-mobile.tsx       # Responsive breakpoint hook
│   ├── lib/
│   │   ├── api.ts              # Mock REST API (CRUD operations)
│   │   ├── auth.ts             # SHA-256 hashing, sessions
│   │   └── utils.ts            # Tailwind class merger (cn)
│   ├── pages/
│   │   ├── Index.tsx           # Landing page (table selector)
│   │   ├── TablePage.tsx       # Customer ordering page
│   │   ├── KitchenPage.tsx     # Kitchen dashboard
│   │   ├── ManagerPage.tsx     # Admin panel
│   │   └── NotFound.tsx        # 404 page
│   ├── test/
│   │   ├── api.test.ts         # API layer tests (26 tests)
│   │   ├── auth.test.ts        # Auth & permissions (36 tests)
│   │   ├── components.test.tsx # Component rendering (8 tests)
│   │   ├── data.test.ts        # Data structure tests (13 tests)
│   │   ├── utils.test.ts       # Utility function tests (6 tests)
│   │   └── setup.ts            # Test environment setup
│   ├── types/
│   │   └── sushi.ts            # TypeScript types
│   ├── App.tsx                  # Router setup
│   └── main.tsx                 # React entry point
├── jest.config.cjs              # Jest configuration
├── Makefile                     # Quick commands
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## 🧪 Testing

### Run Tests

```sh
make test
# or: npm test
```

### Test Coverage

- **97 tests** across 5 test suites
- **API tests** (27): CRUD operations, validation, error handling, cancel/delete
- **Auth tests** (37): Password hashing, sessions, permissions (success + fail cases)
- **Component tests** (12): Rendering, props, DOM assertions, staff login, cart banner behavior
- **Data tests** (13): Menu structure, table config, settings
- **Utils tests** (6): className merging

### Permission Tests

Comprehensive test coverage for order management permissions:
- ✅ Manager can cancel active orders and delete completed orders (delivered/cancelled)
- ✅ Kitchen CANNOT cancel/delete orders (fail cases)
- ✅ Customer CANNOT access admin functions (fail cases)
- ✅ Unauthenticated users blocked (fail cases)

## 🗺️ Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page (table selector) | No |
| `/table/:id` | Customer ordering page | No (direct URL access) |
| `/staff` | Unified staff login (auto-routes to kitchen/manager) | Password |
| `/kitchen` | Kitchen order dashboard | Yes (kitchen password) |
| `/manager` | Manager administration panel | Yes (manager password) |
| `*` | 404 Not Found page | No |

## 🎨 UI Components

### Custom Components (src/components/sushi/)
- `AppHeader` — Navigation with theme toggle
- `SushiGrid` — Menu item grid with search
- `OrderCard` — Order display with status updates and manager actions
- `OrderQueueList` — Kitchen order queue
- `MenuList` — Collapsible category list
- `TableManager` — Add/remove tables
- `PasswordManager` — Password update forms
- `OrderSettingsManager` — Order limit configuration
- `SEOHead` — Dynamic document head
- And 14 more...

### shadcn/ui Components
40+ accessible components from Radix UI:
Dialog, Collapsible, Button, Input, Alert, Tabs, Card, and more.

## 🔧 Configuration

### Environment Variables
No environment variables needed — mock API uses localStorage.

### Order Settings
Configurable from Manager Panel:
- `maxItemsPerOrder`: 1-100 (default 10)
- `maxActiveOrdersPerTable`: 1-10 (default 2)

### Table Count
Default: 6 tables (configurable via Manager Panel)

## 🚢 Deployment

```sh
npm run build
```

Output: `dist/` folder (ready for static hosting)

### Recommended Hosts
- **Vercel** — Zero-config deployment
- **Netlify** — Drag-and-drop deployment
- **GitHub Pages** — Free static hosting

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with ❤️ for academic purposes** — Demonstrating React, TypeScript, state management, testing, and modern web development practices.
