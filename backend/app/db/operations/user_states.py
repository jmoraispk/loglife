"""Database operations for user states.

This module provides CRUD operations for managing user conversation states in the
database. It handles creating, reading, updating, and deleting user state records
for state machine management.
"""

from app.db.sqlite import connect


def get_user_state(user_id: int) -> dict | None:
    """Retrieve the current state for a specific user.

    Args:
        user_id: The unique identifier of the user

    Returns:
        The user state record as a dictionary, or None if not found.

    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM user_states WHERE user_id = ?",
            (user_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def create_user_state(user_id: int, state: str, temp_data: str | None = None) -> dict:
    """Create or update a user state record.

    If a state already exists for the user, it will be updated with the new values.
    Otherwise, a new state record is created.

    Args:
        user_id: The unique identifier of the user
        state: The state value to set
        temp_data: Optional temporary data to store with the state

    Returns:
        The created or updated user state record as a dictionary.

    """
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
    user_id: int,
    *,
    state: str | None = None,
    temp_data: str | None = None,
) -> dict | None:
    """Update a user state record with provided fields.

    Only the fields that are provided (not None) will be updated. If no fields
    are provided, the function returns the existing state without modification.

    Args:
        user_id: The unique identifier of the user
        state: Optional new state value to assign
        temp_data: Optional new temporary data to assign

    Returns:
        The updated user state record as a dictionary, or None if not found.

    """
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
        # Note: This is safe from SQL injection because updates are built
        # from a controlled whitelist and all values are parameterized
        query = f"UPDATE user_states SET {', '.join(updates)} WHERE user_id = ?"  # noqa: S608
        conn.execute(
            query,
            params,
        )

    return get_user_state(user_id)


def delete_user_state(user_id: int) -> None:
    """Delete a user state record from the database.

    Args:
        user_id: The unique identifier of the user

    """
    with connect() as conn:
        conn.execute("DELETE FROM user_states WHERE user_id = ?", (user_id,))
