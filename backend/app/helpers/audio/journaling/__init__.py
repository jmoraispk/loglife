"""Audio journaling processing module."""

import logging
from datetime import UTC, datetime

from app.db import (
    create_audio_journal_entry,
    get_goal_reminder_by_goal_id,
    get_user,
    get_user_audio_journal_entries,
)
from app.helpers.audio.transcribe_audio import transcribe_audio
from app.helpers.sender import send_message
from app.helpers.services.reminder import get_timezone_safe

from .get_journal_goal_id import get_journal_goal_id
from .summarize_transcript import summarize_transcript
from .transcript_to_base64 import transcript_to_base64

logger = logging.getLogger(__name__)


def process_journal(
    sender: str, user: dict, audio_data: str, now: datetime | None = None
) -> str | tuple[str, str]:
    """Process an audio journal entry for a user.

    Args:
        sender: The phone number of the sender
        user: The user dictionary
        audio_data: Base64 encoded audio data
        now: Optional datetime for testing

    Returns:
        Either a response string or tuple of (transcript_file, summary)

    """
    response = None
    journaling_goal_id: int | None = get_journal_goal_id(user["id"])
    if not journaling_goal_id:
        return response
    journal_goal_reminder: dict = get_goal_reminder_by_goal_id(journaling_goal_id)
    reminder_time_str: str = journal_goal_reminder["reminder_time"]
    reminder_time = datetime.strptime(
        reminder_time_str, "%H:%M:%S"
    ).replace(tzinfo=UTC).time()
    user_timezone: str = get_user(user["id"])["timezone"]
    tz = get_timezone_safe(user_timezone)
    now_utc: datetime = now if now else datetime.now(UTC)
    local_now: datetime = now_utc.astimezone(tz).replace(
        second=0,
        microsecond=0,
    )  # current time in user's timezone
    if reminder_time <= local_now.time():
        # Store in database (update if exists, create if not)
        today = local_now.strftime("%Y-%m-%d")
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
