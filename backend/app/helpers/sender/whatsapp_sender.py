"""WhatsApp API integration for sending messages.

This module provides functionality to send messages through the WhatsApp API.
It handles communication with the external WhatsApp service endpoint.
"""

import logging

import requests
from app.config import WHATSAPP_API_URL

logger = logging.getLogger(__name__)


def send_whatsapp_message(number: str, message: str) -> None:
    """Send a WhatsApp message to the specified phone number.

    Args:
        number: The phone number to send the message to
        message: The message content to send

    Raises:
        RuntimeError: If the message fails to send

    """
    payload = {"number": number, "message": message}
    headers = {"Content-Type": "application/json"}

    try:
        requests.post(WHATSAPP_API_URL, json=payload, headers=headers, timeout=30)
    except Exception as e:
        error = f"Error sending WhatsApp message > {e}"
        logger.exception(error)
        raise RuntimeError(error) from e
