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

DEFAULT_SQLITE_WEB_PORT = 8081
_port = int(os.environ.get("SQLITE_WEB_PORT", str(DEFAULT_SQLITE_WEB_PORT)))
SQLITE_WEB_URL = (
    (
        "https://prod.loglife.co/database/"
        if _port == DEFAULT_SQLITE_WEB_PORT
        else "https://test.loglife.co/database/"
    )
    if FLASK_ENV == "production"
    else f"http://127.0.0.1:{DEFAULT_SQLITE_WEB_PORT}/"
)
