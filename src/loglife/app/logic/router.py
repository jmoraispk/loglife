"""Central message router that orchestrates inbound processing."""

from __future__ import annotations

from typing import Any

from loglife.app.db.client import db
from loglife.app.logic.audio import process_audio
from loglife.app.logic.text import process_text
from loglife.app.logic.timezone import get_timezone_from_number
from loglife.app.logic.vcard import process_vcard
from loglife.core.messaging import Message


def route_message(message: Message) -> Message:
    """Route an inbound message to the correct processor.

    Arguments:
        message: Normalized message content from a transport adapter.

    Raises:
        None explicitly; unexpected failures are logged by the queue worker.
    """
    user = db.users.get_by_phone(message.sender)
    if not user:
        timezone = get_timezone_from_number(message.sender)
        user = db.users.create(message.sender, timezone)

    attachments: dict[str, Any] = {}

    if message.msg_type == "chat":
        response = process_text(user, message.raw_payload)
    elif message.msg_type in {"audio", "ptt"}:
        audio_response = process_audio(message.sender, user, message.raw_payload)
        if isinstance(audio_response, tuple):
            transcript_file, response = audio_response
            attachments = {"transcript_file": transcript_file}
        else:
            response = audio_response
    elif message.msg_type == "vcard":
        response = process_vcard(user, message.raw_payload)
    else:
        return message.reply("Can't process this type of message.")

    return message.reply(raw_payload=response, attachments=attachments)


