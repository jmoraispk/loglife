"""Process journal module."""

import logging

from app.db import create_audio_journal_entry
from app.helpers.audio.transcribe_audio import transcribe_audio
from app.helpers.sender import send_message

from .summarize_transcript import summarize_transcript
from .transcript_to_base64 import transcript_to_base64

logger = logging.getLogger(__name__)


def process_journal(sender: str, user: dict, audio_data: str) -> str | tuple[str, str]:
    """Process an audio journal entry for a user.

    Args:
        sender: The phone number of the sender
        user: The user dictionary
        audio_data: Base64 encoded audio data

    Returns:
        Either a response string or tuple of (transcript_file, summary)

    """
    response = None
    try:
        transcript: str = transcribe_audio(audio_data)

        # IF transcript is ON for user.
        transcript_file: str = transcript_to_base64(transcript)

        send_message(sender, "Audio transcribed. Summarizing...")

        try:
            summary: str = summarize_transcript(transcript)
            create_audio_journal_entry(
                user_id=user["id"],
                transcription_text=transcript,
                summary_text=summary,
            )
            send_message(sender, "Summary stored in Database.")

            response = transcript_file, summary

        except RuntimeError:
            logger.exception("Error summarizing transcript")
            response = "Summarization failed!"

    except RuntimeError:
        logger.exception("Error transcribing audio")
        response = "Transcription failed!"

    return response

