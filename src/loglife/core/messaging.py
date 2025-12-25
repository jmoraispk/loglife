"""Messaging module - unified interface for message handling."""

import json
import logging
import os
from collections.abc import Callable, Generator, Mapping
from dataclasses import dataclass, field
from queue import Empty, Queue
from threading import Lock, Thread
from typing import Any

import requests
from flask import g

from loglife.app.config import WHATSAPP_API_URL
from loglife.core.whatsapp_api.client import WhatsAppClient
from loglife.core.whatsapp_api.endpoints.messages import (
    ListSection,
    ReplyButton,
    URLButton,
    VoiceCallButton,
)
from loglife.core.whatsapp_api.exceptions import WhatsAppHTTPError, WhatsAppRequestError

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


# --- Log Broadcaster ---


class LogBroadcaster:
    """Broadcasts logs to multiple listeners (SSE clients)."""

    def __init__(self) -> None:
        """Initialize the log broadcaster."""
        self._listeners: set[Queue[str]] = set()
        self._lock = Lock()

    def publish(self, message: str) -> None:
        """Send a message to all active listeners."""
        with self._lock:
            for q in self._listeners:
                q.put(message)

    def listen(self) -> Generator[str, None, None]:
        """Yield messages for a single listener."""
        q: Queue[str] = Queue()
        with self._lock:
            self._listeners.add(q)
        try:
            while True:
                msg = q.get()
                yield msg
        finally:
            with self._lock:
                if q in self._listeners:
                    self._listeners.remove(q)


# --- Globals ---
# Defined after Message class to avoid forward reference issues
_inbound_queue: Queue[Message] = Queue()
_outbound_queue: Queue[Message] = Queue()
log_broadcaster = LogBroadcaster()

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
        _send_emulator_message(message.raw_payload, attachments=message.attachments)
    else:
        # Use WhatsApp Business API client for text messages
        _send_whatsapp_message_via_api(
            message.sender, message.raw_payload, attachments=message.attachments
        )


def _send_emulator_message(message: str, attachments: dict[str, Any] | None = None) -> None:
    logger.info("Sending emulator message: %s", message)

    if attachments and "transcript_file" in attachments:
        try:
            data = json.dumps({"text": message, "transcript_file": attachments["transcript_file"]})
            log_broadcaster.publish(data)
        except Exception:
            logger.exception("Failed to serialize emulator message")
            log_broadcaster.publish(message)
    else:
        log_broadcaster.publish(message)


# WhatsApp Business API credentials from environment variables
_WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
_WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")

# Lazy-initialized WhatsApp client
_whatsapp_client: WhatsAppClient | None = None


def _get_whatsapp_client() -> WhatsAppClient:
    """Get or create WhatsApp client instance."""
    global _whatsapp_client  # noqa: PLW0603
    if _whatsapp_client is None:
        _whatsapp_client = WhatsAppClient(
            access_token=_WHATSAPP_ACCESS_TOKEN,
            phone_number_id=_WHATSAPP_PHONE_NUMBER_ID,
        )
    return _whatsapp_client


def _send_whatsapp_message_via_api(
    number: str, message: str, attachments: dict[str, Any] | None = None
) -> None:
    """Send WhatsApp message using WhatsApp Business API client (for text messages only)."""
    if attachments:
        # For now, only support text messages. Fall back to old method if attachments present.
        logger.warning("Attachments not supported via API client, falling back to old method")
        _send_whatsapp_message(number, message, attachments)
        return

    try:
        client = _get_whatsapp_client()
        # Remove any non-digit characters and ensure proper format
        clean_number = number.replace("+", "").replace("-", "").replace(" ", "")
        response = client.messages.send_text(to=clean_number, text=message, preview_url=False)
        logger.info(
            "Sent WhatsApp message via API to %s, message_id: %s",
            number,
            response.message_id,
        )
    except (WhatsAppHTTPError, WhatsAppRequestError) as exc:
        error = f"Error sending WhatsApp message via API > {exc}"
        logger.exception(error)
        # Fall back to old method on API error
        logger.info("Falling back to old WhatsApp message method")
        _send_whatsapp_message(number, message, attachments)
    except Exception as exc:
        error = f"Unexpected error sending WhatsApp message via API > {exc}"
        logger.exception(error)
        # Fall back to old method on unexpected error
        logger.info("Falling back to old WhatsApp message method")
        _send_whatsapp_message(number, message, attachments)


