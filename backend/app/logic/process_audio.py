"""Audio processing workflow for inbound WhatsApp messages."""

import logging

from app.db import create_audio_journal_entry
from app.helpers import send_message
from app.helpers.audio.journaling.summarize_transcript import summarize_transcript
from app.helpers.audio.journaling.transcript_to_base64 import transcript_to_base64
from app.helpers.audio.transcribe_audio import transcribe_audio

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

    try:
        transcript: str = transcribe_audio(audio_data)
    except RuntimeError:
        logger.exception("Error transcribing audio")
        return "Transcription failed!"

    send_message(sender, "Audio transcribed. Summarizing...")

    try:
        summary: str = summarize_transcript(transcript)
    except RuntimeError:
        logger.exception("Error summarizing transcript")
        return "Summarization failed!"

    create_audio_journal_entry(
        user_id=user["id"],
        transcription_text=transcript,
        summary_text=summary,
    )
    send_message(sender, "Summary stored in Database.")

    if user.get("send_transcript_file"):
        transcript_file: str = transcript_to_base64(transcript)
        return transcript_file, summary

    return summary
