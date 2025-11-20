"""WhatsApp API integration for sending messages.

This module provides functionality to send messages through the WhatsApp API.
It handles communication with the external WhatsApp service endpoint.
"""

import requests
from app.config import WHATSAPP_API_URL


def send_whatsapp_message(number: str, message: str):
    """Sends a WhatsApp message to the specified phone number.

    Arguments:
    number -- The phone number to send the message to
    message -- The message content to send
    """
    payload = {"number": number, "message": message}
    headers = {"Content-Type": "application/json"}

    requests.post(WHATSAPP_API_URL, json=payload, headers=headers)
