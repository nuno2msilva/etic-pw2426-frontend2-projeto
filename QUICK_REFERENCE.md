# Sushi Dash — Quick Reference Guide

## 🚀 Getting Started

```bash
cd sushi-dash
make install    # Install dependencies
make dev        # Start dev server (localhost:8080)
make test       # Run all tests
make build      # Production build
```

## 🔑 Default Access

| Area | URL | Password |
|------|-----|----------|
| Customer | `/table/1` to `/table/6` | None (direct access) |
| Kitchen | `/kitchen` | `kitchen-master` |
| Manager | `/manager` | `manager-admin` |

## 📂 Key Files Reference

### Core Application
- `src/main.tsx` — Entry point, React Query provider
- `src/App.tsx` — Router configuration
- `src/index.html` — SEO meta tags, JSON-LD structured data

### Pages
- `src/pages/Index.tsx` — Landing page (table selector)
- `src/pages/TablePage.tsx` — Customer ordering (full-width search on mobile)
- `src/pages/KitchenPage.tsx` — Kitchen dashboard (can only update status)
- `src/pages/ManagerPage.tsx` — Admin panel (can cancel/delete orders)
- `src/pages/NotFound.tsx` — 404 page

### State Management
- `src/context/SushiContext.tsx` — Menu, tables, orders, settings (React Query)
- `src/context/AuthContext.tsx` — Authentication, sessions, roles

### Data Layer
- `src/lib/api.ts` — Mock REST API (CRUD operations, localStorage)
- `src/hooks/useQueries.ts` — React Query hooks
- `src/data/defaultMenu.ts` — Seed data (145 items, 6 tables)

### Authentication
- `src/lib/auth.ts` — SHA-256 hashing, session management, permissions

### UI Components
- `src/components/sushi/` — 23 custom components
- `src/components/ui/` — 40+ shadcn/ui components

### Testing
- `src/test/api.test.ts` — 26 tests (CRUD, validation)
- `src/test/auth.test.ts` — 36 tests (hashing, sessions, permissions)
- `src/test/components.test.tsx` — 8 tests (rendering)
- `src/test/data.test.ts` — 13 tests (data structure)
- `src/test/utils.test.ts` — 6 tests (utilities)
- `src/test/setup.ts` — Test environment (polyfills)

## 🎨 UI Component Map

### Customer Flow
```
Index → TableSelector
  ↓
TablePage → CategoryTabs → SushiGrid → QuantityPickerModal
  ↓
CartSummaryBanner → OrderConfirmation
```

### Kitchen Flow
```
KitchenPage → LoginModal
  ↓
OrderQueueList → OrderCard (status update only)

If logged as Manager:
  - Active Orders → OrderCard (with status update + cancel)
  - Delivered Orders → OrderCard (with delete)
```

### Manager Flow
```
ManagerPage → LoginModal
  ↓
Restaurant Settings (Collapsible sections):
  - Order Settings (OrderSettingsManager)
  - Table Management (TableManager)
  - Password Management (PasswordManager)
  - Menu Management (AddMenuItemForm + MenuList)
  
Note: For order management, use Kitchen page with manager credentials
```

## 🔧 Configuration

### Order Limits (Manager Panel)
```typescript
{
  maxItemsPerOrder: 10,        // 1-100
  maxActiveOrdersPerTable: 2   // 1-10
}
```

### React Query Settings
```typescript
{
  menu: { staleTime: 5min },
  tables: { staleTime: 5min },
  orders: { refetchInterval: 3s }, // Kitchen real-time
  settings: { staleTime: 10min }
}
```

### Table Count
- Default: 6 tables
- Manager can add/remove via Manager Panel

## 🧪 Testing Commands

```bash
make test              # Run all 89 tests
make test-watch        # Watch mode
npm test -- auth       # Run specific test file
npm test -- --coverage # Coverage report
```

## 📊 Performance Optimizations Applied

### SushiContext
- ✅ `useMemo` for categories, context value
- ✅ `useCallback` for all action handlers
- ✅ `useRef` for stable callback references

### Pages
- ✅ `useMemo` for filtered/sorted data
- ✅ `useCallback` for event handlers
- ✅ `useRef` for search input focus

### React Query
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Cache invalidation after mutations

## 🐛 Known Non-Issues

These warnings are expected and don't affect functionality:

1. **Fast refresh warning** (Context files)
   - Happens when contexts export both components and hooks
   - Not an error, just a Hot Reload limitation

2. **@tailwind unknown** (CSS)
   - CSS linter doesn't recognize Tailwind directives
   - Tailwind processes these correctly at build time

3. **Unused @ts-expect-error** (Test setup)
   - Minor TypeScript strict mode issue
   - Test still passes correctly

## 📦 Production Build

```bash
make build

Output:
- dist/index.html (4.58 kB)
- dist/assets/index-*.css (64 kB → 11 kB gzipped)
- dist/assets/index-*.js (395 kB → 124 kB gzipped)
```

## 🚢 Deployment Ready

Deploy to:
- **Vercel**: `vercel deploy`
- **Netlify**: Drag `dist/` folder
- **GitHub Pages**: `gh-pages` branch from `dist/`

## 📚 Documentation Files

- `README.md` — Complete project documentation
- `IMPLEMENTATION_SUMMARY.md` — Detailed changelog
- `PROJECT_REVIEW_CHECKLIST.md` — Requirements review
- `Makefile` — Quick commands
- JSDoc headers in every source file

## ✅ Final Checklist

- [x] All 89 tests passing
- [x] Production build succeeds
- [x] No blocking errors
- [x] All requirements met (15/15)
- [x] Fully documented
- [x] Optimized with useMemo/useCallback/useRef
- [x] Mobile-responsive (full-width search)
- [x] Permission system working (Manager can cancel/delete, Kitchen cannot)
- [x] Jest testing framework configured
- [x] Makefile for quick commands

**Project Status: COMPLETE AND PRODUCTION-READY** ✅
