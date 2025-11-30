"""Rating table operations and data model.

This module defines the Rating data class and the RatingsTable class for handling
database interactions related to goal ratings.
"""

import sqlite3
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Rating:
    """Rating data model."""

    id: int
    user_goal_id: int
    rating: int
    rating_date: datetime
    created_at: datetime
    updated_at: datetime


class RatingsTable:
    """Handles database operations for the goal_ratings table."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        """Initialize the RatingsTable with a database connection."""
        self._conn = conn

    def get(self, rating_id: int) -> Rating | None:
        """Retrieve a rating by its ID."""
        query = "SELECT * FROM goal_ratings WHERE id = ?"
        row = self._conn.execute(query, (rating_id,)).fetchone()
        return self._row_to_model(row) if row else None

    def get_by_goal_and_date(
        self, user_goal_id: int, rating_date: str
    ) -> Rating | None:
        """Retrieve the most recent rating for a goal on a given date."""
        query = """
            SELECT * FROM goal_ratings
            WHERE user_goal_id = ? AND DATE(rating_date) = DATE(?)
            ORDER BY created_at DESC LIMIT 1
        """
        row = self._conn.execute(query, (user_goal_id, rating_date)).fetchone()
        return self._row_to_model(row) if row else None

    def get_all(self) -> list[Rating]:
        """Retrieve all ratings."""
        query = "SELECT * FROM goal_ratings ORDER BY created_at DESC"
        rows = self._conn.execute(query).fetchall()
        return [self._row_to_model(row) for row in rows]

    def create(self, user_goal_id: int, rating: int) -> Rating:
        """Create a new rating record."""
        query = "INSERT INTO goal_ratings(user_goal_id, rating) VALUES (?, ?)"
        cursor = self._conn.execute(query, (user_goal_id, rating))
        return self.get(cursor.lastrowid)  # type: ignore[arg-type]

    def update(
        self,
        rating_id: int,
        user_goal_id: int | None = None,
        rating: int | None = None,
        rating_date: str | None = None,
    ) -> Rating | None:
        """Update a rating record with provided fields."""
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
            return self.get(rating_id)

        params.append(rating_id)
        # noqa: S608 - Safe usage (whitelist construction)
        query = f"UPDATE goal_ratings SET {', '.join(updates)} WHERE id = ?"  # noqa: S608
        self._conn.execute(query, params)

        return self.get(rating_id)

    def delete(self, rating_id: int) -> None:
        """Delete a rating record."""
        query = "DELETE FROM goal_ratings WHERE id = ?"
        self._conn.execute(query, (rating_id,))

    def _row_to_model(self, row: sqlite3.Row) -> Rating:
        """Convert a SQLite row to a Rating model."""
        return Rating(**dict(row))
