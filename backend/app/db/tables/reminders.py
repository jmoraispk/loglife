"""Reminder table operations and data model.

This module defines the Reminder data class and the RemindersTable class for handling
database interactions related to goal reminders.
"""

import sqlite3
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Reminder:
    """Reminder data model."""

    id: int
    user_id: int
    user_goal_id: int
    reminder_time: datetime
    created_at: datetime


class RemindersTable:
    """Handles database operations for the goal_reminders table."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        """Initialize the RemindersTable with a database connection."""
        self._conn = conn

    def get(self, reminder_id: int) -> Reminder | None:
        """Retrieve a reminder by its ID."""
        query = "SELECT * FROM goal_reminders WHERE id = ?"
        row = self._conn.execute(query, (reminder_id,)).fetchone()
        return self._row_to_model(row) if row else None

    def get_by_goal_id(self, user_goal_id: int) -> Reminder | None:
        """Retrieve a reminder for a specific goal."""
        query = "SELECT * FROM goal_reminders WHERE user_goal_id = ?"
        row = self._conn.execute(query, (user_goal_id,)).fetchone()
        return self._row_to_model(row) if row else None

    def get_all(self) -> list[Reminder]:
        """Retrieve all reminders."""
        query = "SELECT * FROM goal_reminders ORDER BY created_at DESC"
        rows = self._conn.execute(query).fetchall()
        return [self._row_to_model(row) for row in rows]

    def create(self, user_id: int, user_goal_id: int, reminder_time: str) -> Reminder:
        """Create a new reminder record."""
        query = """
            INSERT INTO goal_reminders (user_id, user_goal_id, reminder_time)
            VALUES (?, ?, ?)
        """
        cursor = self._conn.execute(query, (user_id, user_goal_id, reminder_time))
        return self.get(cursor.lastrowid)  # type: ignore[arg-type]

    def update(
        self,
        reminder_id: int,
        user_goal_id: int | None = None,
        reminder_time: str | None = None,
    ) -> Reminder | None:
        """Update a reminder record with provided fields."""
        updates = []
        params = []

        if user_goal_id is not None:
            updates.append("user_goal_id = ?")
            params.append(user_goal_id)

        if reminder_time is not None:
            updates.append("reminder_time = ?")
            params.append(reminder_time)

        if not updates:
            return self.get(reminder_id)

        params.append(reminder_id)
        # noqa: S608 - Safe usage (whitelist construction)
        query = f"UPDATE goal_reminders SET {', '.join(updates)} WHERE id = ?"  # noqa: S608
        self._conn.execute(query, params)

        return self.get(reminder_id)

    def delete(self, reminder_id: int) -> None:
        """Delete a reminder record."""
        query = "DELETE FROM goal_reminders WHERE id = ?"
        self._conn.execute(query, (reminder_id,))

    def _row_to_model(self, row: sqlite3.Row) -> Reminder:
        """Convert a SQLite row to a Reminder model."""
        return Reminder(**dict(row))
