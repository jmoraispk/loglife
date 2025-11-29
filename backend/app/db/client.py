import sqlite3
from pathlib import Path

from app.config import DATABASE_FILE
from app.db.tables.users import UsersTable
from app.db.tables.goals import GoalsTable
from app.db.tables.ratings import RatingsTable
from app.db.tables.reminders import RemindersTable
from app.db.tables.user_states import UserStatesTable
from app.db.tables.audio_journal import AudioJournalTable
from app.db.tables.referrals import ReferralsTable

class Database:
    """Main database client that provides access to tables."""
    
    def __init__(self, db_path: Path = DATABASE_FILE):
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
        return UsersTable(self.conn)

    @property
    def goals(self) -> GoalsTable:
        return GoalsTable(self.conn)

    @property
    def ratings(self) -> RatingsTable:
        return RatingsTable(self.conn)

    @property
    def reminders(self) -> RemindersTable:
        return RemindersTable(self.conn)

    @property
    def user_states(self) -> UserStatesTable:
        return UserStatesTable(self.conn)

    @property
    def audio_journal(self) -> AudioJournalTable:
        return AudioJournalTable(self.conn)

    @property
    def referrals(self) -> ReferralsTable:
        return ReferralsTable(self.conn)

    def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

# Singleton instance for easy import
db = Database()
