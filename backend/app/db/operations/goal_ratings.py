import sqlite3
from app.db import connect


def get_all_ratings():
    with connect() as conn:
        cur = conn.execute("SELECT * FROM goal_ratings ORDER BY created_at DESC")
        rows: list[sqlite3.Row] = cur.fetchall()
        return [dict(row) for row in rows]


def get_rating(rating_id: int):
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM goal_ratings WHERE id = ?",
            (rating_id,),
        )
        row: sqlite3.Row | None = cur.fetchone()
        return dict(row) if row else None

def get_rating_by_goal_and_date(user_goal_id: int, rating_date: str) -> dict | None:
    """
    rating_date must be in YYYY-MM-DD format.
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


def create_rating(user_goal_id: int, rating: int):
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
):
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
            params
        )

    return get_rating(rating_id)


def delete_rating(rating_id: int):
    with connect() as conn:
        conn.execute("DELETE FROM goal_ratings WHERE id = ?", (rating_id,))