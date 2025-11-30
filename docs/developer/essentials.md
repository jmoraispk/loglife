# Essentials

| Task | Command |
| :--- | :--- |
| **Install** | `uv sync --extra dev` |
| **Docs** | `uv run mkdocs serve` |
| **Backend** | `uv run python -m loglife.main` |
| **Client** | `node whatsapp-client/index.js` |
| **DB Viewer** | `uv run sqlite_web src/loglife/app/db/loglife.db` |
| **Test** | `uv run pytest --cov=src/loglife/app --cov-report=term-missing` |
