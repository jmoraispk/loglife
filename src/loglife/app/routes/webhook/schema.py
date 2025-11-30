from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Mapping


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
        """Construct a Message from an HTTP/transport payload."""
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
        """Return a cloned message carrying response data."""
        return Message(
            sender=self.sender,
            msg_type=self.msg_type,
            raw_payload=raw_payload,
            client_type=self.client_type,
            metadata=metadata if metadata is not None else dict(self.metadata),
            attachments=attachments if attachments is not None else dict(self.attachments),
        )
