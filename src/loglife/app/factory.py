"""Flask app factory."""

from flask import Flask

from loglife.app.config import setup_logging
from loglife.app.db import init_db
from loglife.app.logic.router import RouterError, route_message
from loglife.app.routes import emulator_bp, webhook_bp
from loglife.app.services import start_reminder_service


def create_app() -> Flask:
    """Build the Flask app with logging, DB, services, and blueprints."""
    app = Flask(__name__)

    setup_logging()

    init_db()

    start_reminder_service()

    app.extensions["router"] = route_message
    app.extensions["router_errors"] = (RouterError,)

    if emulator_bp:
        app.register_blueprint(emulator_bp)

    app.register_blueprint(webhook_bp)

    return app
