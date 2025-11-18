import sqlite3
from app.db import connect

def get_all_users():
    with connect() as conn:
        cur = conn.execute("SELECT * FROM users ORDER BY created_at DESC")
        rows: list[sqlite3.Row] = cur.fetchall()
        # we return after converting to dict to access columns by name instead of index
        return [dict(row) for row in rows]

def get_user(user_id: int) -> dict:
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM users WHERE id = ?",
            (user_id,),
        )
        row: sqlite3.Row | None = cur.fetchone()
        return dict(row) if row else None

def get_user_by_phone_number(phone_number: str) -> dict | None:
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM users WHERE phone_number = ?",
            (phone_number,),
        )
        row: sqlite3.Row | None = cur.fetchone()
        return dict(row) if row else None

def create_user(phone_number: str, timezone: str) -> dict:
    with connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO users (phone_number, timezone)
            VALUES (?, ?)
            """,
            (phone_number, timezone),
        )
    return get_user_by_phone_number(phone_number)

# * makes following params keyword-only
def update_user(user_id: int, *, phone_number=None, timezone=None):
    updates = []
    params = []
    if phone_number is not None:
        updates.append("phone_number = ?")
        params.append(phone_number)
    if timezone is not None:
        updates.append("timezone = ?")
        params.append(timezone)

    params.append(user_id)
    with connect() as conn:
        conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)

    return get_user(user_id)

def delete_user(user_id: int):
    with connect() as conn:
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))