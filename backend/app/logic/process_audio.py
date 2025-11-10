"""Audio message processing utilities.

This module handles incoming audio payloads from messaging platforms,
including decoding and temporary persistence for downstream processing.
"""

import logging
from typing import Any

from app.helpers.api.whatsapp_api import send_whatsapp_message
from app.logic.helpers.transcribe_audio import transcribe_audio
from app.logic.helpers.summarize_transcript import summarize_transcript
from app.db.data_access.audio_journal import create_audio_journal_entry


def process_audio(sender: str, audio_data: dict[str, Any]) -> str:
    """Process an incoming audio payload for a user.

    Currently, the audio is persisted to disk for debugging/processing and a
    placeholder response is returned until full transcription workflow is
    implemented.
    """

    transcript_text = ""
    summary_text = ""

    try:
        # send a whatsapp message here through api to sender that Audio received. Transcribing...
        send_whatsapp_message(sender, "Audio received. Transcribing...")
        transcript = transcribe_audio(audio_data)
        transcript_text = (transcript.get("text") or "").strip()

        if not transcript_text:
            send_whatsapp_message(sender, "Transcription completed, but no text was returned.")
            return "Transcription completed, but no text was returned."

        send_whatsapp_message(sender, "Audio transcribed. Summarizing...")
        summary_text = summarize_transcript(transcript_text).strip()

        create_audio_journal_entry(sender, transcript_text, summary_text)
        send_whatsapp_message(sender, "Summary stored in Database.")

    except Exception as exc:  # pylint: disable=broad-except
        logging.error("[BACKEND] Failed to save audio file: %s", exc)
        send_whatsapp_message(sender, "Sorry, something went wrong while processing your audio.")
        return "Audio processing failed."

    return f"Summary:\n{summary_text}"