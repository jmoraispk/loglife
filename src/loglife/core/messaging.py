"""Lightweight message bus for coordinating transports and application logic."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any


class MessageBus:
    """Simple synchronous pub/sub bus.

    Transports publish inbound messages; application logic registers a single
    subscriber to handle them. The handler returns the response message,
    which is forwarded back to the transport.
    """

    def __init__(self) -> None:
        self._subscribers: list[Callable[[Any], Any]] = []

    def subscribe(self, handler: Callable[[Any], Any]) -> None:
        """Register a handler if it hasn't been registered yet."""
        if handler in self._subscribers:
            return
        self._subscribers.append(handler)

    def publish(self, message: Any) -> Any:
        """Send a message through the bus and return the handler response."""
        if not self._subscribers:
            msg = "No subscribers registered on the message bus."
            raise RuntimeError(msg)

        result = message
        for handler in self._subscribers:
            result = handler(result)
        return result


message_bus = MessageBus()


