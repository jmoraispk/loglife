"""Webhook blueprint handling inbound WhatsApp messages.

This module defines a Flask blueprint for handling inbound WhatsApp messages.
It processes incoming messages (text, audio, or VCARD) and routes them to the appropriate handlers.
"""

import logging

from flask import Blueprint, g, request
from flask.typing import ResponseReturnValue

from app.db import create_user, get_user_by_phone_number
from app.helpers import error_response, get_timezone_from_number, success_response
from app.logic import process_audio, process_text, process_vard

webhook_bp = Blueprint("webhook", __name__)


@webhook_bp.route("/webhook", methods=["POST"])
def webhook() -> ResponseReturnValue:
    """Handles inbound WhatsApp messages.

    Returns JSON response containing `success`, `message`, and `data`.
    """
    try:
        data: dict = request.get_json()

        sender = data["sender"]
        msg_type = data["msg_type"]
        raw_msg = data["raw_msg"]
        # g is for request-scoped data (global variable)
        g.client_type = data["client_type"]

        user: dict | None = get_user_by_phone_number(sender)
        if not user:
            user_timezone: str = get_timezone_from_number(sender)
            user: dict = create_user(sender, user_timezone)
            logging.info(f"Created new user {user} with timezone {user_timezone}")
        else:
            logging.info(f"Found existing user for sender: {user}")

        extra_data = {}
    
        if msg_type == "chat":
            response_message = process_text(user, raw_msg)
        elif msg_type in ("audio", "ptt"):
            audio_response = process_audio(sender, user, raw_msg)
            if isinstance(audio_response, tuple):
                extra_data["transcript_file"], response_message = audio_response
            else:
                response_message = audio_response
        elif msg_type == "vcard":
            response_message = process_vard(user, raw_msg)
        else:
            response_message = "Can't process this type of message."

        logging.info(
            f"Webhook processed type {msg_type} for {sender}, "
            f"response generated: {response_message}",
        )
        return success_response(message=response_message, **extra_data)
    except Exception as e:
        error = f"Error processing webhook > {e}"
        logging.exception(error)
        return error_response(error)
