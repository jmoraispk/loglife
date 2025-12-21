"""User table operations and data model.

This module defines the User data class and the UsersTable class for handling
database interactions related to users.
"""

import sqlite3
from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass
class User:
    """User data model representing a row in the users table."""

    id: int
    phone_number: str
    timezone: str
    created_at: datetime
    send_transcript_file: int  # 0 or 1
    client_type: str
    state: str | None
    state_data: str | None
    referred_by_id: int | None


class UsersTable:
    """Handles database operations for the users table."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        """Initialize the UsersTable with a database connection."""
        self._conn = conn

    def get(self, user_id: int) -> User | None:
        """Retrieve a user by their ID."""
        query = "SELECT * FROM users WHERE id = ?"
        row = self._conn.execute(query, (user_id,)).fetchone()

        if row:
            return self._row_to_model(row)
        return None

    def get_by_phone(self, phone_number: str) -> User | None:
        """Retrieve a user by their phone number."""
        query = "SELECT * FROM users WHERE phone_number = ?"
        row = self._conn.execute(query, (phone_number,)).fetchone()

        if row:
            return self._row_to_model(row)
        return None

    def get_all(self) -> list[User]:
        """Retrieve all users."""
        query = "SELECT * FROM users"
        rows = self._conn.execute(query).fetchall()
        return [self._row_to_model(row) for row in rows]

    def create(
        self,
        phone_number: str,
        timezone: str,
        referred_by_id: int | None = None,
        client_type: str = "whatsapp",
    ) -> User:
        """Create a new user record."""
        query = (
            "INSERT INTO users (phone_number, timezone, referred_by_id, client_type) "
            "VALUES (?, ?, ?, ?)"
        )
        cursor = self._conn.execute(query, (phone_number, timezone, referred_by_id, client_type))
        # We need to fetch the created user to return the full model with ID and timestamps
        # The result of get() will not be None here because we just inserted it.
        return self.get(cursor.lastrowid)  # type: ignore[arg-type]

    def update(
        self,
        user_id: int,
        phone_number: str | None = None,
        timezone: str | None = None,
        send_transcript_file: int | None = None,
        referred_by_id: int | None = None,
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

        if referred_by_id is not None:
            updates.append("referred_by_id = ?")
            params.append(referred_by_id)

        if not updates:
            return self.get(user_id)

        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        self._conn.execute(query, params)

        return self.get(user_id)

    def set_state(self, user_id: int, state: str | None, state_data: str | None = None) -> None:
        """Update the user's conversational state."""
        query = "UPDATE users SET state = ?, state_data = ? WHERE id = ?"
        self._conn.execute(query, (state, state_data, user_id))

    def delete(self, user_id: int) -> None:
        """Delete a user record."""
        query = "DELETE FROM users WHERE id = ?"
        self._conn.execute(query, (user_id,))

    def _row_to_model(self, row: sqlite3.Row) -> User:
        """Convert a SQLite row to a User model."""
        data = dict(row)

        # Convert created_at from string to datetime
        if isinstance(data["created_at"], str):
            try:
                data["created_at"] = datetime.fromisoformat(data["created_at"]).replace(tzinfo=UTC)
            except ValueError:
                # Handle legacy or potential non-iso formats if necessary
                # For now assuming standard sqlite datetime/timestamp format "YYYY-MM-DD HH:MM:SS"
                data["created_at"] = datetime.strptime(
                    data["created_at"],
                    "%Y-%m-%d %H:%M:%S",
                ).replace(tzinfo=UTC)

        # Handle missing client_type for older records if any
        # (though schema default handles new ones)
        if "client_type" not in data:
            data["client_type"] = "whatsapp"

        return User(**data)
