.PHONY: help install dev dev-server dev-all build test test-watch test-coverage clean db-push db-seed db-reset lint preview

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
	@echo "  make db-push       Sync Prisma schema to database"
	@echo "  make db-seed       Populate database with default data"
	@echo "  make db-reset      Drop & recreate everything (Prisma push + seed)"
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
db-push:
	cd server && npm run db:push

db-seed:
	cd server && npm run db:seed

db-reset:
	cd server && npm run db:reset

# ── Cleanup ──────────────────────────────────────────────────
clean:
	rm -rf node_modules dist server/node_modules server/dist
