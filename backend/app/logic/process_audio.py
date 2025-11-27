"""Audio processing workflow for inbound WhatsApp messages."""

import logging
from app.helpers import process_journal, transcribe_audio, send_message
from .process_text import process_text

def process_audio(sender: str, user: dict, audio_data: str) -> str:
    """Processes an incoming audio message from a user.

    Arguments:
    sender -- The WhatsApp phone number of the sender
    audio_data -- Base64 encoded audio payload

    Returns the summarized text generated from the audio.
    """

    send_message(sender, "Audio received. Transcribing...")
    
    response = process_journal(sender, user, audio_data)
    
    # Transcribe audio if journaling isn't processed by the following reasons:
    # - journaling not enabled
    # - time not reached for journaling
    # - journlaing already done for that day
    if response is None:
        try:
            transcript: str = transcribe_audio(audio_data)
            logging.debug(f"Transcript: {transcript}")
            response = process_text(user, transcript)
        except RuntimeError as e:
            logging.error(f"Error transcribing audio: {e}")
            response = "Audio transcription failed!"

    return response