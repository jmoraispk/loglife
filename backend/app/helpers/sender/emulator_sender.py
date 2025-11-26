"""Utilities for sending emulator-bound messages via the log queue."""

from app.helpers.queue import log_queue


def send_emulator_message(message: str) -> None:
    """Push emulator responses to the SSE log queue."""
    log_queue.put(message)

