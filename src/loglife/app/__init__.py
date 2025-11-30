"""Flask app factory wiring logging, DB, services, and blueprints."""

from .factory import create_app

__all__ = ["create_app"]
