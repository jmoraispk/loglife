from typing import Optional
import sqlite3
from app.db.rows import Referral

class ReferralsTable:
    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn

    def create(self, referrer_user_id: int, referred_user_id: int) -> None:
        self._conn.execute(
            """
            INSERT INTO referrals(referrer_user_id, referred_user_id)
            VALUES (?, ?)
            """,
            (referrer_user_id, referred_user_id)
        )

    def get(self, referral_id: int) -> Optional[Referral]:
        row = self._conn.execute("SELECT * FROM referrals WHERE id = ?", (referral_id,)).fetchone()
        return self._row_to_model(row) if row else None

    def _row_to_model(self, row: sqlite3.Row) -> Referral:
        return Referral(**dict(row))
