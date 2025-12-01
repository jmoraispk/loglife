"""Flask blueprints for application routes."""

from loglife.core.routes.emulator.routes import emulator_bp
from loglife.core.routes.webhook.routes import webhook_bp

__all__ = ["emulator_bp", "webhook_bp"]
