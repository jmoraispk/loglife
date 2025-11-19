"""Webhook blueprint handling inbound WhatsApp messages.

This module defines a Flask blueprint for handling inbound WhatsApp messages.
It processes incoming messages (text, audio, or VCARD) and routes them to the appropriate handlers.
"""

from flask import Blueprint, request, jsonify
from flask.typing import ResponseReturnValue
from app.logic import process_vard, process_audio, process_message
from app.db import get_user_by_phone_number, create_user
from app.helpers import get_timezone_from_number
import logging

webhook_bp = Blueprint("webhook", __name__)


@webhook_bp.route("/webhook", methods=["POST"])
def webhook() -> ResponseReturnValue:
    """Handles inbound WhatsApp messages.

    Returns JSON response containing `success`, `message`, and `data`.
    """
    data: dict | None = request.get_json()

    if data is None or not isinstance(data, dict):
        # Return a JSON error payload so end user don't get technical errors and those must be handled by the client.
        body = {
            "success": False,
            "message": "Invalid JSON payload.",  # this message is for client, not for end user
            "data": None,
        }
        logging.error(f"Webhook received invalid JSON payload: {data}")
        return jsonify(body), 400

    logging.debug(f"Incoming webhook payload: {data}")

    try:
        sender: str = data["sender"]
        msg_type: str = data["msg_type"]
        raw_msg: str = data["raw_msg"]
    except KeyError as missing:
        body = {
            "success": False,
            # missing.args is a tuple.
            # missing.args[0] holds the name of the absent field (e.g., "sender").
            "message": f"Invalid payload: missing {missing.args[0]}",  # this message is for client, not for end user
            "data": None,
        }
        logging.error(f"Webhook payload missing field: {missing.args[0]}")
        return jsonify(body), 400

    user: dict | None = get_user_by_phone_number(sender)

    if not user:
        user_timezone: str = get_timezone_from_number(sender)
        user: dict = create_user(sender, user_timezone)
        logging.info(f"Created new user {user} with timezone {user_timezone}")
    else:
        logging.info(f"Found existing user for sender: {user}")

    response_message = None

    if msg_type == "chat":
        logging.debug(f"Processing chat message for {sender}: {raw_msg}")
        response_message = process_message(user, raw_msg)

    if msg_type in ("audio", "ptt"):
        logging.debug(f"Processing audio message for {sender}")
        response_message = process_audio(sender, raw_msg)

    if msg_type == "vcard":
        logging.debug(f"Processing vcard message for {sender}")
        response_message = process_vard(user, raw_msg)

    if response_message:
        logging.info(
            f"Webhook processed type {msg_type} for {sender}, response generated: {response_message}"
        )
        body = {
            "success": True,
            "message": None,  # this message is for client, not for end user
            "data": {
                "message": response_message,  # this message is for end user
            },
        }
    else:
        logging.info(
            f"Webhook processed type {msg_type} for {sender}, no response message generated"
        )
        body = {
            "success": True,
            "message": None,  # this message is for client, not for end user
            "data": {
                "message": "Can't process this type of message.",  # this message is for end user
            },
        }

    return jsonify(body), 200
