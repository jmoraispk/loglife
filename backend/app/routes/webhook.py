"""Webhook blueprint handling inbound WhatsApp messages.

This module defines a Flask blueprint for handling inbound WhatsApp messages.
It processes incoming messages (text, audio, or VCARD) and routes them to the appropriate handlers.
"""

from flask import Blueprint, request
from flask.typing import ResponseReturnValue
from app.logic import process_vard, process_audio, process_text
from app.db import get_user_by_phone_number, create_user
from app.helpers import get_timezone_from_number, success_response
import logging

webhook_bp = Blueprint("webhook", __name__)


@webhook_bp.route("/webhook", methods=["POST"])
def webhook() -> ResponseReturnValue:
    """Handles inbound WhatsApp messages.

    Returns JSON response containing `success`, `message`, and `data`.
    """
    data: dict | None = request.get_json()

    logging.debug(f"Incoming webhook payload: {data}")

    sender: str = data["sender"]
    msg_type: str = data["msg_type"]
    raw_msg: str = data["raw_msg"]

    user: dict | None = get_user_by_phone_number(sender)

    if not user:
        user_timezone: str = get_timezone_from_number(sender)
        user: dict = create_user(sender, user_timezone)
        logging.info(f"Created new user {user} with timezone {user_timezone}")
    else:
        logging.info(f"Found existing user for sender: {user}")

    response = {}

    if msg_type == "chat":
        logging.debug(f"Processing chat message for {sender}: {raw_msg}")
        response_message = process_text(user, raw_msg)
        response["data"] = {
            "message": response_message
        }

    if msg_type in ("audio", "ptt"):
        logging.debug(f"Processing audio message for {sender}")
        audio_response = process_audio(sender, user, raw_msg)
        if isinstance(audio_response, tuple):
            transcript_file, response_message = audio_response
            # Only include transcript file if user has enabled it
            if user.get("send_transcript_file", 1) == 1:
                response["data"] = {
                    "transcript_file": transcript_file,
                    "message": response_message
                }
            else:
                response["data"] = {
                    "message": response_message
                }
        else:
            response_message = audio_response
            response["data"] = {
                "message": response_message
            }

    if msg_type == "vcard":
        logging.debug(f"Processing vcard message for {sender}")
        response_message = process_vard(user, raw_msg)
        response["data"] = {
            "message": response_message
        }

    # .get() returns None if the key is not found
    # [] raises a KeyError if the key is not found
    data = response.get("data")
    message = data.get("message") if data else None

    if message:
        logging.info(
            f"Webhook processed type {msg_type} for {sender}, "
            f"response generated: {message}"
        )
        return success_response(data=data)

    logging.info(
        f"Webhook processed type {msg_type} for {sender}, "
        "no response message generated"
    )

    return success_response(data={"message": "Can't process this type of message."})
