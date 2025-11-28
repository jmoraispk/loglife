"""Audio processing workflow for inbound WhatsApp messages."""

import logging

from app.helpers import process_journal, send_message

logger = logging.getLogger(__name__)


def process_audio(sender: str, user: dict, audio_data: str) -> str | tuple[str, str]:
    """Process an incoming audio message from a user.

    Args:
        sender: The WhatsApp phone number of the sender
        user: The user record dictionary
        audio_data: Base64 encoded audio payload

    Returns:
        The summarized text generated from the audio, or a tuple of
        (transcript_file_base64, summarized_text).

    """
    send_message(sender, "Audio received. Transcribing...")

    return process_journal(sender, user, audio_data)
