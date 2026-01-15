"""Transport adapters for message delivery.

Handles specific protocols like WhatsApp API calls or Emulator JSON broadcasts,
decoupled from the core threading engine.
"""

import json
import logging
import os
from collections.abc import Generator
from functools import lru_cache
from queue import Queue
from threading import Lock
from typing import Any

import requests

from loglife.app.config import WHATSAPP_API_URL, WHATSAPP_CLIENT_TYPE
from loglife.core.whatsapp_business_api.wa_business_api import WhatsAppClient

logger = logging.getLogger(__name__)

# Exception messages
_ERR_WHATSAPP_CONFIG_MISSING = (
    "WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be set "
    "when using WhatsApp Business API"
)


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


@lru_cache(maxsize=1)
def get_whatsapp_business_client() -> WhatsAppClient:
    """Get or initialize the WhatsApp Business API client."""
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

    if not access_token or not phone_number_id:
        raise RuntimeError(_ERR_WHATSAPP_CONFIG_MISSING)

    return WhatsAppClient(
        access_token=access_token,
        phone_number_id=phone_number_id,
    )


def format_phone_for_business_api(number: str) -> str:
    """Format phone number for WhatsApp Business API (remove @c.us suffix if present)."""
    # Remove @c.us suffix if present
    if "@c.us" in number:
        number = number.replace("@c.us", "")
    # Remove any non-digit characters except +
    cleaned = "".join(c for c in number if c.isdigit() or c == "+")
    # Ensure it starts with + (Business API requirement)
    if not cleaned.startswith("+"):
        cleaned = "+" + cleaned
    return cleaned


def send_whatsapp_message(
    number: str, message: str, attachments: dict[str, Any] | None = None
) -> None:
    """Send a message via WhatsApp Web JS client or WhatsApp Business API based on config."""
    client_type = WHATSAPP_CLIENT_TYPE.lower()

    if client_type == "business_api":
        # Use WhatsApp Business API
        try:
            client = get_whatsapp_business_client()
            formatted_number = format_phone_for_business_api(number)

            # Send text message
            client.send_text(to=formatted_number, text=message)

            # Handle attachments (transcript files) if present
            if attachments and "transcript_file" in attachments:
                # Note: Business API doesn't support sending files directly via text messages
                # You would need to upload the file first and then send it as a document
                # For now, we'll log a warning
                logger.warning(
                    "Attachments are not yet fully supported with WhatsApp Business API. "
                    "Transcript file will not be sent."
                )
        except Exception as exc:
            error = f"Error sending WhatsApp Business API message > {exc}"
            logger.exception(error)
            raise RuntimeError(error) from exc
    else:
        # Default: Use WhatsApp Web JS client
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
