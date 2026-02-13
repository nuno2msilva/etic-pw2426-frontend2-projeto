.PHONY: help install dev dev-server dev-all build test test-watch test-coverage clean db-init db-seed db-reset lint preview

help:
	@echo "Sushi Dash — Makefile Commands"
	@echo "================================"
	@echo ""
	@echo "  Development"
	@echo "  -----------"
	@echo "  make install       Install all dependencies (frontend + server)"
	@echo "  make dev           Start Vite dev server (frontend)"
	@echo "  make dev-server    Start Express API server (backend)"
	@echo "  make dev-all       Start both frontend + backend concurrently"
	@echo "  make lint          Run ESLint"
	@echo "  make preview       Preview production build locally"
	@echo ""
	@echo "  Build & Test"
	@echo "  ------------"
	@echo "  make build         Production build (frontend)"
	@echo "  make test          Run all frontend tests"
	@echo "  make test-watch    Run tests in watch mode"
	@echo "  make test-coverage Run tests with coverage report"
	@echo ""
	@echo "  Database"
	@echo "  --------"
	@echo "  make db-init       Create database + tables (destructive!)"
	@echo "  make db-seed       Populate database with default data"
	@echo "  make db-reset      Drop & recreate everything (init + seed)"
	@echo "  make db-test       Test database connectivity + seed integrity"
	@echo ""
	@echo "  Cleanup"
	@echo "  -------"
	@echo "  make clean         Remove node_modules and dist"

# ── Dependencies ─────────────────────────────────────────────
install:
	npm install
	cd server && npm install

# ── Development ──────────────────────────────────────────────
dev:
	npm run dev

dev-server:
	cd server && npm run dev

dev-all:
	@echo "Starting backend + frontend..."
	cd server && npm run dev & \
	sleep 2 && npm run dev

# ── Build & Test ─────────────────────────────────────────────
build:
	npm run build

lint:
	npm run lint

preview:
	npm run preview

test:
	npm test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

# ── Database ─────────────────────────────────────────────────
db-init:
	cd server && npm run db:init

db-seed:
	cd server && npm run db:seed

db-reset:
	cd server && npm run db:reset

db-test:
	@echo "Testing database connectivity and seed data..."
	@cd server && node -e " \
	  const { Pool } = require('pg'); \
	  require('dotenv').config(); \
	  const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME }); \
	  (async () => { \
	    const tables = await pool.query(\"SELECT tablename FROM pg_tables WHERE schemaname = 'public'\"); \
	    console.log('Tables found:', tables.rows.map(r => r.tablename).join(', ')); \
	    const items = await pool.query('SELECT count(*) FROM menu_items'); \
	    console.log('Menu items:', items.rows[0].count); \
	    const t = await pool.query('SELECT count(*) FROM tables'); \
	    console.log('Tables:', t.rows[0].count); \
	    const s = await pool.query('SELECT count(*) FROM settings'); \
	    console.log('Settings:', s.rows[0].count); \
	    const ok = Number(items.rows[0].count) > 0 && Number(t.rows[0].count) > 0; \
	    console.log(ok ? '✅ Database OK' : '❌ Database empty — run make db-seed'); \
	    await pool.end(); \
	    process.exit(ok ? 0 : 1); \
	  })().catch(e => { console.error('❌ DB connection failed:', e.message); process.exit(1); }); \
	"

# ── Cleanup ──────────────────────────────────────────────────
clean:
	rm -rf node_modules dist server/node_modules server/dist
