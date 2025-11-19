"""Flask app factory wiring logging, DB, services, and blueprints."""

from flask import Flask
from app.routes import emulator_bp, webhook_bp
from app.config import setup_logging, TEMPLATES
from app.db import init_db
from app.services import start_reminder_service


def create_app():
    """Builds the Flask app with logging, DB, services, and blueprints."""
    app = Flask(__name__, template_folder=TEMPLATES)

    setup_logging()

    init_db()

    start_reminder_service()

    app.register_blueprint(emulator_bp)

    app.register_blueprint(webhook_bp)

    return app
