"""Application settings and configuration constants."""

import os

FLASK_ENV = os.getenv("FLASK_ENV", "development")  # development or production

OPENAI_CHAT_MODEL = "gpt-5.1"

DEFAULT_GOAL_EMOJI = "🎯"

STYLE = {
    1: "❌",  # Failure
    2: "⚠️",  # Partial
    3: "✅",  # Success
}

COMMAND_ALIASES = {
    "journal now": "journal prompts",
}

_port = int(os.environ.get("SQLITE_WEB_PORT", 8080))
SQLITE_WEB_URL = (
    ("https://prod.loglife.co/database/" if _port == 8080 else "https://test.loglife.co/database/")
    if FLASK_ENV == "production"
    else "http://127.0.0.1:8080/"
)
