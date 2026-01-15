"""Path configuration constants for backend directories and files."""

import os
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]

# Subdirectories
LOGS = BACKEND_ROOT / "logs"
DATA = BACKEND_ROOT / "data"

# Files
ACCESS_LOG = LOGS / "access.txt"
ERROR_LOG = LOGS / "error.txt"
DATABASE_FILE = BACKEND_ROOT / "app" / "db" / "loglife.db"
SCHEMA_FILE = BACKEND_ROOT / "app" / "db" / "schema.sql"

# Individual assistant files
ASSISTANT_CHECK_IN = DATA / "check_in.json"
ASSISTANT_GOAL_SETUP = DATA / "goal_setup.json"
ASSISTANT_TEMPTATION_SUPPORT = DATA / "temptation_support.json"
ASSISTANT_ONBOARDING = DATA / "onboarding.json"


def get_assistant_file_path(assistant_id: str) -> Path:
    """Get the file path for a given assistant ID based on environment variables."""
    assistant_id_1 = os.getenv("NEXT_PUBLIC_VAPI_ASSISTANT_ID_1", "")
    assistant_id_2 = os.getenv("NEXT_PUBLIC_VAPI_ASSISTANT_ID_2", "")
    assistant_id_3 = os.getenv("NEXT_PUBLIC_VAPI_ASSISTANT_ID_3", "")
    assistant_id_4 = os.getenv("NEXT_PUBLIC_VAPI_ASSISTANT_ID_4", "")

    if assistant_id == assistant_id_1:
        return ASSISTANT_CHECK_IN
    if assistant_id == assistant_id_2:
        return ASSISTANT_GOAL_SETUP
    if assistant_id == assistant_id_3:
        return ASSISTANT_TEMPTATION_SUPPORT
    if assistant_id == assistant_id_4:
        return ASSISTANT_ONBOARDING

    # Fallback to check_in if ID doesn't match (shouldn't happen in production)
    return ASSISTANT_CHECK_IN
