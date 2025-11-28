"""Audio processing workflow for inbound WhatsApp messages."""

import logging

from app.helpers import process_journal, send_message, transcribe_audio

from .process_text import process_text

logger = logging.getLogger(__name__)


def process_audio(sender: str, user: dict, audio_data: str) -> str:
    """Process an incoming audio message from a user.

    Args:
        sender: The WhatsApp phone number of the sender
        user: The user record dictionary
        audio_data: Base64 encoded audio payload

    Returns:
        The summarized text generated from the audio.

    """
    send_message(sender, "Audio received. Transcribing...")

    response = process_journal(sender, user, audio_data)

    # Transcribe audio if journaling isn't processed by the following reasons:
    # - journaling not enabled
    # - time not reached for journaling
    # - journaling already done for that day
    if response is None:
        try:
            transcript: str = transcribe_audio(audio_data)
            logger.debug("Transcript: %s", transcript)
            response = process_text(user, transcript)
        except RuntimeError:
            logger.exception("Error transcribing audio")
            response = "Audio transcription failed!"

    return response