@dataclass
class ListMessageContent:
    """Content for a WhatsApp list message."""

    button_text: str
    body: str
    sections: list[ListSection]
    header: str | None = None
    footer: str | None = None


def send_whatsapp_list_message(  # noqa: PLR0913
    number: str,
    button_text: str,
    body: str,
    sections: list[ListSection],
    header: str | None = None,
    footer: str | None = None,
) -> None:
    """Send WhatsApp list message using WhatsApp Business API client.

    Args:
        number: Recipient phone number.
        button_text: Text displayed on the action button (max 20 characters).
        body: Message body text (max 1024 characters).
        sections: List of sections with rows.
        header: Optional header text (max 60 characters). Defaults to None.
        footer: Optional footer text (max 60 characters). Defaults to None.
    """
    content = ListMessageContent(
        button_text=button_text,
        body=body,
        sections=sections,
        header=header,
        footer=footer,
    )
    _send_whatsapp_list_message_impl(number, content)


def _send_whatsapp_list_message_impl(number: str, content: ListMessageContent) -> None:
    """Internal implementation for sending WhatsApp list message.

    Args:
        number: Recipient phone number.
        content: List message content.
    """
    try:
        client = _get_whatsapp_client()
        # Remove any non-digit characters and ensure proper format
        clean_number = number.replace("+", "").replace("-", "").replace(" ", "")
        response = client.messages.send_list(
            to=clean_number,
            button_text=content.button_text,
            body=content.body,
            sections=content.sections,
            header=content.header,
            footer=content.footer,
        )
        logger.info(
            "Sent WhatsApp list message via API to %s, message_id: %s",
            number,
            response.message_id,
        )
    except (WhatsAppHTTPError, WhatsAppRequestError) as exc:
        error = f"Error sending WhatsApp list message via API > {exc}"
        logger.exception(error)
        # Fall back to text message on API error
        logger.info("Falling back to text message")
        fallback_text = content.body
        if content.header:
            fallback_text = f"{content.header}\n\n{fallback_text}"
        if content.footer:
            fallback_text = f"{fallback_text}\n\n{content.footer}"
        _send_whatsapp_message_via_api(number, fallback_text)
    except Exception as exc:
        error = f"Unexpected error sending WhatsApp list message via API > {exc}"
        logger.exception(error)
        # Fall back to text message on unexpected error
        logger.info("Falling back to text message")
        fallback_text = content.body
        if content.header:
            fallback_text = f"{content.header}\n\n{fallback_text}"
        if content.footer:
            fallback_text = f"{fallback_text}\n\n{content.footer}"
        _send_whatsapp_message_via_api(number, fallback_text)


def send_whatsapp_reply_buttons(
    number: str,
    text: str,
    buttons: list[ReplyButton],
) -> None:
    """Send WhatsApp reply buttons message using WhatsApp Business API client.

    Args:
        number: Recipient phone number.
        text: Message body text (displayed above buttons).
        buttons: List of reply buttons (1-3 buttons allowed).
    """
    try:
        client = _get_whatsapp_client()
        # Remove any non-digit characters and ensure proper format
        clean_number = number.replace("+", "").replace("-", "").replace(" ", "")
        response = client.messages.send_reply_buttons(
            to=clean_number,
            text=text,
            buttons=buttons,
        )
        logger.info(
            "Sent WhatsApp reply buttons via API to %s, message_id: %s",
            number,
            response.message_id,
        )
    except (WhatsAppHTTPError, WhatsAppRequestError) as exc:
        error = f"Error sending WhatsApp reply buttons via API > {exc}"
        logger.exception(error)
        # Fall back to text message on API error
        logger.info("Falling back to text message")
        _send_whatsapp_message_via_api(number, text)
    except Exception as exc:
        error = f"Unexpected error sending WhatsApp reply buttons via API > {exc}"
        logger.exception(error)
        # Fall back to text message on unexpected error
        logger.info("Falling back to text message")
        _send_whatsapp_message_via_api(number, text)


