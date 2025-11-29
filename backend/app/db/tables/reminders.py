from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
import sqlite3

@dataclass
class Reminder:
    id: int
    user_id: int
    user_goal_id: int
    reminder_time: datetime
    created_at: datetime

class RemindersTable:
    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn

    def get(self, reminder_id: int) -> Optional[Reminder]:
        row = self._conn.execute(
            "SELECT * FROM goal_reminders WHERE id = ?", 
            (reminder_id,)
        ).fetchone()
        return self._row_to_model(row) if row else None

    def get_by_goal_id(self, user_goal_id: int) -> Optional[Reminder]:
        row = self._conn.execute(
            "SELECT * FROM goal_reminders WHERE user_goal_id = ?",
            (user_goal_id,)
        ).fetchone()
        return self._row_to_model(row) if row else None

    def get_all(self) -> List[Reminder]:
        rows = self._conn.execute("SELECT * FROM goal_reminders ORDER BY created_at DESC").fetchall()
        return [self._row_to_model(row) for row in rows]

    def create(self, user_id: int, user_goal_id: int, reminder_time: str) -> Reminder:
        cursor = self._conn.execute(
            """
            INSERT INTO goal_reminders (user_id, user_goal_id, reminder_time)
            VALUES (?, ?, ?)
            """,
            (user_id, user_goal_id, reminder_time)
        )
        return self.get(cursor.lastrowid)

    def update(self, reminder_id: int, user_goal_id: Optional[int] = None, 
               reminder_time: Optional[str] = None) -> Optional[Reminder]:
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
        query = f"UPDATE goal_reminders SET {', '.join(updates)} WHERE id = ?"
        self._conn.execute(query, params)
        
        return self.get(reminder_id)

    def delete(self, reminder_id: int) -> None:
        self._conn.execute("DELETE FROM goal_reminders WHERE id = ?", (reminder_id,))

    def _row_to_model(self, row: sqlite3.Row) -> Reminder:
        return Reminder(**dict(row))
