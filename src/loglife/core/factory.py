"""Flask app factory."""

from flask import Flask

from loglife.app.config import setup_logging
from loglife.app.db import init_db
from loglife.app.logic.router import route_message
from loglife.app.services import start_reminder_service
from loglife.core.messaging import start_message_worker, start_sender_worker
from loglife.core.routes import emulator_bp, webhook_bp


def create_app() -> Flask:
    """Build the Flask app with logging, DB, services, and blueprints."""
    app = Flask(__name__)

    setup_logging()

    init_db()

    start_reminder_service()
    start_message_worker(route_message)
    start_sender_worker()

    if emulator_bp:
        app.register_blueprint(emulator_bp)

    app.register_blueprint(webhook_bp)

    return app
