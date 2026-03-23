.PHONY: help install dev dev-server dev-all build test test-watch test-coverage clean db-check db-push db-seed db-reset lint start

help:
	@echo "Sushi Dash — Makefile Commands"
	@echo "================================"
	@echo ""
	@echo "  Development"
	@echo "  -----------"
	@echo "  make install       Install all dependencies (frontend + server)"
	@echo "  make dev           Start Next.js dev server (frontend)"
	@echo "  make dev-server    Start Express API server (backend)"
	@echo "  make dev-all       Start both frontend + backend concurrently"
	@echo "  make lint          Run ESLint"
	@echo "  make start         Start production server"
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
	@echo "  make db-check      Verify backend can connect to database"
	@echo "  make db-push       Sync Prisma schema to database"
	@echo "  make db-seed       Populate database with default data"
	@echo "  make db-reset      Drop & recreate everything (Prisma push + seed)"
	@echo ""
	@echo "  Cleanup"
	@echo "  -------"
	@echo "  make clean         Remove node_modules and build output"

# ── Dependencies ─────────────────────────────────────────────
install:
	npm install
	cd server && npm install

# ── Development ──────────────────────────────────────────────
dev:
	npm run dev

dev-server:
	$(MAKE) db-check
	cd server && npm run dev

dev-all:
	@echo "Starting backend + frontend..."
	@$(MAKE) db-check
	@if lsof -i :3001 -n -P >/dev/null 2>&1; then \
		echo "Backend already running on :3001"; \
	else \
		echo "Launching backend on :3001..."; \
		cd server && npm run dev & \
	fi
	@echo "Waiting for backend health check..."
	@node -e "const deadline=Date.now()+30000;(async()=>{while(Date.now()<deadline){try{const r=await fetch('http://localhost:3001/api/health');if(r.ok){const j=await r.json();if(j.database==='connected'){console.log('Backend ready (database connected).');return;}}}catch{}await new Promise(res=>setTimeout(res,500));}console.error('Backend failed health check within 30s.');process.exit(1);})();"
	@if lsof -i :5173 -n -P >/dev/null 2>&1; then \
		echo "Frontend already running on :5173 (skipping new instance)."; \
		echo "Open http://localhost:5173"; \
	else \
		npm run dev; \
	fi

# ── Build & Test ─────────────────────────────────────────────
build:
	npm run build

lint:
	npm run lint

start:
	npm start

test:
	npm test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

# ── Database ─────────────────────────────────────────────────
db-check:
	cd server && npm run db:check

db-push:
	cd server && npm run db:push

db-seed:
	cd server && npm run db:seed

db-reset:
	cd server && npm run db:reset

# ── Cleanup ──────────────────────────────────────────────────
clean:
	rm -rf node_modules .next server/node_modules server/dist
