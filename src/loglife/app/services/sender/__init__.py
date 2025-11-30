"""Sender service package."""

from loglife.app.services.sender.service import log_queue, send_message

__all__ = ["log_queue", "send_message"]
