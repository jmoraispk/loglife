"""Webhook blueprint handling inbound WhatsApp messages.

This module defines a Flask blueprint for handling inbound WhatsApp messages.
It processes incoming messages (text, audio, or VCARD) and routes them to the appropriate handlers.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from flask import Blueprint, g, request

from loglife.app.logic.errors import RouterError
from loglife.app.routes.webhook.schema import Message
from loglife.app.routes.webhook.utils import error_response, success_response
from loglife.core.messaging import message_bus

if TYPE_CHECKING:
    from flask.typing import ResponseReturnValue

webhook_bp = Blueprint("webhook", __name__)

logger = logging.getLogger(__name__)


@webhook_bp.route("/webhook", methods=["POST"])
def webhook() -> ResponseReturnValue:
    """Handle inbound WhatsApp messages.

    Returns:
        JSON response containing `success`, `message`, and `data`.

    """
    try:
        data: dict = request.get_json()

        message = Message.from_payload(data)
        g.client_type = message.client_type  # expose client type to sender service

        result = message_bus.publish(message)

        logger.info(
            "Webhook processed type %s for %s, response generated: %s",
            message.msg_type,
            message.sender,
            result.raw_payload,
        )
        return success_response(message=result.raw_payload, **result.attachments)
    except RouterError as exc:
        logger.warning("Router rejected message: %s", exc)
        return error_response(str(exc))
    except Exception as e:
        error = f"Error processing webhook > {e}"
        logger.exception(error)
        return error_response(error)
