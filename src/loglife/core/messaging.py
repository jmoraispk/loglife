"""Messaging module - unified interface for message handling."""

from __future__ import annotations

import logging
import queue
from dataclasses import dataclass, field
from queue import Empty, Queue
from threading import Thread
from typing import TYPE_CHECKING, Any

import requests
from flask import g

from loglife.app.config import WHATSAPP_API_URL

if TYPE_CHECKING:
    from collections.abc import Callable, Mapping

logger = logging.getLogger(__name__)

# --- Globals ---

_inbound_queue: Queue[Message] = Queue()
_outbound_queue: Queue[Message] = Queue()
log_queue: Queue[str] = Queue()  # For streaming logs to emulator

_router_worker_started = False
_sender_worker_started = False

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
    def from_payload(cls, payload: Mapping[str, Any]) -> Message:
        """Construct a message from a raw transport payload."""
        return cls(
            sender=payload["sender"],
            msg_type=payload["msg_type"],
            raw_payload=payload.get("raw_msg", ""),
            client_type=payload.get("client_type", "unknown"),
            metadata=dict(payload.get("metadata") or {}),
        )

# --- Inbound / Receiver Logic ---

def enqueue_inbound_message(message: Message) -> None:
    """Place an inbound message onto the queue for processing."""
    _inbound_queue.put(message)

def start_message_worker(handler: Callable[[Message], None]) -> None:
    """Spin up a daemon thread that consumes inbound messages."""
    global _router_worker_started
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
            except Exception:
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
    log_queue.put(message)

def _send_whatsapp_message(number: str, message: str) -> None:
    payload = {"number": number, "message": message}
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

