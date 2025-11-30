"""Queue-based messaging primitives shared between core transports and the app."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from queue import Empty, Queue
from threading import Thread
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Callable, Mapping

logger = logging.getLogger(__name__)


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


_inbound_queue: "Queue[Message]" = Queue()
_outbound_queue: "Queue[Message]" = Queue()
_worker_started = False


def enqueue_inbound_message(message: Message) -> None:
    """Place an inbound message onto the queue for processing."""
    _inbound_queue.put(message)


def start_message_worker(handler: "Callable[[Message], None]") -> None:
    """Spin up a daemon thread that consumes inbound messages."""
    global _worker_started
    if _worker_started:
        return

    def _worker() -> None:
        while True:
            try:
                message = _inbound_queue.get(timeout=0.1)
            except Empty:
                continue

            if message.msg_type == "_stop":
                # Sentinel value to stop the worker thread cleanly (used in tests)
                break

            try:
                handler(message)
            except Exception:  # pragma: no cover - logged for observability
                logger.exception("Router failed to process message from %s", message.sender)

    Thread(target=_worker, daemon=True, name="router-worker").start()
    _worker_started = True


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

