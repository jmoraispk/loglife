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

DEFAULT_DATABASE_PORT = 8081 if FLASK_ENV == "production" else 8082
DATABASE_PORT = int(os.environ.get("SQLITE_WEB_PORT", str(DEFAULT_DATABASE_PORT)))

EMULATOR_BASE_URL_PREFIX = os.getenv("EMULATOR_BASE", "test")

EMULATOR_BASE_URL = f"https://{EMULATOR_BASE_URL_PREFIX}.loglife.co"
EMULATOR_LOCAL_URL = "http://127.0.0.1"

EMULATOR_SQLITE_WEB_URL = (
    f"{EMULATOR_BASE_URL}/database/"
    if os.getenv("DEPLOYMENT", "local") == "local"
    else f"{EMULATOR_LOCAL_URL}:{DATABASE_PORT}/"
)

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

# WhatsApp client type: "web" for WhatsApp Web JS client, "business_api" for WhatsApp Business API
WHATSAPP_CLIENT_TYPE = os.getenv("WHATSAPP_CLIENT_TYPE", "web")