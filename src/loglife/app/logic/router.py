"""Central message router that orchestrates inbound processing.

Dispatches messages to the appropriate logic handler (Text, Audio, VCard)
based on the message type.
"""

import logging
from typing import Any

import phonenumbers
from phonenumbers import NumberParseException, timezone

from loglife.app.db import db
from loglife.app.logic.audio import process_audio
from loglife.app.logic.text import process_text
from loglife.app.logic.timezone import normalize_phone_number
from loglife.app.logic.vcard import process_vcard
from loglife.core.messaging import Message, queue_async_message

logger = logging.getLogger(__name__)


def get_timezone_from_number(number: str) -> str:
    """Derive an IANA timezone string for a given phone number.

    The function attempts to parse the phone number using `phonenumbers` and
    returns the first timezone associated with the parsed region. If parsing
    fails or no timezone information is available, "UTC" is returned.
    """
    try:
        normalized = number if number.startswith("+") else f"+{number}"
        parsed = phonenumbers.parse(normalized)
    except NumberParseException:
        return "UTC"

    timezones = timezone.time_zones_for_number(parsed)
    if not timezones:
        return "UTC"

    tz = timezones[0]
    if tz == "Etc/Unknown":
        return "UTC"

    return tz


def route_message(message: Message) -> None:
    """Route an inbound message to the correct processor and queue a reply."""
    # Normalize phone number by removing WhatsApp suffix (@c.us)
    normalized_sender = normalize_phone_number(message.sender)
    user = db.users.get_by_phone(normalized_sender)
    if not user:
        timezone = get_timezone_from_number(normalized_sender)
        user = db.users.create(normalized_sender, timezone, client_type=message.client_type)

    attachments: dict[str, Any] = {}

    logger.info("Processing message type: %s", message.msg_type)

    try:
        if message.msg_type == "chat":
            response = process_text(user, message)
        elif message.msg_type in {"audio", "ptt"}:
            audio_response = process_audio(user, message)
            if isinstance(audio_response, tuple):
                transcript_file, response = audio_response
                attachments = {"transcript_file": transcript_file}
            else:
                response = audio_response
        elif message.msg_type == "vcard":
            response = process_vcard(user, message)
        else:
            response = (
                "Can't process this type of message. Recognized types: chat, audio, ptt, vcard"
            )
            attachments = {}
    except Exception:
        logger.exception("Error processing message from %s", message.sender)
        response = "Sorry, something went wrong while processing your message."
        attachments = {}

    # Only queue message if response is not None (some handlers send messages directly)
    if response is not None:
        queue_async_message(
            normalized_sender,
            response,
            client_type=message.client_type or "whatsapp",
            metadata=message.metadata,
            attachments=attachments,
        )
