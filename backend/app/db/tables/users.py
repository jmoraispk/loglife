from datetime import datetime
import sqlite3
from typing import Optional

from app.db.rows import User

class UsersTable:
    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn

    def get(self, user_id: int) -> Optional[User]:
        row = self._conn.execute(
            "SELECT * FROM users WHERE id = ?", 
            (user_id,)
        ).fetchone()
        
        if row:
            return self._row_to_model(row)
        return None

    def get_by_phone(self, phone_number: str) -> Optional[User]:
        row = self._conn.execute(
            "SELECT * FROM users WHERE phone_number = ?", 
            (phone_number,)
        ).fetchone()
        
        if row:
            return self._row_to_model(row)
        return None

    def create(self, phone_number: str, timezone: str) -> User:
        cursor = self._conn.execute(
            "INSERT INTO users (phone_number, timezone) VALUES (?, ?)",
            (phone_number, timezone)
        )
        # We need to fetch the created user to return the full model with ID and timestamps
        return self.get(cursor.lastrowid)

    def _row_to_model(self, row: sqlite3.Row) -> User:
        # Helper to convert sqlite3.Row to User model
        data = dict(row)
        return User(**data)
