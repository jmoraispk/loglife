"""Path configuration constants for backend directories and files."""

from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]

# Subdirectories
TEMPLATES = BACKEND_ROOT / "templates"  # "/" is path joining operator for Path Objects
LOGS = BACKEND_ROOT / "logs"
DATABASE = BACKEND_ROOT / "db"

# files
ACCESS_LOG = LOGS / "access.txt"
ERROR_LOG = LOGS / "error.txt"
DATABASE_FILE = DATABASE / "life_bot.db"
SCHEMA_FILE = DATABASE / "schema.sql"
