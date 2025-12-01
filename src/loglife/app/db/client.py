"""Database client module."""

import sqlite3
from pathlib import Path

from loglife.app.config import DATABASE_FILE
from loglife.app.db.tables import (
    AudioJournalTable,
    GoalsTable,
    RatingsTable,
    ReferralsTable,
    UsersTable,
)


class Database:
    """Main database client that provides access to tables."""

    def __init__(self, db_path: Path = DATABASE_FILE) -> None:
        """Initialize the database client.

        Arguments:
            db_path: Path to the SQLite database file.

        """
        self.db_path = db_path
        self._conn: sqlite3.Connection | None = None

    @property
    def conn(self) -> sqlite3.Connection:
        """Lazy loading of the database connection."""
        if self._conn is None:
            self._conn = sqlite3.connect(self.db_path)
            self._conn.row_factory = sqlite3.Row
            # Enforce foreign keys
            self._conn.execute("PRAGMA foreign_keys = ON")
        return self._conn

    @property
    def users(self) -> UsersTable:
        """Get the users table accessor."""
        return UsersTable(self.conn)

    @property
    def goals(self) -> GoalsTable:
        """Get the goals table accessor."""
        return GoalsTable(self.conn)

    @property
    def ratings(self) -> RatingsTable:
        """Get the ratings table accessor."""
        return RatingsTable(self.conn)

    @property
    def audio_journal(self) -> AudioJournalTable:
        """Get the audio_journal table accessor."""
        return AudioJournalTable(self.conn)

    @property
    def referrals(self) -> ReferralsTable:
        """Get the referrals table accessor."""
        return ReferralsTable(self.conn)

    def set_connection(self, conn: sqlite3.Connection) -> None:
        """Set the database connection explicitly (useful for testing)."""
        self._conn = conn

    def clear_connection(self) -> None:
        """Clear the database connection reference without closing it."""
        self._conn = None

    def close(self) -> None:
        """Close the database connection if it exists."""
        if self._conn:
            self._conn.close()
            self._conn = None

    def __enter__(self) -> "Database":
        """Enter the context manager."""
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: object,
    ) -> None:
        """Exit the context manager and close the connection."""
        self.close()


# Singleton instance for easy import
db = Database()
