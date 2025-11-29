from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
import sqlite3

@dataclass
class AudioJournalEntry:
    id: int
    user_id: int
    transcription_text: Optional[str]
    summary_text: Optional[str]
    created_at: datetime

class AudioJournalTable:
    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn

    def get(self, entry_id: int) -> Optional[AudioJournalEntry]:
        row = self._conn.execute(
            "SELECT * FROM audio_journal_entries WHERE id = ?", 
            (entry_id,)
        ).fetchone()
        return self._row_to_model(row) if row else None

    def get_by_user(self, user_id: int) -> List[AudioJournalEntry]:
        rows = self._conn.execute(
            """
            SELECT * FROM audio_journal_entries 
            WHERE user_id = ? 
            ORDER BY created_at DESC
            """,
            (user_id,)
        ).fetchall()
        return [self._row_to_model(row) for row in rows]

    def get_all(self) -> List[AudioJournalEntry]:
        rows = self._conn.execute(
            "SELECT * FROM audio_journal_entries ORDER BY created_at DESC"
        ).fetchall()
        return [self._row_to_model(row) for row in rows]

    def create(self, user_id: int, transcription_text: str, summary_text: str) -> None:
        # Note: Original implementation didn't return the created entry, keeping consistent
        self._conn.execute(
            """
            INSERT INTO audio_journal_entries (user_id, transcription_text, summary_text)
            VALUES (?, ?, ?)
            """,
            (user_id, transcription_text, summary_text)
        )

    def update(self, entry_id: int, transcription_text: str, summary_text: str) -> None:
        self._conn.execute(
            """
            UPDATE audio_journal_entries
            SET transcription_text = ?, summary_text = ?
            WHERE id = ?
            """,
            (transcription_text, summary_text, entry_id)
        )

    def delete(self, entry_id: int) -> None:
        self._conn.execute("DELETE FROM audio_journal_entries WHERE id = ?", (entry_id,))

    def _row_to_model(self, row: sqlite3.Row) -> AudioJournalEntry:
        return AudioJournalEntry(**dict(row))
