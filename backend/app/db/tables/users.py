from dataclasses import dataclass
from datetime import datetime
import sqlite3
from typing import Optional

@dataclass
class User:
    id: int
    phone_number: str
    timezone: str
    created_at: datetime
    send_transcript_file: int  # 0 or 1

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
        
    def update(self, user_id: int, phone_number: Optional[str] = None, 
               timezone: Optional[str] = None, send_transcript_file: Optional[int] = None) -> Optional[User]:
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
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        self._conn.execute(query, params)
        
        return self.get(user_id)

    def _row_to_model(self, row: sqlite3.Row) -> User:
        # Helper to convert sqlite3.Row to User model
        data = dict(row)
        return User(**data)
