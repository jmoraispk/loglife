import sqlite3
from app.db import connect


def create_referral(referrer_user_id: int, referred_user_id: int) -> None:
    with connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO referrals(
                referrer_user_id,
                referred_user_id
            )
            VALUES (?, ?)
            """,
            (referrer_user_id, referred_user_id),
        )
        referral_id = cur.lastrowid
        conn.execute(
            "SELECT * FROM referrals WHERE id = ?",
            (referral_id,),
        )