"""Inbound message receiver and worker."""

from __future__ import annotations

import logging
from queue import Empty, Queue
from threading import Thread
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Callable

from loglife.core.messaging.message import Message

logger = logging.getLogger(__name__)

_inbound_queue: Queue[Message] = Queue()
_worker_started = False

# Expose for tests
__all__ = ["_inbound_queue", "_worker_started", "enqueue_inbound_message", "start_message_worker"]


def enqueue_inbound_message(message: Message) -> None:
    """Place an inbound message onto the queue for processing."""
    _inbound_queue.put(message)


def start_message_worker(handler: Callable[[Message], None]) -> None:
    """Spin up a daemon thread that consumes inbound messages."""
    global _worker_started  # noqa: PLW0603
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
