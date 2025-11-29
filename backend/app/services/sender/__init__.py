"""Sender service package."""

from app.services.sender.service import log_queue, send_message

__all__ = ["log_queue", "send_message"]

