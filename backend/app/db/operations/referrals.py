"""Database operations for user referrals.

This module provides operations for managing referral relationships between users.
It handles creating referral records that link referrer and referred users.
"""

from app.db import connect


def create_referral(referrer_user_id: int, referred_user_id: int) -> None:
    """Creates a new referral record linking a referrer to a referred user.

    Arguments:
    referrer_user_id -- The unique identifier of the user who made the referral
    referred_user_id -- The unique identifier of the user who was referred

    """
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
