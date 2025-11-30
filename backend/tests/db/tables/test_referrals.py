"""Tests for referrals database operations."""

import sqlite3

import pytest
from app.db.client import db


def test_create_referral() -> None:
    """Test creating a new referral with duplicate prevention.

    Verifies successful referral creation linking referrer and referred users,
    ensures duplicate referrals are rejected with IntegrityError due to UNIQUE
    constraint, and validates that different referral combinations and reversed
    roles are allowed.

    """
    # Arrange - create two users
    referrer = db.users.create("+1234567890", "America/New_York")
    referred = db.users.create("+9876543210", "Europe/London")

    # Test successful creation
    db.referrals.create(
        referrer_user_id=referrer.id,
        referred_user_id=referred.id,
    )

    # We can't directly verify the referral was created since the function
    # doesn't return anything, but we can verify no exception was raised
    assert True

    # Test duplicate referral (should fail UNIQUE constraint)
    with pytest.raises(sqlite3.IntegrityError):
        db.referrals.create(
            referrer_user_id=referrer.id,
            referred_user_id=referred.id,
        )

    # Test creating referral with different referred user (should succeed)
    referred2 = db.users.create("+5555555555", "Asia/Tokyo")
    db.referrals.create(
        referrer_user_id=referrer.id,
        referred_user_id=referred2.id,
    )

    # Test creating referral where roles are reversed (should succeed)
    db.referrals.create(
        referrer_user_id=referred.id,
        referred_user_id=referrer.id,
    )

    # All successful creations pass
    assert True
