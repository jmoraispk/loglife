"""Flask blueprints for application routes."""

from loglife.core.routes.webhook.routes import webhook_bp

# Try to import emulator_bp, but ignore if it fails (optional component)
try:
    from loglife.core.routes.emulator.routes import emulator_bp
except ImportError:  # pragma: no cover - optional component
    emulator_bp = None

__all__ = ["emulator_bp", "webhook_bp"]
