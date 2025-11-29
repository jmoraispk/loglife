"""Referral table operations and data model.

This module defines the Referral data class and the ReferralsTable class for handling
database interactions related to user referrals.
"""

import sqlite3
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Referral:
    """Referral data model."""

    id: int
    referrer_user_id: int
    referred_user_id: int
    created_at: datetime


class ReferralsTable:
    """Handles database operations for the referrals table."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        """Initialize the ReferralsTable with a database connection."""
        self._conn = conn

    def create(self, referrer_user_id: int, referred_user_id: int) -> None:
        """Create a new referral record."""
        self._conn.execute(
            """
            INSERT INTO referrals(referrer_user_id, referred_user_id)
            VALUES (?, ?)
            """,
            (referrer_user_id, referred_user_id),
        )

    def get(self, referral_id: int) -> Referral | None:
        """Retrieve a referral by its ID."""
        row = self._conn.execute(
            "SELECT * FROM referrals WHERE id = ?", (referral_id,)
        ).fetchone()
        return self._row_to_model(row) if row else None

    def _row_to_model(self, row: sqlite3.Row) -> Referral:
        """Convert a SQLite row to a Referral model."""
        return Referral(**dict(row))
