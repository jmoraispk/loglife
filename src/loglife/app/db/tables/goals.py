"""Goal table operations and data model.

This module defines the Goal data class and the GoalsTable class for handling
database interactions related to user goals.
"""

import sqlite3
from dataclasses import dataclass
from datetime import UTC, datetime, time


@dataclass
class Goal:
    """Goal data model."""

    id: int
    user_id: int
    goal_emoji: str
    goal_description: str
    boost_level: int
    created_at: datetime
    reminder_time: time | None


class GoalsTable:
    """Handles database operations for the user_goals table."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        """Initialize the GoalsTable with a database connection."""
        self._conn = conn

    def get(self, goal_id: int) -> Goal | None:
        """Retrieve a goal by its ID."""
        query = "SELECT * FROM user_goals WHERE id = ?"
        row = self._conn.execute(query, (goal_id,)).fetchone()
        return self._row_to_model(row) if row else None

    def get_by_user(self, user_id: int) -> list[Goal]:
        """Retrieve all goals for a user."""
        query = "SELECT * FROM user_goals WHERE user_id = ? ORDER BY created_at ASC"
        rows = self._conn.execute(query, (user_id,)).fetchall()
        return [self._row_to_model(row) for row in rows]

    def get_all_with_reminders(self) -> list[Goal]:
        """Retrieve all goals that have a reminder set."""
        query = "SELECT * FROM user_goals WHERE reminder_time IS NOT NULL"
        rows = self._conn.execute(query).fetchall()
        return [self._row_to_model(row) for row in rows]

    def create(
        self,
        user_id: int,
        goal_emoji: str,
        goal_description: str,
        boost_level: int = 1,
    ) -> Goal:
        """Create a new goal record."""
        query = """
            INSERT INTO user_goals(user_id, goal_emoji, goal_description, boost_level)
            VALUES (?, ?, ?, ?)
        """
        cursor = self._conn.execute(query, (user_id, goal_emoji, goal_description, boost_level))
        return self.get(cursor.lastrowid)

    def update(
        self,
        goal_id: int,
        goal_emoji: str | None = None,
        goal_description: str | None = None,
        boost_level: int | None = None,
        reminder_time: str | None = None,
    ) -> Goal | None:
        """Update a goal record with provided fields."""
        updates = []
        params = []

        if goal_emoji is not None:
            updates.append("goal_emoji = ?")
            params.append(goal_emoji)

        if goal_description is not None:
            updates.append("goal_description = ?")
            params.append(goal_description)

        if boost_level is not None:
            updates.append("boost_level = ?")
            params.append(boost_level)

        if reminder_time is not None:
            updates.append("reminder_time = ?")
            params.append(reminder_time)

        if not updates:
            return self.get(goal_id)

        params.append(goal_id)
        query = f"UPDATE user_goals SET {', '.join(updates)} WHERE id = ?"
        self._conn.execute(query, params)

        return self.get(goal_id)

    def delete(self, goal_id: int) -> None:
        """Delete a goal record."""
        query = "DELETE FROM user_goals WHERE id = ?"
        self._conn.execute(query, (goal_id,))

    def _row_to_model(self, row: sqlite3.Row) -> Goal:
        """Convert a SQLite row to a Goal model."""
        data = dict(row)

        # Convert created_at from string to datetime
        if isinstance(data["created_at"], str):
            data["created_at"] = datetime.strptime(
                data["created_at"],
                "%Y-%m-%d %H:%M:%S",
            ).replace(tzinfo=UTC)

        # Convert reminder_time from string to time
        if isinstance(data.get("reminder_time"), str):
            # Expected format is HH:MM:SS
            try:
                dt = datetime.strptime(data["reminder_time"], "%H:%M:%S")  # noqa: DTZ007
                data["reminder_time"] = dt.time()
            except ValueError:
                # Fallback or handle parsing error if format is different
                data["reminder_time"] = None

        return Goal(**data)
