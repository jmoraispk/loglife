# Essentials

| Task | Command |
| :--- | :--- |
| **Install** | `uv sync --extra dev` |
| **Docs** | `uv run mkdocs serve` |
| **Backend** | `uv run backend/main.py` |
| **Client** | `node whatsapp-client/index.js` |
| **DB Viewer** | `uv run sqlite_web backend\db\loglife.db` |
| **Test** | `uv run pytest --cov=backend/app --cov-report=term-missing` |
