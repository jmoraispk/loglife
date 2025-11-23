"""Database operations for goal reminders.

This module provides CRUD operations for managing goal reminders in the database.
It handles creating, reading, updating, and deleting goal reminder records.
"""

import sqlite3

from app.db import connect


def get_all_goal_reminders() -> list[dict]:
    """Retrieves all goal reminders from the database.

    Returns a list of all goal reminder records ordered by creation date (newest first).
    """
    with connect() as conn:
        cur = conn.execute("SELECT * FROM goal_reminders ORDER BY created_at DESC")
        rows: list[sqlite3.Row] = cur.fetchall()
        return [dict(row) for row in rows]


def get_goal_reminder(reminder_id: int):
    """Retrieves a goal reminder by its ID.

    Arguments:
    reminder_id -- The unique identifier of the reminder to retrieve

    Returns the reminder record as a dictionary, or None if not found.
    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM goal_reminders WHERE id = ?",
            (reminder_id,),
        )
        row: sqlite3.Row | None = cur.fetchone()
        return dict(row) if row else None

def get_goal_reminder_by_goal_id(user_goal_id: int) -> dict | None:
    """Retrieves a goal reminder for a specific user goal.

    Arguments:
    user_goal_id -- The unique identifier of the user goal

    Returns the reminder record as a dictionary, or None if not found.
    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM goal_reminders WHERE user_goal_id = ?",
            (user_goal_id,),
        )
        row: sqlite3.Row | None = cur.fetchone()
        return dict(row) if row else None

def create_goal_reminder(user_id: int, user_goal_id: int, reminder_time: str) -> dict:
    """Creates a new goal reminder record.

    Arguments:
    user_id -- The unique identifier of the user
    user_goal_id -- The unique identifier of the user goal
    reminder_time -- The time when the reminder should be triggered

    Returns the newly created reminder record as a dictionary.
    """
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


def update_goal_reminder(
    reminder_id: int,
    *,
    user_goal_id: int | None = None,
    reminder_time: str | None = None,
) -> dict:
    """Updates a goal reminder record with provided fields.

    Only the fields that are provided (not None) will be updated. If no fields
    are provided, the function returns the existing reminder without modification.

    Arguments:
    reminder_id -- The unique identifier of the reminder to update
    user_goal_id -- Optional new user goal ID to assign
    reminder_time -- Optional new reminder time to assign

    Returns the updated reminder record as a dictionary.
    """
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
            f"UPDATE goal_reminders SET {', '.join(updates)} WHERE id = ?", params
        )

    return get_goal_reminder(reminder_id)


def delete_goal_reminder(reminder_id: int):
    """Deletes a goal reminder record from the database.

    Arguments:
    reminder_id -- The unique identifier of the reminder to delete
    """
    with connect() as conn:
        conn.execute("DELETE FROM goal_reminders WHERE id = ?", (reminder_id,))
