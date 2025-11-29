"""Audio journal table operations and data model.

This module defines the AudioJournalEntry data class and the AudioJournalTable class
for handling database interactions related to audio journal entries.
"""

import sqlite3
from dataclasses import dataclass
from datetime import datetime


@dataclass
class AudioJournalEntry:
    """Audio journal entry data model."""

    id: int
    user_id: int
    transcription_text: str | None
    summary_text: str | None
    created_at: datetime


class AudioJournalTable:
    """Handles database operations for the audio_journal_entries table."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        """Initialize the AudioJournalTable with a database connection."""
        self._conn = conn

    def get(self, entry_id: int) -> AudioJournalEntry | None:
        """Retrieve an audio journal entry by its ID."""
        row = self._conn.execute(
            "SELECT * FROM audio_journal_entries WHERE id = ?",
            (entry_id,),
        ).fetchone()
        return self._row_to_model(row) if row else None

    def get_by_user(self, user_id: int) -> list[AudioJournalEntry]:
        """Retrieve all audio journal entries for a user."""
        rows = self._conn.execute(
            """
            SELECT * FROM audio_journal_entries
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        ).fetchall()
        return [self._row_to_model(row) for row in rows]

    def get_all(self) -> list[AudioJournalEntry]:
        """Retrieve all audio journal entries."""
        rows = self._conn.execute(
            "SELECT * FROM audio_journal_entries ORDER BY created_at DESC"
        ).fetchall()
        return [self._row_to_model(row) for row in rows]

    def create(self, user_id: int, transcription_text: str, summary_text: str) -> None:
        """Create a new audio journal entry."""
        self._conn.execute(
            """
            INSERT INTO audio_journal_entries (user_id, transcription_text, summary_text)
            VALUES (?, ?, ?)
            """,
            (user_id, transcription_text, summary_text),
        )

    def update(self, entry_id: int, transcription_text: str, summary_text: str) -> None:
        """Update an existing audio journal entry."""
        self._conn.execute(
            """
            UPDATE audio_journal_entries
            SET transcription_text = ?, summary_text = ?
            WHERE id = ?
            """,
            (transcription_text, summary_text, entry_id),
        )

    def delete(self, entry_id: int) -> None:
        """Delete an audio journal entry."""
        self._conn.execute("DELETE FROM audio_journal_entries WHERE id = ?", (entry_id,))

    def _row_to_model(self, row: sqlite3.Row) -> AudioJournalEntry:
        """Convert a SQLite row to an AudioJournalEntry model."""
        return AudioJournalEntry(**dict(row))
