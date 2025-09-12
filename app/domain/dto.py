"""Domain data transfer objects used across adapters and services."""

from dataclasses import dataclass
from typing import Any


@dataclass
class InboundMessage:
    """Normalized inbound message from any transport."""

    user_phone: str
    message_id: str | None
    text: str
    timestamp_iso: str | None = None
    raw: dict[str, Any] | None = None


@dataclass
class OutboundMessage:
    """Normalized outbound message payload to be sent via adapter."""

    user_phone: str
    text: str
    attachment_path: str | None = None
