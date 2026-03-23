.PHONY: help install dev dev-server dev-all build test test-watch test-coverage clean db-check db-push db-seed db-reset db-generate lint start

help install dev dev-server dev-all build test test-watch test-coverage clean db-check db-push db-seed db-reset db-generate lint start:
	$(MAKE) -C sushi-dash $@
