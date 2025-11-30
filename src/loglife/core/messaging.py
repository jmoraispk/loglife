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
    response_queue: Queue["Message"] | None = None

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

    def reply(
        self,
        raw_payload: str,
        *,
        attachments: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> "Message":
        """Clone the message with a new payload/attachments."""
        return Message(
            sender=self.sender,
            msg_type=self.msg_type,
            raw_payload=raw_payload,
            client_type=self.client_type,
            metadata=metadata if metadata is not None else dict(self.metadata),
            attachments=attachments if attachments is not None else dict(self.attachments),
        )


_inbound_queue: "Queue[Message]" = Queue()
_outbound_queue: "Queue[Message]" = Queue()
_worker_started = False


def submit_message(message: Message, *, timeout: float | None = None) -> Message:
    """Send a message into the inbound queue and wait for a reply."""
    if message.response_queue is None:
        message.response_queue = Queue(maxsize=1)

    _inbound_queue.put(message)

    try:
        return message.response_queue.get(timeout=timeout)
    except Empty:
        logger.error("Timed out waiting for router response.")
        return message.reply(raw_payload="Sorry, something took too long. Please retry.")


def start_message_worker(handler: "Callable[[Message], Message]") -> None:
    """Spin up a daemon thread that consumes inbound messages."""
    global _worker_started
    if _worker_started:
        return

    def _worker() -> None:
        while True:
            message = _inbound_queue.get()
            try:
                response = handler(message)
            except Exception:  # pragma: no cover - logged for observability
                logger.exception("Router failed to process message from %s", message.sender)
                if message.response_queue:
                    message.response_queue.put(
                        message.reply("Sorry, I hit an unexpected error. Please try again.")
                    )
            else:
                if message.response_queue:
                    message.response_queue.put(response)
                else:
                    _outbound_queue.put(response)

    Thread(target=_worker, daemon=True).start()
    _worker_started = True


def enqueue_outbound_message(message: Message) -> None:
    """Place a message onto the outbound queue."""
    _outbound_queue.put(message)


def get_outbound_message(timeout: float | None = None) -> Message:
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

