"""Data structures used by inbound webhook routes."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Mapping


@dataclass(slots=True)
class Message:
    """Normalized representation of an inbound transport message."""

    sender: str
    msg_type: str
    raw_payload: str
    client_type: str
    metadata: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_payload(cls, payload: Mapping[str, Any]) -> "Message":
        """Construct a Message from a HTTP/transport payload."""
        if payload["client_type"] != "whatsapp":
            msg = f"Invalid client type: {payload['client_type']}"
            raise ValueError(msg)

        return cls(
            sender=payload["sender"],
            msg_type=payload["msg_type"],
            raw_payload=payload.get("raw_msg", ""),
            client_type=payload.get("client_type", "unknown"),
            metadata=dict(payload.get("metadata") or {}),
        )


