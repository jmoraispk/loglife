"""Message sender module for routing messages to different clients."""

from flask import g

from .emulator_sender import send_emulator_message
from .whatsapp_sender import send_whatsapp_message


def send_message(number: str, message: str) -> None:
    """Send a message to the specified number using the appropriate client.

    Args:
        number: The phone number to send the message to
        message: The message content to send

    """
    if g.client_type == "whatsapp":
        send_whatsapp_message(number, message)
    elif g.client_type == "emulator":
        send_emulator_message(message)
