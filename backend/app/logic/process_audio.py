"""Audio processing workflow for inbound WhatsApp messages."""

from app.helpers import send_whatsapp_message, transcribe_audio, summarize_transcript
from app.db import create_audio_journal_entry
import logging


def process_audio(sender: str, user: dict, audio_data: str) -> str:
    """Processes an incoming audio message from a user.

    Arguments:
    sender -- The WhatsApp phone number of the sender
    audio_data -- Base64 encoded audio payload

    Returns the summarized text generated from the audio.
    """
    try:
        send_whatsapp_message(sender, "Audio received. Transcribing...")
    except RuntimeError as e:
        logging.error(f"Error transcribing audio: {e}")
        return "Transcription failed!"
    transcript: str = transcribe_audio(audio_data)
    send_whatsapp_message(sender, "Audio transcribed. Summarizing...")
    try:
        summary: str = summarize_transcript(transcript)
    except RuntimeError as e:
        logging.error(f"Error summarizing transcript: {e}")
        return "Summarization failed!"

    # Store in database
    create_audio_journal_entry(
        user_id=user["id"], transcription_text=transcript, summary_text=summary
    )
    send_whatsapp_message(sender, "Summary stored in Database.")

    return summary
