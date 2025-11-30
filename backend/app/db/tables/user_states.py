"""User state table operations and data model.

This module defines the UserState data class and the UserStatesTable class for handling
database interactions related to user conversation states.
"""

import sqlite3
from dataclasses import dataclass
from datetime import datetime


@dataclass
class UserState:
    """User state data model."""

    user_id: int
    state: str
    temp_data: str | None
    created_at: datetime


class UserStatesTable:
    """Handles database operations for the user_states table."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        """Initialize the UserStatesTable with a database connection."""
        self._conn = conn

    def get(self, user_id: int) -> UserState | None:
        """Retrieve a user state by user ID."""
        query = "SELECT * FROM user_states WHERE user_id = ?"
        row = self._conn.execute(query, (user_id,)).fetchone()
        return self._row_to_model(row) if row else None

    def create(
        self, user_id: int, state: str, temp_data: str | None = None
    ) -> UserState:
        """Create or update a user state record."""
        query = """
            INSERT INTO user_states (user_id, state, temp_data)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                state = excluded.state,
                temp_data = excluded.temp_data,
                created_at = CURRENT_TIMESTAMP
        """
        self._conn.execute(query, (user_id, state, temp_data))
        return self.get(user_id)  # type: ignore[arg-type]

    def update(
        self, user_id: int, state: str | None = None, temp_data: str | None = None
    ) -> UserState | None:
        """Update a user state record with provided fields."""
        updates = []
        params = []

        if state is not None:
            updates.append("state = ?")
            params.append(state)

        if temp_data is not None:
            updates.append("temp_data = ?")
            params.append(temp_data)

        if not updates:
            return self.get(user_id)

        params.append(user_id)
        # noqa: S608 - Safe usage (whitelist construction)
        query = f"UPDATE user_states SET {', '.join(updates)} WHERE user_id = ?"  # noqa: S608
        self._conn.execute(query, params)

        return self.get(user_id)

    def delete(self, user_id: int) -> None:
        """Delete a user state record."""
        query = "DELETE FROM user_states WHERE user_id = ?"
        self._conn.execute(query, (user_id,))

    def _row_to_model(self, row: sqlite3.Row) -> UserState:
        """Convert a SQLite row to a UserState model."""
        return UserState(**dict(row))
