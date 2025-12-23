"""Transport adapters for message delivery.

Handles specific protocols like WhatsApp API calls or Emulator JSON broadcasts,
decoupled from the core threading engine.
"""

import json
import logging
from collections.abc import Generator
from queue import Queue
from threading import Lock
from typing import Any

import requests

from loglife.app.config import WHATSAPP_API_URL

logger = logging.getLogger(__name__)


# --- Log Broadcaster ---


class LogBroadcaster:
    """Broadcasts logs to multiple listeners (SSE clients)."""

    def __init__(self) -> None:
        """Initialize the log broadcaster."""
        self._listeners: set[Queue[str]] = set()
        self._lock = Lock()

    def publish(self, message: str) -> None:
        """Send a message to all active listeners."""
        with self._lock:
            for q in self._listeners:
                q.put(message)

    def listen(self) -> Generator[str, None, None]:
        """Yield messages for a single listener."""
        q: Queue[str] = Queue()
        with self._lock:
            self._listeners.add(q)
        try:
            while True:
                msg = q.get()
                yield msg
        finally:
            with self._lock:
                if q in self._listeners:
                    self._listeners.remove(q)


# Global instance for SSE streams
log_broadcaster = LogBroadcaster()


# --- Transport Functions ---


def send_emulator_message(message: str, attachments: dict[str, Any] | None = None) -> None:
    """Send a message to the web emulator via SSE."""
    logger.info("Sending emulator message: %s", message)

    if attachments and "transcript_file" in attachments:
        try:
            data = json.dumps({"text": message, "transcript_file": attachments["transcript_file"]})
            log_broadcaster.publish(data)
        except Exception:
            logger.exception("Failed to serialize emulator message")
            log_broadcaster.publish(message)
    else:
        log_broadcaster.publish(message)


def send_whatsapp_message(
    number: str, message: str, attachments: dict[str, Any] | None = None
) -> None:
    """Send a message to the WhatsApp API."""
    payload = {"number": number, "message": message}
    if attachments:
        payload["attachments"] = attachments

    headers = {"Content-Type": "application/json"}
    try:
        requests.post(WHATSAPP_API_URL, json=payload, headers=headers, timeout=30)
    except Exception as exc:
        error = f"Error sending WhatsApp message > {exc}"
        logger.exception(error)
        raise RuntimeError(error) from exc
