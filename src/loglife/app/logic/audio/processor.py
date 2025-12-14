"""Audio processing workflow for inbound WhatsApp messages.

Orchestrates transcription (Whisper), summarization (GPT), and database storage
of voice notes.
"""

import logging

from loglife.app.db import db
from loglife.app.db.tables import User
from loglife.app.logic.audio.journaling.summarize_transcript import summarize_transcript
from loglife.app.logic.audio.journaling.transcript_to_base64 import transcript_to_base64
from loglife.app.logic.audio.transcribe_audio import transcribe_audio
from loglife.core.messaging import Message, queue_async_message

logger = logging.getLogger(__name__)


def process_audio(
    user: User,
    message: Message,
) -> str | tuple[str, str]:
    """Process an incoming audio message from a user.

    Arguments:
        user: The user record dictionary
        message: The incoming message object

    Returns:
        The summarized text generated from the audio, or a tuple of
        (transcript_file_base64, summarized_text).

    """
    client_type = message.client_type or "whatsapp"
    sender = message.sender
    audio_data = message.raw_payload

    queue_async_message(sender, "Audio received. Transcribing...", client_type=client_type)

    try:
        try:
            transcript: str = transcribe_audio(audio_data)
        except RuntimeError:
            logger.exception("Error transcribing audio")
            return "Transcription failed!"

        if not transcript.strip():
            return "Transcription was empty."

        queue_async_message(
            sender,
            "Audio transcribed. Summarizing...",
            client_type=client_type,
        )

        try:
            summary: str = summarize_transcript(transcript)
        except RuntimeError:
            logger.exception("Error summarizing transcript")
            return "Summarization failed!"

        db.audio_journals.create(
            user_id=user.id,
            transcription_text=transcript,
            summary_text=summary,
        )
        queue_async_message(
            sender,
            "Summary stored in Database.",
            client_type=client_type,
        )

        if user.send_transcript_file:
            transcript_file: str = transcript_to_base64(transcript)
            return transcript_file, summary

    except Exception as exc:
        logger.exception("Error in audio processor")
        return f"Error in audio processor: {exc}"

    return summary
