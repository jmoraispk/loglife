"""Utilities for sending emulator-bound messages via the log queue."""

import queue

# Queue for streaming log messages to clients via SSE
log_queue = queue.Queue()


def send_emulator_message(message: str) -> None:
    """Push emulator responses to the SSE log queue."""
    log_queue.put(message)
