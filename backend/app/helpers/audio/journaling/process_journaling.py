from app.helpers.api import send_whatsapp_message
from app.helpers.services.reminder import get_timezone_safe
from .transcribe_audio import transcribe_audio
from .summarize_transcript import summarize_transcript
from .transcript_to_base64 import transcript_to_base64
from app.db import create_audio_journal_entry, get_user_audio_journal_entries, get_goal_reminder_by_goal_id, get_user
from datetime import datetime, time, timezone
from zoneinfo import ZoneInfo
import logging


def process_journal(sender: str, user: dict, journaling_goal_id: int, audio_data: str) -> str | tuple[str, str]:
    response = None
    journal_goal_reminder: dict = get_goal_reminder_by_goal_id(journaling_goal_id)
    reminder_time_str: str = journal_goal_reminder["reminder_time"]
    reminder_time: time = datetime.strptime(reminder_time_str, "%H:%M:%S").time()
    user_timezone: str = get_user(user["id"])["timezone"]
    tz: ZoneInfo = get_timezone_safe(user_timezone)
    now_utc: datetime = datetime.now(timezone.utc)
    local_now: datetime = now_utc.astimezone(tz).replace(
        second=0, microsecond=0
    )  # current time in user's timezone
    if reminder_time <= local_now.time():
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
        if not existing_entry:
            try:
                transcript: str = transcribe_audio(audio_data)
                transcript_file: str = transcript_to_base64(transcript)

                send_whatsapp_message(sender, "Audio transcribed. Summarizing...")
                
                try:
                    summary: str = summarize_transcript(transcript)
                    create_audio_journal_entry(
                        user_id=user["id"], transcription_text=transcript, summary_text=summary
                    )
                    send_whatsapp_message(sender, "Summary stored in Database.")

                    response = transcript_file, summary
                    
                except RuntimeError as e:
                    logging.error(f"Error summarizing transcript: {e}")
                    response = "Summarization failed!"
                    
            except RuntimeError as e:
                logging.error(f"Error transcribing audio: {e}")
                response = "Transcription failed!"
    
    return response