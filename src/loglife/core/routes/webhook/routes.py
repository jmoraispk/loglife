"""Webhook endpoint for inbound WhatsApp messages.

Receives POST requests, validates payloads, and enqueues messages for processing.
"""


import logging

from flask import Blueprint, g, request
from flask.typing import ResponseReturnValue

from loglife.core.messaging import Message, enqueue_inbound_message

from .utils import error_response, success_response

webhook_bp = Blueprint("webhook", __name__)

logger = logging.getLogger(__name__)


@webhook_bp.route("/webhook", methods=["POST"])
def webhook() -> ResponseReturnValue:
    """Handle inbound WhatsApp messages."""
    try:
        data: dict = request.get_json()

        message = Message.from_payload(data)
        g.client_type = message.client_type  # expose client type to sender service

        enqueue_inbound_message(message)

        logger.info("Queued message type %s for %s", message.msg_type, message.sender)
        return success_response(message="Message queued")
    except Exception as e:
        error = f"Error processing webhook > {e}"
        logger.exception(error)
        return error_response(error)
