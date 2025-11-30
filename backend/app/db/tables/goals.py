"""Goal table operations and data model.

This module defines the Goal data class and the GoalsTable class for handling
database interactions related to user goals.
"""

import sqlite3
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Goal:
    """Goal data model."""

    id: int
    user_id: int
    goal_emoji: str
    goal_description: str
    boost_level: int
    created_at: datetime


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
        query = "SELECT * FROM user_goals WHERE user_id = ? ORDER BY created_at DESC"
        rows = self._conn.execute(query, (user_id,)).fetchall()
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
        return self.get(cursor.lastrowid)  # type: ignore[arg-type]

    def update(
        self,
        goal_id: int,
        goal_emoji: str | None = None,
        goal_description: str | None = None,
        boost_level: int | None = None,
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

        if not updates:
            return self.get(goal_id)

        params.append(goal_id)
        # noqa: S608 - Safe usage (whitelist construction)
        query = f"UPDATE user_goals SET {', '.join(updates)} WHERE id = ?"  # noqa: S608
        self._conn.execute(query, params)

        return self.get(goal_id)

    def delete(self, goal_id: int) -> None:
        """Delete a goal record."""
        query = "DELETE FROM user_goals WHERE id = ?"
        self._conn.execute(query, (goal_id,))

    def _row_to_model(self, row: sqlite3.Row) -> Goal:
        """Convert a SQLite row to a Goal model."""
        return Goal(**dict(row))
