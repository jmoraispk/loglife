"""Messaging module - unified interface for message handling."""

import logging
import os
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from queue import Empty, Queue
from threading import Thread
from typing import TYPE_CHECKING, Any

from flask import g

from loglife.app.config import WHATSAPP_CLIENT_TYPE
from loglife.core.transports import (
    format_phone_for_business_api,
    get_whatsapp_business_client,
    send_emulator_message,
    send_whatsapp_message,
)

if TYPE_CHECKING:
    from loglife.core.whatsapp_api import WhatsAppClient
    from loglife.core.whatsapp_api.endpoints import ListSection, ReplyButton, URLButton

logger = logging.getLogger(__name__)

# --- Message Class ---


@dataclass(slots=True)
class Message:
    """Normalized representation of transport messages."""

    sender: str
    msg_type: str
    raw_payload: str
    client_type: str
    metadata: dict[str, Any] = field(default_factory=dict)
    attachments: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_payload(cls, payload: Mapping[str, Any]) -> "Message":
        """Construct a message from a raw transport payload."""
        return cls(
            sender=payload["sender"],
            msg_type=payload["msg_type"],
            raw_payload=payload.get("raw_msg", ""),
            client_type=payload.get("client_type", "unknown"),
            metadata=dict(payload.get("metadata") or {}),
        )


# --- Globals ---
# Defined after Message class to avoid forward reference issues
_inbound_queue: Queue[Message] = Queue()
_outbound_queue: Queue[Message] = Queue()

_router_worker_started = False
_sender_worker_started = False

# --- Inbound / Receiver Logic ---


def enqueue_inbound_message(message: Message) -> None:
    """Place an inbound message onto the queue for processing."""
    _inbound_queue.put(message)


def start_message_worker(handler: Callable[[Message], None]) -> None:
    """Spin up a daemon thread that consumes inbound messages."""
    global _router_worker_started  # noqa: PLW0603
    if _router_worker_started:
        return

    def _worker() -> None:
        while True:
            try:
                message = _inbound_queue.get(timeout=0.1)
            except Empty:
                continue

            if message.msg_type == "_stop":
                break

            try:
                handler(message)
            except Exception:
                logger.exception("Router failed to process message from %s", message.sender)

    Thread(target=_worker, daemon=True, name="router-worker").start()
    _router_worker_started = True


# --- Outbound / Sender Logic ---


def enqueue_outbound_message(message: Message) -> None:
    """Place a message onto the outbound queue."""
    _outbound_queue.put(message)


def get_outbound_message(timeout: float | None = 0.1) -> Message:
    """Retrieve the next message destined for outbound transports."""
    return _outbound_queue.get(timeout=timeout)


def build_outbound_message(
    number: str,
    text: str,
    *,
    client_type: str = "whatsapp",
    metadata: dict[str, Any] | None = None,
    attachments: dict[str, Any] | None = None,
) -> Message:
    """Helper to construct outbound messages."""
    return Message(
        sender=number,
        msg_type="system",
        raw_payload=text,
        client_type=client_type,
        metadata=metadata or {},
        attachments=attachments or {},
    )


def start_sender_worker() -> None:
    """Start a daemon worker that drains the outbound queue."""
    global _sender_worker_started  # noqa: PLW0603
    if _sender_worker_started:
        return

    def _worker() -> None:
        while True:
            try:
                message = get_outbound_message()
            except Empty:
                continue

            if message.msg_type == "_stop":
                break

            try:
                logger.debug(
                    "Dispatching outbound message to %s via %s", message.sender, message.client_type
                )
                _dispatch_outbound(message)
            except Exception:
                logger.exception("Failed to deliver outbound message to %s", message.sender)

    Thread(target=_worker, daemon=True, name="sender-worker").start()
    _sender_worker_started = True


def _dispatch_outbound(message: Message) -> None:
    client = message.client_type or "whatsapp"
    logger.debug("Dispatching to client type: %s", client)
    if client == "emulator":
        send_emulator_message(message.raw_payload, attachments=message.attachments)
    else:
        send_whatsapp_message(message.sender, message.raw_payload, attachments=message.attachments)


def queue_async_message(
    number: str,
    message: str,
    *,
    client_type: str = "whatsapp",
    metadata: dict[str, Any] | None = None,
    attachments: dict[str, Any] | None = None,
) -> None:
    """Enqueue an outbound message for asynchronous delivery."""
    outbound = build_outbound_message(
        number,
        message,
        client_type=client_type,
        metadata=metadata,
        attachments=attachments,
    )
    enqueue_outbound_message(outbound)


