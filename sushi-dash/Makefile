.PHONY: help install dev build test test-watch clean

help:
	@echo "Sushi Dash - Makefile Commands"
	@echo "================================"
	@echo "make install      - Install dependencies"
	@echo "make dev          - Start development server"
	@echo "make build        - Production build"
	@echo "make test         - Run all tests"
	@echo "make test-watch   - Run tests in watch mode"
	@echo "make clean        - Remove node_modules and dist"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

test:
	npm test

test-watch:
	npm run test:watch

clean:
	rm -rf node_modules dist
