import sqlite3

from app.db import connect

def get_all_goal_reminders() -> list[dict]:
    with connect() as conn:
        cur = conn.execute("SELECT * FROM goal_reminders ORDER BY created_at DESC")
        rows: list[sqlite3.Row] = cur.fetchall()
        return [dict(row) for row in rows]

def get_goal_reminder(reminder_id: int):
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM goal_reminders WHERE id = ?",
            (reminder_id,),
        )
        row: sqlite3.Row | None = cur.fetchone()
        return dict(row) if row else None

def create_goal_reminder(user_id: int, user_goal_id: int, reminder_time: str) -> dict:
    with connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO goal_reminders (user_id, user_goal_id, reminder_time)
            VALUES (?, ?, ?)
            """,
            (user_id, user_goal_id, reminder_time),
        )
        reminder_id = cur.lastrowid
    return get_goal_reminder(reminder_id)

def update_goal_reminder(reminder_id: int, *, user_goal_id: int | None = None, reminder_time: str | None = None):
    updates = []
    params = []
    
    if user_goal_id is not None:
        updates.append("user_goal_id = ?")
        params.append(user_goal_id)
    
    if reminder_time is not None:
        updates.append("reminder_time = ?")
        params.append(reminder_time)
    
    if not updates:
        return get_goal_reminder(reminder_id)
    
    params.append(reminder_id)
    with connect() as conn:
        conn.execute(
            f"UPDATE goal_reminders SET {', '.join(updates)} WHERE id = ?",
            params
        )
    
    return get_goal_reminder(reminder_id)

def delete_goal_reminder(reminder_id: int):
    with connect() as conn:
        conn.execute("DELETE FROM goal_reminders WHERE id = ?", (reminder_id,))