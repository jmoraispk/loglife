from typing import Optional, List
import sqlite3
from app.db.rows import Goal

class GoalsTable:
    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn

    def get(self, goal_id: int) -> Optional[Goal]:
        row = self._conn.execute(
            "SELECT * FROM user_goals WHERE id = ?", 
            (goal_id,)
        ).fetchone()
        return self._row_to_model(row) if row else None

    def get_by_user(self, user_id: int) -> List[Goal]:
        rows = self._conn.execute(
            "SELECT * FROM user_goals WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        ).fetchall()
        return [self._row_to_model(row) for row in rows]

    def create(self, user_id: int, goal_emoji: str, goal_description: str, boost_level: int = 1) -> Goal:
        cursor = self._conn.execute(
            """
            INSERT INTO user_goals(user_id, goal_emoji, goal_description, boost_level)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, goal_emoji, goal_description, boost_level)
        )
        return self.get(cursor.lastrowid)

    def update(self, goal_id: int, goal_emoji: Optional[str] = None, 
               goal_description: Optional[str] = None, boost_level: Optional[int] = None) -> Optional[Goal]:
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
        query = f"UPDATE user_goals SET {', '.join(updates)} WHERE id = ?"
        self._conn.execute(query, params)
        
        return self.get(goal_id)

    def delete(self, goal_id: int) -> None:
        self._conn.execute("DELETE FROM user_goals WHERE id = ?", (goal_id,))

    def _row_to_model(self, row: sqlite3.Row) -> Goal:
        return Goal(**dict(row))
