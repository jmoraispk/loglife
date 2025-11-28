"""Database operations for users.

This module provides CRUD operations for managing users in the database.
It handles creating, reading, updating, and deleting user records.
"""

from app.db.sqlite import connect


def get_all_users() -> list[dict]:
    """Retrieve all users from the database.

    Return a list of all user records ordered by creation date (newest first).
    """
    with connect() as conn:
        cur = conn.execute("SELECT * FROM users ORDER BY created_at DESC")
        rows = cur.fetchall()
        # we return after converting to dict to access columns by name instead of index
        return [dict(row) for row in rows]


def get_user(user_id: int) -> dict:
    """Retrieve a user by their ID.

    Args:
        user_id: The unique identifier of the user to retrieve

    Returns:
        The user record as a dictionary, or None if not found.

    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM users WHERE id = ?",
            (user_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def get_user_by_phone_number(phone_number: str) -> dict | None:
    """Retrieve a user by their phone number.

    Args:
        phone_number: The phone number of the user to retrieve

    Returns:
        The user record as a dictionary, or None if not found.

    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM users WHERE phone_number = ?",
            (phone_number,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def create_user(phone_number: str, timezone: str) -> dict:
    """Create a new user record.

    Args:
        phone_number: The phone number of the user
        timezone: The timezone of the user

    Returns:
        The newly created user record as a dictionary.

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
    user_id: int,
    *,
    phone_number: str | None = None,
    timezone: str | None = None,
    send_transcript_file: int | None = None,
) -> dict:
    """Update a user record with provided fields.

    Only the fields that are provided (not None) will be updated.

    Args:
        user_id: The unique identifier of the user to update
        phone_number: Optional new phone number to assign
        timezone: Optional new timezone to assign
        send_transcript_file: Optional setting to enable/disable transcript
            file (0 or 1)

    Returns:
        The updated user record as a dictionary.

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
        # Note: This is safe from SQL injection because updates are built
        # from a controlled whitelist and all values are parameterized
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"  # noqa: S608
        conn.execute(query, params)

    return get_user(user_id)


def delete_user(user_id: int) -> None:
    """Delete a user record from the database.

    Args:
        user_id: The unique identifier of the user to delete

    """
    with connect() as conn:
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
