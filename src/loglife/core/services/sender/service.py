"""Service for sending messages to clients (WhatsApp, Emulator, etc.)."""

from __future__ import annotations

import logging
import queue
from queue import Empty
from threading import Thread
from typing import Any

import requests
from flask import g
from loglife.app.config import WHATSAPP_API_URL
from loglife.core.messaging import (
    Message,
    build_outbound_message,
    enqueue_outbound_message,
    get_outbound_message,
)

logger = logging.getLogger(__name__)

# Queue for streaming log messages to clients via SSE
log_queue = queue.Queue()
_sender_worker_started = False


def start_sender_worker() -> None:
    """Start a daemon worker that drains the outbound queue."""
    global _sender_worker_started
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
                _dispatch_outbound(message)
            except Exception:  # pragma: no cover
                logger.exception("Failed to deliver outbound message to %s", message.sender)

    Thread(target=_worker, daemon=True, name="sender-worker").start()
    _sender_worker_started = True


def _dispatch_outbound(message: Message) -> None:
    client = message.client_type or "whatsapp"
    if client == "emulator":
        _send_emulator_message(message.raw_payload)
    else:
        _send_whatsapp_message(message.sender, message.raw_payload)


def _send_emulator_message(message: str) -> None:
    """Push emulator responses to the SSE log queue."""
    log_queue.put(message)


def _send_whatsapp_message(number: str, message: str) -> None:
    """Send a WhatsApp message to the specified phone number."""
    payload = {"number": number, "message": message}
    headers = {"Content-Type": "application/json"}

    try:
        requests.post(WHATSAPP_API_URL, json=payload, headers=headers, timeout=30)
    except Exception as exc:  # pragma: no cover
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
        _send_whatsapp_message(number, message)
    else:
        logger.info(
            "Queueing async message for %s (client_type=%s)", number, target_client or "unknown"
        )
        queue_async_message(
            number,
            message,
            client_type="whatsapp",
            metadata=metadata,
            attachments=attachments,
        )
