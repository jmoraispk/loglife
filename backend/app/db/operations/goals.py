import sqlite3
from app.db import connect


def get_user_goals(user_id: int):
    with connect() as conn:
        cur = conn.execute("SELECT * FROM user_goals WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        rows: list[sqlite3.Row] = cur.fetchall()
        return [dict(row) for row in rows]


def get_goal(goal_id: int):
    with connect() as conn:
        cur = conn.execute(
            "SELECT * FROM user_goals WHERE id = ?",
            (goal_id,),
        )
        row: sqlite3.Row | None = cur.fetchone()
        return dict(row) if row else None


def create_goal(
    user_id: int,
    goal_emoji: str,
    goal_description: str,
    *,
    boost_level: int = 1,
):
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
):
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
        conn.execute(
            f"UPDATE user_goals SET {', '.join(updates)} WHERE id = ?",
            params
        )

    return get_goal(goal_id)


def delete_goal(goal_id: int):
    with connect() as conn:
        conn.execute("DELETE FROM user_goals WHERE id = ?", (goal_id,))


def get_goal_ratings_for_date(user_id: int, rating_date: str):
    with connect() as conn:
        cur = conn.execute(
            """
            SELECT g.goal_emoji, gr.rating
            FROM user_goals g
            LEFT JOIN goal_ratings gr ON g.id = gr.user_goal_id AND gr.rating_date = ?
            WHERE g.user_id = ?
            ORDER BY g.created_at
            """,
            (rating_date, user_id),
        )
        rows: list[sqlite3.Row] = cur.fetchall()
        return [dict(row) for row in rows]