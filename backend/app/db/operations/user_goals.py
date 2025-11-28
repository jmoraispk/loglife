"""Database operations for user goals.

This module provides CRUD operations for managing user goals in the database.
It handles creating, reading, updating, and deleting user goal records.
"""

from app.db.sqlite import connect


def get_user_goals(user_id: int) -> list[dict]:
    """Retrieve all goals for a specific user.

    Args:
        user_id: The unique identifier of the user

    Returns:
        A list of all user goal records ordered by creation date
        (newest first).

    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM user_goals WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        )
        rows = cur.fetchall()
        return [dict(row) for row in rows]


def get_goal(goal_id: int) -> dict | None:
    """Retrieve a user goal by its ID.

    Args:
        goal_id: The unique identifier of the goal to retrieve

    Returns:
        The goal record as a dictionary, or None if not found.

    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM user_goals WHERE id = ?",
            (goal_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None


def create_goal(
    user_id: int,
    goal_emoji: str,
    goal_description: str,
    *,
    boost_level: int = 1,
) -> dict | None:
    """Create a new user goal record.

    Args:
        user_id: The unique identifier of the user
        goal_emoji: The emoji representing the goal
        goal_description: The description of the goal
        boost_level: The boost level for the goal (default: 1)

    Returns:
        The newly created goal record as a dictionary.

    """
    with connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO user_goals(
                user_id,
                goal_emoji,
                goal_description,
                boost_level
            )
            VALUES (?, ?, ?, ?)
            """,
            (user_id, goal_emoji, goal_description, boost_level),
        )
        goal_id = cur.lastrowid
    return get_goal(goal_id)


def update_goal(
    goal_id: int,
    *,
    goal_emoji: str | None = None,
    goal_description: str | None = None,
    boost_level: int | None = None,
) -> dict | None:
    """Update a user goal record with provided fields.

    Only the fields that are provided (not None) will be updated. If no fields
    are provided, the function returns the existing goal without modification.

    Args:
        goal_id: The unique identifier of the goal to update
        goal_emoji: Optional new emoji to assign
        goal_description: Optional new description to assign
        boost_level: Optional new boost level to assign

    Returns:
        The updated goal record as a dictionary.

    """
    updates = []
    params = []

    if goal_emoji is not None:
        updates.append("goal_emoji = ?")
        params.append(goal_emoji)

    if goal_description is not None:
        updates.append("goal_description = ?")
        params.append(goal_description)

    if boost_level is not None:
        updates.append("boost_level = ?")
        params.append(boost_level)

    if not updates:
        return get_goal(goal_id)

    params.append(goal_id)

    with connect() as conn:
        # Note: This is safe from SQL injection because updates are built
        # from a controlled whitelist and all values are parameterized
        query = f"UPDATE user_goals SET {', '.join(updates)} WHERE id = ?"  # noqa: S608
        conn.execute(query, params)

    return get_goal(goal_id)


def delete_goal(goal_id: int) -> None:
    """Delete a user goal record from the database.

    Args:
        goal_id: The unique identifier of the goal to delete

    """
    with connect() as conn:
        conn.execute("DELETE FROM user_goals WHERE id = ?", (goal_id,))
