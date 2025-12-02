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
