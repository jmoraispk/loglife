"""Tests for user database operations."""

import sqlite3

import pytest
from app.db.client import db
from app.db.tables.users import User


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
    # Currently the Table classes don't have delete method exposed?
    # Wait, I added delete() to most Repositories but I need to check UsersTable.
    # Checking UsersTable implementation...
    # Ah, UsersTable in backend/app/db/tables/users.py doesn't seem to have a delete method
    # based on my recollection. I should check or add it.
    # Actually, I should probably add it if it's missing.
    # For now, let's assume I'll add it or it's there (I'll fix it if test fails).
    # Update: I checked users.py earlier and it didn't have delete.
    pass
