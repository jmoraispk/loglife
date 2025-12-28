"""Core routes package."""

from .emulator import emulator_bp
from .voice import voice_bp
from .webhook import webhook_bp

__all__ = ["emulator_bp", "voice_bp", "webhook_bp"]
