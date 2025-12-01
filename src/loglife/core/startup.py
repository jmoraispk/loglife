"""Application startup and initialization.

Bootstraps the Flask application, database connection, background services,
and message workers. This is the central entry point for wiring the app components.
"""

from flask import Flask

from loglife.app.config import setup_logging
from loglife.app.db import init_db
from loglife.app.logic import route_message
from loglife.app.services import start_reminder_service
from loglife.core.messaging import start_message_worker, start_sender_worker
from loglife.core.routes import emulator_bp, webhook_bp


def create_app() -> Flask:
    """Initialize and configure the Flask application.

    Sets up logging, database, background workers (reminder, sender, router),
    and registers web blueprints (webhook, emulator).

    Returns:
        Configured Flask application instance.

    """
    app = Flask(__name__)

    setup_logging()

    init_db()

    start_reminder_service()
    start_message_worker(route_message)
    start_sender_worker()

    app.register_blueprint(emulator_bp)

    app.register_blueprint(webhook_bp)

    return app
