"""Audio processing workflow for inbound WhatsApp messages."""

from app.helpers import send_whatsapp_message, transcribe_audio, summarize_transcript, transcript_to_base64
from app.db import create_goal, get_user_goals, create_audio_journal_entry, create_goal_reminder, get_user_audio_journal_entries, update_audio_journal_entry
from datetime import datetime
import logging


def process_audio(sender: str, user: dict, audio_data: str) -> str:
    """Processes an incoming audio message from a user.

    Arguments:
    sender -- The WhatsApp phone number of the sender
    audio_data -- Base64 encoded audio payload

    Returns the summarized text generated from the audio.
    """
    # Check if journaling goal exists
    user_goals: list[dict] = get_user_goals(user["id"])
    has_journaling = False
    for goal in user_goals:
        if goal["goal_emoji"] == "📓" and goal["goal_description"] == "journaling":
            has_journaling = True
            break
    if not has_journaling:
        new_goal: dict = create_goal(user["id"], "📓", "journaling")
        # Set default reminder time to 7 PM
        create_goal_reminder(
            user_id=user["id"], 
            user_goal_id=new_goal["id"], 
            reminder_time="19:00:00"
        )
        send_whatsapp_message(sender, "Journaling enabled automatically with 7 PM reminder!")

    try:
        send_whatsapp_message(sender, "Audio received. Transcribing...")
    except RuntimeError as e:
        logging.error(f"Error transcribing audio: {e}")
        return "Transcription failed!"

    transcript: str = transcribe_audio(audio_data)

    transcript_file: str = transcript_to_base64(transcript)

    send_whatsapp_message(sender, "Audio transcribed. Summarizing...")
    
    try:
        summary: str = summarize_transcript(transcript)
    except RuntimeError as e:
        logging.error(f"Error summarizing transcript: {e}")
        return "Summarization failed!"

    # Store in database (update if exists, create if not)
    today = datetime.now().strftime("%Y-%m-%d")
    user_entries: list[dict] = get_user_audio_journal_entries(user["id"])

    # Find today's entry
    existing_entry = None
    for entry in user_entries:
        entry_date = entry["created_at"][:10]  # Extract YYYY-MM-DD from datetime
        if entry_date == today:
            existing_entry = entry
            break
    if existing_entry:
        update_audio_journal_entry(
            existing_entry["id"], 
            transcription_text=transcript, 
            summary_text=summary
        )
        send_whatsapp_message(sender, "Summary updated in Database.")
    else:
        create_audio_journal_entry(
            user_id=user["id"], transcription_text=transcript, summary_text=summary
        )
        send_whatsapp_message(sender, "Summary stored in Database.")

    return transcript_file, summary
