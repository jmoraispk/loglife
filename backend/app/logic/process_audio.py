"""Audio processing workflow for inbound WhatsApp messages."""

from app.helpers import send_whatsapp_message, transcribe_audio, summarize_transcript


def process_audio(sender: str, audio_data: str) -> str:
    """Processes an incoming audio message from a user.

    Arguments:
    sender -- The WhatsApp phone number of the sender
    audio_data -- Base64 encoded audio payload

    Returns the summarized text generated from the audio.
    """
    send_whatsapp_message(sender, "Audio received. Transcribing...")
    transcript = transcribe_audio(audio_data)
    send_whatsapp_message(sender, "Audio transcribed. Summarizing...")
    summary = summarize_transcript(transcript)
    # store in database...
    send_whatsapp_message(sender, "Summary stored in Database.")

    return summary
