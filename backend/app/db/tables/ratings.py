from typing import Optional, List
import sqlite3
from app.db.rows import Rating

class RatingsTable:
    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn

    def get(self, rating_id: int) -> Optional[Rating]:
        row = self._conn.execute(
            "SELECT * FROM goal_ratings WHERE id = ?", 
            (rating_id,)
        ).fetchone()
        return self._row_to_model(row) if row else None

    def get_by_goal_and_date(self, user_goal_id: int, rating_date: str) -> Optional[Rating]:
        row = self._conn.execute(
            """
            SELECT * FROM goal_ratings 
            WHERE user_goal_id = ? AND DATE(rating_date) = DATE(?) 
            ORDER BY created_at DESC LIMIT 1
            """,
            (user_goal_id, rating_date)
        ).fetchone()
        return self._row_to_model(row) if row else None

    def get_all(self) -> List[Rating]:
        rows = self._conn.execute("SELECT * FROM goal_ratings ORDER BY created_at DESC").fetchall()
        return [self._row_to_model(row) for row in rows]

    def create(self, user_goal_id: int, rating: int) -> Rating:
        cursor = self._conn.execute(
            "INSERT INTO goal_ratings(user_goal_id, rating) VALUES (?, ?)",
            (user_goal_id, rating)
        )
        return self.get(cursor.lastrowid)

    def update(self, rating_id: int, user_goal_id: Optional[int] = None, 
               rating: Optional[int] = None, rating_date: Optional[str] = None) -> Optional[Rating]:
        updates = []
        params = []

        if user_goal_id is not None:
            updates.append("user_goal_id = ?")
            params.append(user_goal_id)
            
        if rating is not None:
            updates.append("rating = ?")
            params.append(rating)
            
        if rating_date is not None:
            updates.append("rating_date = ?")
            params.append(rating_date)

        if not updates:
            return self.get(rating_id)

        params.append(rating_id)
        query = f"UPDATE goal_ratings SET {', '.join(updates)} WHERE id = ?"
        self._conn.execute(query, params)
        
        return self.get(rating_id)

    def delete(self, rating_id: int) -> None:
        self._conn.execute("DELETE FROM goal_ratings WHERE id = ?", (rating_id,))

    def _row_to_model(self, row: sqlite3.Row) -> Rating:
        return Rating(**dict(row))
