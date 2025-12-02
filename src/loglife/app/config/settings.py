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

SQLITE_WEB_URL = (
    "http://5.161.234.127:8080/"
    if FLASK_ENV == "production"
    else "http://127.0.0.1:8080/"
)
