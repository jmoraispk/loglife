PY=python3
PIP=pip3

.PHONY: dev simulate test lint fmt migrate health

dev: ## Install deps, run migrations, start simulator
	$(PIP) install -r requirements.txt
	$(PY) -m app.infra.repo_sqlite --migrate
	$(PY) -m app.adapters.simulator

simulate: ## Start simulator only
	$(PY) -m app.adapters.simulator

migrate: ## Run DB migrations
	$(PY) -m app.infra.repo_sqlite --migrate

health: ## Healthcheck (DB + renderer)
	$(PY) -m app.api.handler --check

test: ## Run tests quietly with coverage
	pytest -q --maxfail=1 --disable-warnings

