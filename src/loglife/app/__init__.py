"""Flask app factory wiring logging, DB, services, and blueprints."""

from flask import Flask

from loglife.app.logic.router import route_message
from loglife.core.messaging import message_bus

from .factory import create_app as _create_app


def create_app() -> Flask:
    """Create the Flask application and register message handlers."""
    app = _create_app()
    message_bus.subscribe(route_message)
    return app


__all__ = ["create_app"]
