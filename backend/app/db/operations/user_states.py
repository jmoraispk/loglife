import sqlite3
from app.db import connect


def get_user_state(user_id: int) -> dict | None:
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM user_states WHERE user_id = ?",
            (user_id,),
        )
        row: sqlite3.Row | None = cur.fetchone()
        return dict(row) if row else None


def create_user_state(user_id: int, state: str, temp_data: str | None = None) -> dict:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO user_states (user_id, state, temp_data)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                state = excluded.state,
                temp_data = excluded.temp_data,
                created_at = CURRENT_TIMESTAMP
            """,
            (user_id, state, temp_data),
        )
    return get_user_state(user_id)


def update_user_state(
    user_id: int, *, state: str | None = None, temp_data: str | None = None
) -> dict | None:
    updates = []
    params = []
    if state is not None:
        updates.append("state = ?")
        params.append(state)
    if temp_data is not None:
        updates.append("temp_data = ?")
        params.append(temp_data)

    if not updates:
        return get_user_state(user_id)

    params.append(user_id)
    with connect() as conn:
        conn.execute(f"UPDATE user_states SET {', '.join(updates)} WHERE user_id = ?", params)

    return get_user_state(user_id)


def delete_user_state(user_id: int) -> None:
    with connect() as conn:
        conn.execute("DELETE FROM user_states WHERE user_id = ?", (user_id,))