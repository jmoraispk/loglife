"""Webhook endpoint for inbound WhatsApp messages.

Receives POST requests, validates payloads, and enqueues messages for processing.
"""

import logging
import os

from flask import Blueprint, current_app, g, request
from flask.typing import ResponseReturnValue
from flask.wrappers import Response

from loglife.app.logic.timezone import normalize_phone_number
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


def _extract_webhook_entry(data: dict) -> dict | None:
    """Extract entry from Meta webhook payload.

    Args:
        data: The JSON payload from Meta webhook.

    Returns:
        The first entry if found, None otherwise.
    """
    entry = data.get("entry", [])
    if not entry:
        logger.warning("No entry found in Meta webhook payload")
        return None
    return entry[0]


def _extract_webhook_change(entry: dict) -> dict | None:
    """Extract change from Meta webhook entry.

    Args:
        entry: The entry object from Meta webhook.

    Returns:
        The first change if found, None otherwise.
    """
    changes = entry.get("changes", [])
    if not changes:
        logger.warning("No changes found in Meta webhook payload")
        return None
    return changes[0]


def _extract_message_content(message: dict, sender: str) -> str | None:
    """Extract message content from message object.

    Args:
        message: The message object from Meta webhook.
        sender: The sender phone number.

    Returns:
        The extracted message content, or None if extraction fails.
    """
    message_type = message.get("type")

    if message_type == "text":
        text_data = message.get("text", {})
        raw_msg = text_data.get("body", "")
        if not raw_msg:
            logger.warning("Missing message body in text message")
            return None
        return raw_msg

    if message_type == "interactive":
        return _extract_interactive_content(message, sender)

    logger.debug("Ignoring non-text/non-interactive message type: %s", message_type)
    return None


def _handle_missing_message_content(message: dict) -> ResponseReturnValue:
    """Handle case when message content extraction fails.

    Args:
        message: The message object from Meta webhook.

    Returns:
        Appropriate response based on message type.
    """
    message_type = message.get("type")
    if message_type == "interactive":
        interactive_data = message.get("interactive", {})
        interactive_type = interactive_data.get("type")
        return success_response(message=f"Ignored interactive type: {interactive_type}")
    if message_type != "text":
        return success_response(message=f"Ignored message type: {message_type}")
    return error_response("Missing message body")


def _extract_interactive_content(message: dict, sender: str) -> str | None:
    """Extract content from interactive message.

    Args:
        message: The message object from Meta webhook.
        sender: The sender phone number.

    Returns:
        The extracted message content, or None if extraction fails.
    """
    interactive_data = message.get("interactive", {})
    interactive_type = interactive_data.get("type")

    if interactive_type == "list_reply":
        list_reply = interactive_data.get("list_reply", {})
        raw_msg = list_reply.get("id", "")
        if not raw_msg:
            logger.warning("Missing list reply ID in interactive message")
            return None
        logger.info("Processing list reply: %s from %s", raw_msg, sender)
        return raw_msg

    if interactive_type == "button_reply":
        button_reply = interactive_data.get("button_reply", {})
        raw_msg = button_reply.get("id", "")
        if not raw_msg:
            logger.warning("Missing button reply ID in interactive message")
            return None
        logger.info("Processing button reply: %s from %s", raw_msg, sender)
        return raw_msg

    logger.debug("Ignoring unsupported interactive message type: %s", interactive_type)
    return None


def _process_message_payload(value: dict, message: dict, sender: str) -> ResponseReturnValue:
    """Process a message payload and forward to webhook.

    Args:
        value: The value object from the webhook change.
        message: The message object.
        sender: The sender phone number.

    Returns:
        Response from webhook processing.
    """
    raw_msg = _extract_message_content(message, sender)
    if raw_msg is None:
        return _handle_missing_message_content(message)

    # Extract profile name from contacts if available
    contacts = value.get("contacts", [])
    profile_name: str | None = None
    if contacts:
        contact = contacts[0]
        profile = contact.get("profile", {})
        profile_name = profile.get("name")

    # Create custom payload matching the expected format
    custom_payload = {
        "sender": sender,
        "raw_msg": raw_msg,
        "msg_type": "chat",
        "client_type": "whatsapp",
    }

    # Add profile name to metadata if available
    if profile_name:
        custom_payload["metadata"] = {"profile_name": profile_name}

    # Forward to /webhook route internally
    # Create a new request context with the custom payload and call webhook directly
    with current_app.test_request_context("/webhook", method="POST", json=custom_payload):
        # Call the webhook function directly with the modified request context
        return webhook()


def _process_meta_message(data: dict) -> ResponseReturnValue:
    """Process incoming Meta webhook message (POST request).

    Args:
        data: The JSON payload from Meta webhook.

    Returns:
        Response after processing the message or forwarding to webhook.
    """
    # Extract message from Meta webhook payload structure
    # Meta webhook format: {"entry": [{"changes": [{"value": {"messages": [...]}}]}]}
    entry = _extract_webhook_entry(data)
    if entry is None:
        return success_response(message="No entry found")

    change = _extract_webhook_change(entry)
    if change is None:
        return success_response(message="No changes found")

    value = change.get("value", {})
    messages = value.get("messages", [])

    if not messages:
        # This might be a status update or other non-message event
        logger.debug("No messages in webhook payload, likely a status update")
        return success_response(message="No messages to process")

    message = messages[0]
    sender = message.get("from")

    if not sender:
        logger.warning("Missing sender in message")
        return error_response("Missing sender")

    # Normalize phone number by removing WhatsApp suffix (@c.us)
    sender = normalize_phone_number(sender)

    return _process_message_payload(value, message, sender)


@webhook_bp.route("/whatsapp-incoming", methods=["GET", "POST"])
def whatsapp_incoming() -> ResponseReturnValue:
    """Handle incoming messages from Meta WhatsApp Cloud API.

    GET: Webhook verification (Meta sends verification challenge)
    POST: Processes text and interactive list messages, creates a custom payload,
          and forwards to /webhook. List selections are sent as text commands.
    """
    if request.method == "GET":
        return _handle_webhook_verification()

    # POST method - handle incoming messages
    try:
        data: dict = request.get_json()
        return _process_meta_message(data)
    except Exception:
        logger.exception("Error processing Meta webhook")
        return error_response("Error processing Meta webhook")
