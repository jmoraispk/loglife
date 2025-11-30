"""Service for sending messages to clients (WhatsApp, Emulator, etc.)."""

import logging
import queue

import requests
from loglife.app.config import WHATSAPP_API_URL
from flask import g

logger = logging.getLogger(__name__)

# Queue for streaming log messages to clients via SSE
log_queue = queue.Queue()


def _send_emulator_message(message: str) -> None:
    """Push emulator responses to the SSE log queue.

    Arguments:
        message: The message content to send to the emulator.

    """
    log_queue.put(message)


def _send_whatsapp_message(number: str, message: str) -> None:
    """Send a WhatsApp message to the specified phone number.

    Arguments:
        number: The phone number to send the message to.
        message: The message content to send.

    Raises:
        RuntimeError: If the message fails to send.

    """
    payload = {"number": number, "message": message}
    headers = {"Content-Type": "application/json"}

    try:
        requests.post(WHATSAPP_API_URL, json=payload, headers=headers, timeout=30)
    except Exception as e:
        error = f"Error sending WhatsApp message > {e}"
        logger.exception(error)
        raise RuntimeError(error) from e


def send_message(number: str, message: str) -> None:
    """Send a message to the specified number using the appropriate client.

    Determines the client type (WhatsApp or Emulator) from the global request
    context `g` and routes the message accordingly.

    Arguments:
        number: The phone number to send the message to.
        message: The message content to send.

    """
    if getattr(g, "client_type", None) == "whatsapp":
        _send_whatsapp_message(number, message)
    elif getattr(g, "client_type", None) == "emulator":
        _send_emulator_message(message)
    else:
        # Fallback or default behavior if client_type is missing/unknown
        # For now, we might want to log a warning or default to whatsapp if safe
        logger.warning(
            "Unknown or missing client_type in g context: %s", getattr(g, "client_type", "None")
        )
