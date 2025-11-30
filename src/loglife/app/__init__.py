"""Flask app factory wiring logging, DB, services, and blueprints."""

from flask import Flask

from loglife.app.logic.router import route_message
from loglife.core.factory import create_app as _create_app
from loglife.core.messaging import start_message_worker


def create_app() -> Flask:
    """Create the Flask application and register message handlers."""
    app = _create_app()
    start_message_worker(route_message)
    return app


__all__ = ["create_app"]
