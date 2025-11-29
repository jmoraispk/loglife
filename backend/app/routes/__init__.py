"""Flask blueprints for application routes."""

from app.routes.events import events_bp
from app.routes.webhook import webhook_bp

# Try to import emulator_bp, but ignore if it fails (optional component)
try:
    from app.routes.emulator import emulator_bp
except ImportError:
    emulator_bp = None

__all__ = ["emulator_bp", "events_bp", "webhook_bp"]
