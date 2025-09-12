UV=uv
PY=$(UV) run python

.PHONY: dev simulate test lint fmt migrate health sync

sync: ## Sync dependencies with uv
	$(UV) sync

dev: ## Install deps, run migrations, start simulator
	$(UV) sync
	$(PY) -m app.infra.repo_sqlite --migrate
	$(PY) -m app.adapters.simulator

simulate: ## Start simulator only
	$(PY) -m app.adapters.simulator

migrate: ## Run DB migrations
	$(PY) -m app.infra.repo_sqlite --migrate

health: ## Healthcheck (DB + renderer)
	$(PY) -m app.api.handler --check

fmt: ## Format with Ruff
	uvx ruff format .

lint: ## Lint with Ruff
	uvx ruff check .

test: ## Run tests quietly (placeholder)
	$(PY) - <<'PY'
print("Tests not yet implemented.")
PY

