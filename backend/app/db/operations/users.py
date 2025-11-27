"""Database operations for users.

This module provides CRUD operations for managing users in the database.
It handles creating, reading, updating, and deleting user records.
"""

import sqlite3

from app.db import connect


def get_all_users() -> list[dict]:
    """Retrieves all users from the database.

    Returns a list of all user records ordered by creation date (newest first).
    """
    with connect() as conn:
        cur = conn.execute("SELECT * FROM users ORDER BY created_at DESC")
        rows: list[sqlite3.Row] = cur.fetchall()
        # we return after converting to dict to access columns by name instead of index
        return [dict(row) for row in rows]


def get_user(user_id: int) -> dict:
    """Retrieves a user by their ID.

    Arguments:
    user_id -- The unique identifier of the user to retrieve

    Returns the user record as a dictionary, or None if not found.

    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM users WHERE id = ?",
            (user_id,),
        )
        row: sqlite3.Row | None = cur.fetchone()
        return dict(row) if row else None


def get_user_by_phone_number(phone_number: str) -> dict | None:
    """Retrieves a user by their phone number.

    Arguments:
    phone_number -- The phone number of the user to retrieve

    Returns the user record as a dictionary, or None if not found.

    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM users WHERE phone_number = ?",
            (phone_number,),
        )
        row: sqlite3.Row | None = cur.fetchone()
        return dict(row) if row else None


def create_user(phone_number: str, timezone: str) -> dict:
    """Creates a new user record.

    Arguments:
    phone_number -- The phone number of the user
    timezone -- The timezone of the user

    Returns the newly created user record as a dictionary.

    """
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO users (phone_number, timezone)
            VALUES (?, ?)
            """,
            (phone_number, timezone),
        )
    return get_user_by_phone_number(phone_number)


def update_user(
    user_id: int, *, phone_number=None, timezone=None, send_transcript_file=None
) -> dict:
    """Updates a user record with provided fields.

    Only the fields that are provided (not None) will be updated.

    Arguments:
    user_id -- The unique identifier of the user to update
    phone_number -- Optional new phone number to assign
    timezone -- Optional new timezone to assign
    send_transcript_file -- Optional setting to enable/disable transcript file (0 or 1)

    Returns the updated user record as a dictionary.

    """
    updates = []
    params = []
    if phone_number is not None:
        updates.append("phone_number = ?")
        params.append(phone_number)
    if timezone is not None:
        updates.append("timezone = ?")
        params.append(timezone)
    if send_transcript_file is not None:
        updates.append("send_transcript_file = ?")
        params.append(send_transcript_file)

    params.append(user_id)
    with connect() as conn:
        conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)

    return get_user(user_id)


def delete_user(user_id: int):
    """Deletes a user record from the database.

    Arguments:
    user_id -- The unique identifier of the user to delete

    """
    with connect() as conn:
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