def send_message(
    number: str,
    message: str,
    *,
    client_type: str | None = None,
    metadata: dict[str, Any] | None = None,
    attachments: dict[str, Any] | None = None,
) -> None:
    """Send a message immediately whenever client context is available."""
    target_client = client_type or getattr(g, "client_type", None)
    if target_client == "emulator":
        send_emulator_message(message)
    elif target_client == "whatsapp":
        send_whatsapp_message(number, message)
    else:
        logger.info(
            "Queueing async message for %s (client_type=%s)",
            number,
            target_client or "unknown",
        )
        queue_async_message(
            number,
            message,
            client_type="whatsapp",
            metadata=metadata,
            attachments=attachments,
        )


def send_whatsapp_reply_buttons(
    number: str,
    text: str,
    buttons: list["ReplyButton"],
) -> None:
    """Send a WhatsApp message with reply buttons.

    Args:
        number: Recipient phone number.
        text: Message text.
        buttons: List of ReplyButton objects.
    """
    client_type = WHATSAPP_CLIENT_TYPE.lower()

    if client_type == "business_api":
        # Use WhatsApp Business API
        try:
            client = get_whatsapp_business_client()
            formatted_number = format_phone_for_business_api(number)
            client.messages.send_reply_buttons(
                to=formatted_number,
                text=text,
                buttons=buttons,
            )
        except Exception:
            logger.exception("Error sending WhatsApp reply buttons")
            raise
    else:
        # WhatsApp Web JS client doesn't support interactive buttons
        # Fall back to sending text message
        logger.warning(
            "Reply buttons are not supported with WhatsApp Web JS client. "
            "Sending text message instead."
        )
        send_whatsapp_message(number, text)


def send_whatsapp_list_message(  # noqa: PLR0913
    number: str,
    button_text: str,
    body: str,
    sections: list["ListSection"],
    header: str | None = None,
    footer: str | None = None,
) -> None:
    """Send a WhatsApp list message.

    Args:
        number: Recipient phone number.
        button_text: Text for the action button.
        body: Message body text.
        sections: List of ListSection objects.
        header: Optional header text.
        footer: Optional footer text.
    """
    client_type = WHATSAPP_CLIENT_TYPE.lower()

    if client_type == "business_api":
        # Use WhatsApp Business API
        try:
            client = get_whatsapp_business_client()
            formatted_number = format_phone_for_business_api(number)
            client.messages.send_list(
                to=formatted_number,
                button_text=button_text,
                body=body,
                sections=sections,
                header=header,
                footer=footer,
            )
        except Exception:
            logger.exception("Error sending WhatsApp list message")
            raise
    else:
        # WhatsApp Web JS client doesn't support interactive lists
        # Fall back to sending text message
        logger.warning(
            "List messages are not supported with WhatsApp Web JS client. "
            "Sending text message instead."
        )
        send_whatsapp_message(number, body)


def send_whatsapp_cta_url(
    number: str,
    body: str,
    button: "URLButton",
) -> None:
    """Send a WhatsApp message with a CTA URL button.

    Args:
        number: Recipient phone number.
        body: Message body text.
        button: URLButton object.
    """
    client_type = WHATSAPP_CLIENT_TYPE.lower()

    if client_type == "business_api":
        # Use WhatsApp Business API
        try:
            client = get_whatsapp_business_client()
            formatted_number = format_phone_for_business_api(number)
            client.messages.send_cta_url(
                to=formatted_number,
                body=body,
                button=button,
            )
        except Exception:
            logger.exception("Error sending WhatsApp CTA URL")
            raise
    else:
        # WhatsApp Web JS client doesn't support interactive buttons
        # Fall back to sending text message with URL
        logger.warning(
            "CTA URL buttons are not supported with WhatsApp Web JS client. "
            "Sending text message with URL instead."
        )
        message_with_url = f"{body}\n\n{button.url}"
        send_whatsapp_message(number, message_with_url)


# Exception messages
_ERR_WHATSAPP_CLIENT_NOT_AVAILABLE = (
    "WhatsApp Business API client is only available when "
    "WHATSAPP_CLIENT_TYPE is set to 'business_api'"
)


def _get_whatsapp_client() -> "WhatsAppClient":
    """Get the WhatsApp Business API client.

    This function is used by webhook routes to access the WhatsApp Business API client
    for making calls and other API operations.

    Returns:
        WhatsAppClient instance.

    Raises:
        RuntimeError: If WhatsApp Business API is not configured.
    """
    client_type = WHATSAPP_CLIENT_TYPE.lower()
    if client_type != "business_api":
        raise RuntimeError(_ERR_WHATSAPP_CLIENT_NOT_AVAILABLE)

    return get_whatsapp_business_client()
