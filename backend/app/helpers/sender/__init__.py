from flask import g

from .emulator_sender import send_emulator_message
from .whatsapp_sender import send_whatsapp_message


def send_message(number: str, message: str):
    if g.client_type == "whatsapp":
        send_whatsapp_message(number, message)
    elif g.client_type == "emulator":
        send_emulator_message(message)
