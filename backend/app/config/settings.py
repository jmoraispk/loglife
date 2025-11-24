"""Application settings and configuration constants."""

FLASK_ENV = "development"  # development or production

OPENAI_CHAT_MODEL = "gpt-5.1"

OPENAI_SUMMARIZATION_SYSTEM_PROMPT = "You are a helpful assistant."

DEFAULT_GOAL_EMOJI = "🎯"

STYLE = {
    1: "❌",  # Failure
    2: "⚠️",  # Partial
    3: "✅",  # Success
}

COMMAND_ALIASES = {
    "add habit": "add goal"
}