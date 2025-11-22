"""Database operations for audio journal entries.

This module provides CRUD operations for managing audio journal entries in the database.
It handles creating, reading, updating, and deleting audio journal entry records.
"""

import sqlite3
from app.db import connect


def get_all_audio_journal_entries() -> list[dict]:
    """Retrieves all audio journal entries from the database.

    Returns a list of all audio journal entry records ordered by creation date (newest first).
    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM audio_journal_entries ORDER BY created_at DESC"
        )
        rows: list[sqlite3.Row] = cur.fetchall()
        return [dict(row) for row in rows]


def get_audio_journal_entry(entry_id: int) -> dict | None:
    """Retrieves an audio journal entry by its ID.

    Arguments:
    entry_id -- The unique identifier of the entry to retrieve

    Returns the entry record as a dictionary, or None if not found.
    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM audio_journal_entries WHERE id = ?",
            (entry_id,),
        )
        row: sqlite3.Row | None = cur.fetchone()
        return dict(row) if row else None


def get_user_audio_journal_entries(user_id: int) -> list[dict]:
    """Retrieves all audio journal entries for a specific user.

    Arguments:
    user_id -- The unique identifier of the user

    Returns a list of audio journal entry records for the user ordered by creation date (newest first).
    """
    with connect() as conn:
        cur = conn.execute(
            """
            SELECT * FROM audio_journal_entries 
            WHERE user_id = ? 
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows: list[sqlite3.Row] = cur.fetchall()
        return [dict(row) for row in rows]


def create_audio_journal_entry(
    user_id: int, transcription_text: str, summary_text: str
):
    """Creates a new audio journal entry record.

    Arguments:
    user_id -- The unique identifier of the user
    transcription_text -- The transcribed text from the audio
    summary_text -- The summarized version of the transcription
    """
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO audio_journal_entries (
                user_id,
                transcription_text,
                summary_text
            )
            VALUES (?, ?, ?)
            """,
            (user_id, transcription_text, summary_text),
        )


def delete_audio_journal_entry(entry_id: int):
    """Deletes an audio journal entry record from the database.

    Arguments:
    entry_id -- The unique identifier of the entry to delete
    """
    with connect() as conn:
        conn.execute("DELETE FROM audio_journal_entries WHERE id = ?", (entry_id,))
