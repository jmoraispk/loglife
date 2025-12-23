"""Webhook endpoint for inbound WhatsApp messages.

Receives POST requests, validates payloads, and enqueues messages for processing.
"""

import logging
import os

from flask import Blueprint, current_app, g, request
from flask.typing import ResponseReturnValue
from flask.wrappers import Response

from loglife.core.messaging import Message, enqueue_inbound_message

from .utils import error_response, success_response

webhook_bp = Blueprint("webhook", __name__)

logger = logging.getLogger(__name__)

# Webhook verification token for Meta webhook verification
VERIFY_TOKEN = os.getenv("VERIFY_TOKEN", "")


@webhook_bp.route("/webhook", methods=["POST"])
def webhook() -> ResponseReturnValue:
    """Handle inbound WhatsApp messages."""
    try:
        data: dict = request.get_json()

        message = Message.from_payload(data)
        g.client_type = message.client_type  # expose client type to sender service

        enqueue_inbound_message(message)

        logger.info("Queued message type %s for %s", message.msg_type, message.sender)
        # For emulator, we don't need an explicit "queued" response message in the UI
        # We return an empty message so the emulator doesn't show "Message queued"
        return success_response(message="")
    except Exception as e:
        error = f"Error processing webhook > {e}"
        logger.exception(error)
        return error_response(error)


def _handle_webhook_verification() -> ResponseReturnValue:
    """Handle webhook verification (GET request).

    Returns:
        Response with challenge if verification succeeds, error response otherwise.
    """
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        logger.info("Webhook verified successfully")
        # Return the challenge as plain text (not JSON)
        return Response(challenge, mimetype="text/plain"), 200

    logger.warning(
        "Webhook verification failed: mode=%s, token_match=%s", mode, token == VERIFY_TOKEN
    )
    return error_response("Verification failed", status_code=403)


def _process_meta_message(data: dict) -> ResponseReturnValue:
    """Process incoming Meta webhook message (POST request).

    Args:
        data: The JSON payload from Meta webhook.

    Returns:
        Response after processing the message or forwarding to webhook.
    """
    # Extract message from Meta webhook payload structure
    # Meta webhook format: {"entry": [{"changes": [{"value": {"messages": [...]}}]}]}
    entry = data.get("entry", [])
    if not entry:
        logger.warning("No entry found in Meta webhook payload")
        return success_response(message="No entry found")

    changes = entry[0].get("changes", [])
    if not changes:
        logger.warning("No changes found in Meta webhook payload")
        return success_response(message="No changes found")

    value = changes[0].get("value", {})
    messages = value.get("messages", [])

    if not messages:
        # This might be a status update or other non-message event
        logger.debug("No messages in webhook payload, likely a status update")
        return success_response(message="No messages to process")

    message = messages[0]
    message_type = message.get("type")

    # Process only text messages for now
    if message_type != "text":
        logger.debug("Ignoring non-text message type: %s", message_type)
        return success_response(message=f"Ignored non-text message type: {message_type}")

    # Extract sender and text content
    sender = message.get("from")
    text_data = message.get("text", {})
    raw_msg = text_data.get("body", "")

    if not sender or not raw_msg:
        logger.warning("Missing sender or message body in text message")
        return error_response("Missing sender or message body")

    # Create custom payload matching the expected format
    custom_payload = {
        "sender": sender,
        "raw_msg": raw_msg,
        "msg_type": "chat",
        "client_type": "whatsapp",
    }

    # Forward to /webhook route internally
    # Create a new request context with the custom payload and call webhook directly
    with current_app.test_request_context("/webhook", method="POST", json=custom_payload):
        # Call the webhook function directly with the modified request context
        return webhook()


@webhook_bp.route("/whatsapp-incoming", methods=["GET", "POST"])
def whatsapp_incoming() -> ResponseReturnValue:
    """Handle incoming messages from Meta WhatsApp Cloud API.

    GET: Webhook verification (Meta sends verification challenge)
    POST: Processes only text messages, creates a custom payload, and forwards to /webhook.
    """
    if request.method == "GET":
        return _handle_webhook_verification()

    # POST method - handle incoming messages
    try:
        data: dict = request.get_json()
        return _process_meta_message(data)
    except Exception as e:
        error = f"Error processing Meta webhook > {e}"
        logger.exception(error)
        return error_response(error)
