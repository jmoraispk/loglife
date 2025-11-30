"""Audio processing workflow for inbound WhatsApp messages."""

import logging

from loglife.app.db.client import db
from loglife.app.db.tables import User
from loglife.app.logic.audio.journaling.summarize_transcript import summarize_transcript
from loglife.app.logic.audio.journaling.transcript_to_base64 import transcript_to_base64
from loglife.app.logic.audio.transcribe_audio import transcribe_audio
from loglife.core.services.sender import queue_async_message

logger = logging.getLogger(__name__)


def process_audio(sender: str, user: User, audio_data: str) -> str | tuple[str, str]:
    """Process an incoming audio message from a user.

    Arguments:
        sender: The WhatsApp phone number of the sender
        user: The user record dictionary
        audio_data: Base64 encoded audio payload

    Returns:
        The summarized text generated from the audio, or a tuple of
        (transcript_file_base64, summarized_text).

    """
    queue_async_message(sender, "Audio received. Transcribing...", client_type="whatsapp")

    try:
        transcript: str = transcribe_audio(audio_data)
    except RuntimeError:
        logger.exception("Error transcribing audio")
        return "Transcription failed!"

    if not transcript.strip():
        return "Transcription was empty."

    queue_async_message(sender, "Audio transcribed. Summarizing...", client_type="whatsapp")

    try:
        summary: str = summarize_transcript(transcript)
    except RuntimeError:
        logger.exception("Error summarizing transcript")
        return "Summarization failed!"

    db.audio_journal.create(
        user_id=user.id,
        transcription_text=transcript,
        summary_text=summary,
    )
    queue_async_message(sender, "Summary stored in Database.", client_type="whatsapp")

    if user.send_transcript_file:
        transcript_file: str = transcript_to_base64(transcript)
        return transcript_file, summary

    return summary
