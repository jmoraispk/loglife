"""Database operations for goal ratings.

This module provides CRUD operations for managing goal ratings in the database.
It handles creating, reading, updating, and deleting goal rating records.
"""

import sqlite3

from app.db import connect


def get_all_ratings() -> list:
    """Retrieves all goal ratings from the database.

    Returns a list of all goal rating records ordered by creation date (newest first).
    """
    with connect() as conn:
        cur = conn.execute("SELECT * FROM goal_ratings ORDER BY created_at DESC")
        rows: list[sqlite3.Row] = cur.fetchall()
        return [dict(row) for row in rows]


def get_rating(rating_id: int) -> dict | None:
    """Retrieves a goal rating by its ID.

    Arguments:
    rating_id -- The unique identifier of the rating to retrieve

    Returns the rating record as a dictionary, or None if not found.

    """
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM goal_ratings WHERE id = ?",
            (rating_id,),
        )
        row: sqlite3.Row | None = cur.fetchone()
        return dict(row) if row else None


def get_rating_by_goal_and_date(user_goal_id: int, rating_date: str) -> dict | None:
    """Retrieves the most recent goal rating for a specific goal on a given date.

    Queries the database for a rating matching the user goal and date, returning
    the most recently created rating if multiple exist for the same date.

    Arguments:
    user_goal_id -- The unique identifier of the user goal
    rating_date -- Date string in YYYY-MM-DD format

    Returns the rating record as a dictionary, or None if not found.

    """
    with connect() as conn:
        cur = conn.execute(
            """
            SELECT *
            FROM goal_ratings
            WHERE user_goal_id = ?
            AND DATE(rating_date) = DATE(?)
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (user_goal_id, rating_date),
        )
        row: sqlite3.Row | None = cur.fetchone()
        return dict(row) if row else None


def create_rating(user_goal_id: int, rating: int) -> dict | None:
    """Creates a new goal rating record.

    Arguments:
    user_goal_id -- The unique identifier of the user goal being rated
    rating -- The rating value to assign

    Returns the newly created rating record as a dictionary.

    """
    with connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO goal_ratings(
                user_goal_id,
                rating
            )
            VALUES (?, ?)
            """,
            (user_goal_id, rating),
        )
        rating_id = cur.lastrowid
        return get_rating(rating_id)


def update_rating(
    rating_id: int,
    *,
    user_goal_id: int | None = None,
    rating: int | None = None,
    rating_date: str | None = None,
) -> dict | None:
    """Updates a goal rating record with provided fields.

    Only the fields that are provided (not None) will be updated. If no fields
    are provided, the function returns the existing rating without modification.

    Arguments:
    rating_id -- The unique identifier of the rating to update
    user_goal_id -- Optional new user goal ID to assign
    rating -- Optional new rating value to assign
    rating_date -- Optional new rating date to assign

    Returns the updated rating record as a dictionary.

    """
    updates = []
    params = []

    if user_goal_id is not None:
        updates.append("user_goal_id = ?")
        params.append(user_goal_id)

    if rating is not None:
        updates.append("rating = ?")
        params.append(rating)

    if rating_date is not None:
        updates.append("rating_date = ?")
        params.append(rating_date)

    if not updates:
        return get_rating(rating_id)

    params.append(rating_id)

    with connect() as conn:
        conn.execute(
            f"UPDATE goal_ratings SET {', '.join(updates)} WHERE id = ?",
            params,
        )

    return get_rating(rating_id)


def delete_rating(rating_id: int):
    """Deletes a goal rating record from the database.

    Arguments:
    rating_id -- The unique identifier of the rating to delete

    """
    with connect() as conn:
        conn.execute("DELETE FROM goal_ratings WHERE id = ?", (rating_id,))
