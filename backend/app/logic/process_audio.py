"""Audio processing workflow for inbound WhatsApp messages."""

import logging
from app.helpers import get_journal_goal_id, process_journal, transcribe_audio, send_message
from .process_text import process_text

def process_audio(sender: str, user: dict, audio_data: str) -> str:
    """Processes an incoming audio message from a user.

    Arguments:
    sender -- The WhatsApp phone number of the sender
    audio_data -- Base64 encoded audio payload

    Returns the summarized text generated from the audio.
    """

    send_message(sender, "Audio received. Transcribing...")
    
    # Check if journaling enabled
    response = None
    journaling_goal_id: int | None = get_journal_goal_id(user["id"])
    if journaling_goal_id:
        response = process_journal(sender, user, journaling_goal_id, audio_data)
    
    # Transcribe audio if journaling isn't enabled, time not reached for journaling or journlaing already done for that day
    if response is None:
        try:
            transcript: str = transcribe_audio(audio_data)
            logging.debug(f"Transcript: {transcript}")
            response = process_text(user, transcript)
        except RuntimeError as e:
            logging.error(f"Error transcribing audio: {e}")
            response = "Transcription failed!"

    return response