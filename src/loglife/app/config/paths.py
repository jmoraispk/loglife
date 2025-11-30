"""Path configuration constants for backend directories and files."""

from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]

# Subdirectories
LOGS = BACKEND_ROOT / "logs"

# Files
ACCESS_LOG = LOGS / "access.txt"
ERROR_LOG = LOGS / "error.txt"
DATABASE_FILE = BACKEND_ROOT / "app" / "db" / "loglife.db"
SCHEMA_FILE = BACKEND_ROOT / "app" / "db" / "schema.sql"
