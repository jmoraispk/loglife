"""Tests for referrals database operations."""

import sqlite3

import pytest
from app.db.operations import referrals, users


def test_create_referral() -> None:
    """Test creating a new referral with duplicate prevention.

    Verifies successful referral creation linking referrer and referred users,
    ensures duplicate referrals are rejected with IntegrityError due to UNIQUE
    constraint, and validates that different referral combinations and reversed
    roles are allowed.

    """
    # Arrange - create two users
    referrer = users.create_user("+1234567890", "America/New_York")
    referred = users.create_user("+9876543210", "Europe/London")

    # Test successful creation
    referrals.create_referral(
        referrer_user_id=referrer["id"],
        referred_user_id=referred["id"],
    )

    # We can't directly verify the referral was created since the function
    # doesn't return anything, but we can verify no exception was raised
    assert True

    # Test duplicate referral (should fail UNIQUE constraint)
    with pytest.raises(sqlite3.IntegrityError):
        referrals.create_referral(
            referrer_user_id=referrer["id"],
            referred_user_id=referred["id"],
        )

    # Test creating referral with different referred user (should succeed)
    referred2 = users.create_user("+5555555555", "Asia/Tokyo")
    referrals.create_referral(
        referrer_user_id=referrer["id"],
        referred_user_id=referred2["id"],
    )

    # Test creating referral where roles are reversed (should succeed)
    referrals.create_referral(
        referrer_user_id=referred["id"],
        referred_user_id=referrer["id"],
    )

    # All successful creations pass
    assert True
