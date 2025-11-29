"""User table operations and data model.

This module defines the User data class and the UsersTable class for handling
database interactions related to users.
"""

import sqlite3
from dataclasses import dataclass
from datetime import datetime


@dataclass
class User:
    """User data model representing a row in the users table."""

    id: int
    phone_number: str
    timezone: str
    created_at: datetime
    send_transcript_file: int  # 0 or 1


class UsersTable:
    """Handles database operations for the users table."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        """Initialize the UsersTable with a database connection."""
        self._conn = conn

    def get(self, user_id: int) -> User | None:
        """Retrieve a user by their ID."""
        row = self._conn.execute(
            "SELECT * FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

        if row:
            return self._row_to_model(row)
        return None

    def get_by_phone(self, phone_number: str) -> User | None:
        """Retrieve a user by their phone number."""
        row = self._conn.execute(
            "SELECT * FROM users WHERE phone_number = ?",
            (phone_number,),
        ).fetchone()

        if row:
            return self._row_to_model(row)
        return None

    def create(self, phone_number: str, timezone: str) -> User:
        """Create a new user record."""
        cursor = self._conn.execute(
            "INSERT INTO users (phone_number, timezone) VALUES (?, ?)",
            (phone_number, timezone),
        )
        # We need to fetch the created user to return the full model with ID and timestamps
        # The result of get() will not be None here because we just inserted it.
        return self.get(cursor.lastrowid)  # type: ignore[arg-type]

    def update(
        self,
        user_id: int,
        phone_number: str | None = None,
        timezone: str | None = None,
        send_transcript_file: int | None = None,
    ) -> User | None:
        """Update a user record with provided fields."""
        updates = []
        params = []

        if phone_number is not None:
            updates.append("phone_number = ?")
            params.append(phone_number)

        if timezone is not None:
            updates.append("timezone = ?")
            params.append(timezone)

        if send_transcript_file is not None:
            updates.append("send_transcript_file = ?")
            params.append(send_transcript_file)

        if not updates:
            return self.get(user_id)

        params.append(user_id)
        # noqa: S608 - Safe usage (whitelist construction)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"  # noqa: S608
        self._conn.execute(query, params)

        return self.get(user_id)

    def _row_to_model(self, row: sqlite3.Row) -> User:
        """Convert a SQLite row to a User model."""
        data = dict(row)
        return User(**data)
