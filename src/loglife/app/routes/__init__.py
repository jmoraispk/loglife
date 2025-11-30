"""Flask blueprints for application routes."""

from loglife.app.routes.webhook import webhook_bp

# Try to import emulator_bp, but ignore if it fails (optional component)
try:
    from loglife.app.routes.emulator import emulator_bp
except ImportError:
    emulator_bp = None

__all__ = ["emulator_bp", "webhook_bp"]
