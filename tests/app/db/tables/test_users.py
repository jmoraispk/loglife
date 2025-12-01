"""Tests for user database operations."""

import sqlite3

import pytest
from loglife.app.db.client import db
from loglife.app.db.tables import User


def test_create_user() -> None:
    """Test creating a new user with unique phone number.

    Verifies successful user creation with valid phone number and timezone,
    and ensures duplicate phone numbers are properly rejected with an
    IntegrityError due to UNIQUE constraint.

    """
    # Act
    user = db.users.create(phone_number="+1234567890", timezone="America/New_York")

    # Assert
    assert user is not None
    assert isinstance(user, User)
    assert user.phone_number == "+1234567890"
    assert user.timezone == "America/New_York"
    assert user.id is not None

    # Act & Assert
    with pytest.raises(sqlite3.IntegrityError):
        db.users.create("+1234567890", "Europe/London")


def test_get_user() -> None:
    """Test retrieving a user by their unique ID.

    Verifies that existing users can be successfully retrieved by ID and
    returns all expected fields, while non-existent user IDs properly
    return None.

    """
    # Arrange - create a user first
    created_user = db.users.create(
        phone_number="+1234567890",
        timezone="America/New_York",
    )

    # Act
    retrieved_user = db.users.get(created_user.id)
    user = db.users.get(999)

    # Assert
    assert retrieved_user is not None
    assert isinstance(retrieved_user, User)
    assert retrieved_user.id == created_user.id
    assert retrieved_user.phone_number == "+1234567890"
    assert user is None


def test_get_user_by_phone_number() -> None:
    """Test retrieving a user by their phone number.

    Verifies that users can be looked up by phone number and returns the
    complete user record, while non-existent phone numbers properly return
    None.

    """
    # Arrange
    db.users.create(phone_number="+1234567890", timezone="America/New_York")

    # Act
    user = db.users.get_by_phone("+1234567890")

    # Assert
    assert user is not None
    assert user.phone_number == "+1234567890"


def test_get_all_users() -> None:
    """Test retrieving all users.

    Verifies that get_all returns a list of all user records.
    """
    # Arrange
    db.users.create(phone_number="+1234567890", timezone="UTC")
    db.users.create(phone_number="+9876543210", timezone="UTC")

    # Act
    users = db.users.get_all()

    # Assert
    assert len(users) == 2
    assert isinstance(users[0], User)


def test_update_user() -> None:
    """Test updating user information with optional fields.

    Verifies that individual fields (phone_number, timezone) can be updated
    independently or together, and that unchanged fields retain their
    original values.

    """
    # Arrange
    user = db.users.create("+1234567890", "America/New_York")

    # Act
    updated_user = db.users.update(user.id, timezone="Europe/Paris", send_transcript_file=0)

    # Assert
    assert updated_user.timezone == "Europe/Paris"
    assert updated_user.phone_number == "+1234567890"  # unchanged
    assert updated_user.send_transcript_file == 0


def test_delete_user() -> None:
    """Test deleting a user from the database.

    Verifies that a user can be successfully deleted by ID and that
    subsequent attempts to retrieve the deleted user return None.

    """
    # Arrange
    user = db.users.create("+1234567890", "America/New_York")
    user_id = user.id

    # Act
    db.users.delete(user_id)

    # Assert
    assert db.users.get(user_id) is None
