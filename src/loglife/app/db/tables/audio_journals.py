"""Audio journal table operations and data model.

This module defines the AudioJournalEntry data class and the AudioJournalsTable class
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


class AudioJournalsTable:
    """Handles database operations for the audio_journals table."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        """Initialize the AudioJournalsTable with a database connection."""
        self._conn = conn

    def get(self, entry_id: int) -> AudioJournalEntry | None:
        """Retrieve an audio journal entry by its ID."""
        query = "SELECT * FROM audio_journals WHERE id = ?"
        row = self._conn.execute(query, (entry_id,)).fetchone()
        return self._row_to_model(row) if row else None

    def get_by_user(self, user_id: int) -> list[AudioJournalEntry]:
        """Retrieve all audio journal entries for a user."""
        query = """
            SELECT * FROM audio_journals
            WHERE user_id = ?
            ORDER BY created_at DESC
        """
        rows = self._conn.execute(query, (user_id,)).fetchall()
        return [self._row_to_model(row) for row in rows]

    def get_all(self) -> list[AudioJournalEntry]:
        """Retrieve all audio journal entries."""
        query = "SELECT * FROM audio_journals ORDER BY created_at DESC"
        rows = self._conn.execute(query).fetchall()
        return [self._row_to_model(row) for row in rows]

    def create(self, user_id: int, transcription_text: str, summary_text: str) -> None:
        """Create a new audio journal entry."""
        query = """
            INSERT INTO audio_journals (user_id, transcription_text, summary_text)
            VALUES (?, ?, ?)
        """
        self._conn.execute(query, (user_id, transcription_text, summary_text))

    def update(self, entry_id: int, transcription_text: str, summary_text: str) -> None:
        """Update an existing audio journal entry."""
        query = """
            UPDATE audio_journals
            SET transcription_text = ?, summary_text = ?
            WHERE id = ?
        """
        self._conn.execute(query, (transcription_text, summary_text, entry_id))

    def delete(self, entry_id: int) -> None:
        """Delete an audio journal entry."""
        query = "DELETE FROM audio_journals WHERE id = ?"
        self._conn.execute(query, (entry_id,))

    def _row_to_model(self, row: sqlite3.Row) -> AudioJournalEntry:
        """Convert a SQLite row to an AudioJournalEntry model."""
        return AudioJournalEntry(**dict(row))

