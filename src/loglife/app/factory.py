"""Flask app factory."""

from loglife.app.config import STATIC, TEMPLATES, setup_logging
from loglife.app.db import init_db
from loglife.app.routes import emulator_bp, webhook_bp
from loglife.app.services import start_reminder_service
from flask import Flask


def create_app() -> Flask:
    """Build the Flask app with logging, DB, services, and blueprints."""
    app = Flask(__name__, template_folder=TEMPLATES, static_folder=STATIC)

    setup_logging()

    init_db()

    start_reminder_service()

    if emulator_bp:
        app.register_blueprint(emulator_bp)

    app.register_blueprint(webhook_bp)

    return app
