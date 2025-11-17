import sqlite3

from app.db import connect


def fetch_reminder_times() -> list[dict]:
    with connect() as conn:
        cur = conn.execute(
            """
            SELECT
                gr.reminder_time,
                u.timezone
            FROM goal_reminders gr
            JOIN user_goals ug ON ug.id = gr.user_goal_id
            JOIN users u ON u.id = ug.user_id;
            """
        )
        rows: list[sqlite3.Row] = cur.fetchall()
        return [dict(row) for row in rows]


def get_active_reminders_with_user() -> list[dict]:
    with connect() as conn:
        cur = conn.execute(
            """
            SELECT
                ug.id               AS goal_id,
                ug.goal_emoji       AS goal_emoji,
                ug.goal_description AS goal_description,
                gr.reminder_time    AS reminder_time,
                u.phone_number      AS user_phone,
                u.timezone          AS user_timezone
            FROM goal_reminders gr
            JOIN user_goals ug ON ug.id = gr.user_goal_id
            JOIN users u ON u.id = ug.user_id
            """
        )
        rows: list[sqlite3.Row] = cur.fetchall()
        return [dict(row) for row in rows]