def send_whatsapp_voice_call_button(
    number: str,
    body: str,
    button: VoiceCallButton,
) -> None:
    """Send WhatsApp voice call button message using WhatsApp Business API client.

    Args:
        number: Recipient phone number.
        body: Message body text (max 1024 characters).
        button: Voice call button with display_text, ttl_minutes, and payload.
    """
    try:
        client = _get_whatsapp_client()
        # Remove any non-digit characters and ensure proper format
        clean_number = number.replace("+", "").replace("-", "").replace(" ", "")
        response = client.messages.send_voice_call_button(
            to=clean_number,
            body=body,
            button=button,
        )
        logger.info(
            "Sent WhatsApp voice call button via API to %s, message_id: %s",
            number,
            response.message_id,
        )
    except (WhatsAppHTTPError, WhatsAppRequestError) as exc:
        error = f"Error sending WhatsApp voice call button via API > {exc}"
        logger.exception(error)
        # Fall back to text message on API error
        logger.info("Falling back to text message")
        _send_whatsapp_message_via_api(number, body)
    except Exception as exc:
        error = f"Unexpected error sending WhatsApp voice call button via API > {exc}"
        logger.exception(error)
        # Fall back to text message on unexpected error
        logger.info("Falling back to text message")
        _send_whatsapp_message_via_api(number, body)


def send_whatsapp_cta_url(
    number: str,
    body: str,
    button: URLButton,
) -> None:
    """Send WhatsApp CTA URL button message using WhatsApp Business API client.

    Args:
        number: Recipient phone number.
        body: Message body text (max 1024 characters).
        button: URL button with display_text and url.
    """
    try:
        client = _get_whatsapp_client()
        # Remove any non-digit characters and ensure proper format
        clean_number = number.replace("+", "").replace("-", "").replace(" ", "")
        response = client.messages.send_cta_url(
            to=clean_number,
            body=body,
            button=button,
        )
        logger.info(
            "Sent WhatsApp CTA URL button via API to %s, message_id: %s",
            number,
            response.message_id,
        )
    except (WhatsAppHTTPError, WhatsAppRequestError) as exc:
        error = f"Error sending WhatsApp CTA URL button via API > {exc}"
        logger.exception(error)
        # Fall back to text message on API error
        logger.info("Falling back to text message")
        _send_whatsapp_message_via_api(number, body)
    except Exception as exc:
        error = f"Unexpected error sending WhatsApp CTA URL button via API > {exc}"
        logger.exception(error)
        # Fall back to text message on unexpected error
        logger.info("Falling back to text message")
        _send_whatsapp_message_via_api(number, body)


def _send_whatsapp_message(
    number: str, message: str, attachments: dict[str, Any] | None = None
) -> None:
    """Send WhatsApp message via local HTTP endpoint (legacy method)."""
    payload = {"number": number, "message": message}
    if attachments:
        payload["attachments"] = attachments

    headers = {"Content-Type": "application/json"}
    try:
        requests.post(WHATSAPP_API_URL, json=payload, headers=headers, timeout=30)
    except Exception as exc:
        error = f"Error sending WhatsApp message > {exc}"
        logger.exception(error)
        raise RuntimeError(error) from exc


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
        _send_emulator_message(message)
    elif target_client == "whatsapp":
        _send_whatsapp_message_via_api(number, message, attachments=attachments)
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
