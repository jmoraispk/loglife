"""Central message router that orchestrates inbound processing."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from loglife.app.db.client import db
from loglife.app.logic.audio import process_audio
from loglife.app.logic.text import process_text
from loglife.app.logic.timezone import get_timezone_from_number
from loglife.app.logic.vcard import process_vcard
from loglife.app.routes.webhook.schema import Message


class RouterError(RuntimeError):
    """Raised when the router cannot process a message."""


@dataclass(slots=True)
class RouterResult:
    """Structured result returned by the router."""

    message: str
    extras: dict[str, Any] = field(default_factory=dict)


def route_message(message: Message) -> RouterResult:
    """Route an inbound message to the correct processor.

    Arguments:
        message: Normalized message content from a transport adapter.

    Returns:
        RouterResult with the response text and any supplemental data.

    Raises:
        RouterError: If the message type is not supported or processing fails.
    """
    user = db.users.get_by_phone(message.sender)
    if not user:
        timezone = get_timezone_from_number(message.sender)
        user = db.users.create(message.sender, timezone)

    extras: dict[str, Any] = {}

    if message.msg_type == "chat":
        response = process_text(user, message.raw_payload)
    elif message.msg_type in {"audio", "ptt"}:
        audio_response = process_audio(message.sender, user, message.raw_payload)
        if isinstance(audio_response, tuple):
            extras["transcript_file"], response = audio_response
        else:
            response = audio_response
    elif message.msg_type == "vcard":
        response = process_vcard(user, message.raw_payload)
    else:
        raise RouterError(f"Unsupported message type: {message.msg_type}")

    return RouterResult(message=response, extras=extras)


