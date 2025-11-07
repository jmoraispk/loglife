"""Data access helpers for audio journal entries."""

from typing import Optional

from app.db.sqlite import execute_query
from app.db.data_access.user import get_or_create_user


def create_audio_journal_entry(
    user_phone: str,
    transcription_text: str,
    summary_text: Optional[str] = None,
) -> int:
    """Persist an audio journal entry for the user and return the new row ID."""

    user_id = get_or_create_user(user_phone)
    cursor = execute_query(
        """
        INSERT INTO audio_journal_entries (user_id, transcription_text, summary_text)
        VALUES (?, ?, ?)
        """,
        (user_id, transcription_text, summary_text),
    )
    return cursor.lastrowid


