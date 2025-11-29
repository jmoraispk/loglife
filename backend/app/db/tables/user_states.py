from typing import Optional
import sqlite3
from app.db.rows import UserState

class UserStatesTable:
    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn

    def get(self, user_id: int) -> Optional[UserState]:
        row = self._conn.execute(
            "SELECT * FROM user_states WHERE user_id = ?", 
            (user_id,)
        ).fetchone()
        return self._row_to_model(row) if row else None

    def create(self, user_id: int, state: str, temp_data: Optional[str] = None) -> UserState:
        self._conn.execute(
            """
            INSERT INTO user_states (user_id, state, temp_data)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                state = excluded.state,
                temp_data = excluded.temp_data,
                created_at = CURRENT_TIMESTAMP
            """,
            (user_id, state, temp_data)
        )
        return self.get(user_id)

    def update(self, user_id: int, state: Optional[str] = None, 
               temp_data: Optional[str] = None) -> Optional[UserState]:
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
        query = f"UPDATE user_states SET {', '.join(updates)} WHERE user_id = ?"
        self._conn.execute(query, params)
        
        return self.get(user_id)

    def delete(self, user_id: int) -> None:
        self._conn.execute("DELETE FROM user_states WHERE user_id = ?", (user_id,))

    def _row_to_model(self, row: sqlite3.Row) -> UserState:
        return UserState(**dict(row))
