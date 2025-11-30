"""Flask app factory."""

from flask import Flask

from loglife.app.config import setup_logging
from loglife.app.db import init_db
from loglife.app.services import start_reminder_service
from loglife.core.routes import emulator_bp, webhook_bp


def create_app() -> Flask:
    """Build the Flask app with logging, DB, services, and blueprints."""
    app = Flask(__name__)

    setup_logging()

    init_db()

    start_reminder_service()

    if emulator_bp:
        app.register_blueprint(emulator_bp)

    app.register_blueprint(webhook_bp)

    return app
