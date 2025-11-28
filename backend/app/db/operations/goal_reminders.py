"""Database operations for goal reminders.

This module provides CRUD operations for managing goal reminders in the database.
It handles creating, reading, updating, and deleting goal reminder records.
"""

from app.db.sqlite import connect


def get_all_goal_reminders() -> list[dict]:
    """Retrieve all goal reminders from the database.

    Return a list of all goal reminder records ordered by creation date
    (newest first).
    """
    with connect() as conn:
        cur = conn.execute("SELECT * FROM goal_reminders ORDER BY created_at DESC")
        rows = cur.fetchall()
        return [dict(row) for row in rows]


def get_goal_reminder(reminder_id: int) -> dict | None:
    """Retrieve a goal reminder by its ID.

    Args:
        reminder_id: The unique identifier of the reminder to retrieve

    Returns:
        The reminder record as a dictionary, or None if not found.

    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM goal_reminders WHERE id = ?",
            (reminder_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def get_goal_reminder_by_goal_id(user_goal_id: int) -> dict | None:
    """Retrieve a goal reminder for a specific user goal.

    Args:
        user_goal_id: The unique identifier of the user goal

    Returns:
        The reminder record as a dictionary, or None if not found.

    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM goal_reminders WHERE user_goal_id = ?",
            (user_goal_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def create_goal_reminder(user_id: int, user_goal_id: int, reminder_time: str) -> dict:
    """Create a new goal reminder record.

    Args:
        user_id: The unique identifier of the user
        user_goal_id: The unique identifier of the user goal
        reminder_time: The time when the reminder should be triggered

    Returns:
        The newly created reminder record as a dictionary.

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
    """Update a goal reminder record with provided fields.

    Only the fields that are provided (not None) will be updated. If no fields
    are provided, the function returns the existing reminder without modification.

    Args:
        reminder_id: The unique identifier of the reminder to update
        user_goal_id: Optional new user goal ID to assign
        reminder_time: Optional new reminder time to assign

    Returns:
        The updated reminder record as a dictionary.

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
        # Note: This is safe from SQL injection because updates are built
        # from a controlled whitelist and all values are parameterized
        query = f"UPDATE goal_reminders SET {', '.join(updates)} WHERE id = ?"  # noqa: S608
        conn.execute(
            query,
            params,
        )

    return get_goal_reminder(reminder_id)


def delete_goal_reminder(reminder_id: int) -> None:
    """Delete a goal reminder record from the database.

    Args:
        reminder_id: The unique identifier of the reminder to delete

    """
    with connect() as conn:
        conn.execute("DELETE FROM goal_reminders WHERE id = ?", (reminder_id,))
