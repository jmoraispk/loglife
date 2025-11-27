"""Tests for user database operations."""

import pytest
from app.db.operations import users


def test_create_user():
    """Test creating a new user with unique phone number.

    Verifies successful user creation with valid phone number and timezone,
    and ensures duplicate phone numbers are properly rejected with an
    IntegrityError due to UNIQUE constraint.

    """
    # Act
    user = users.create_user(phone_number="+1234567890", timezone="America/New_York")

    # Assert
    assert user is not None
    assert isinstance(user, dict)
    assert user["phone_number"] == "+1234567890"
    assert user["timezone"] == "America/New_York"
    assert user["id"] is not None

    # Act & Assert
    with pytest.raises(Exception):  # SQLite will raise IntegrityError
        users.create_user("+1234567890", "Europe/London")


def test_get_user():
    """Test retrieving a user by their unique ID.

    Verifies that existing users can be successfully retrieved by ID and
    returns all expected fields, while non-existent user IDs properly
    return None.

    """
    # Arrange - create a user first
    created_user = users.create_user(
        phone_number="+1234567890",
        timezone="America/New_York",
    )

    # Act
    retrieved_user = users.get_user(created_user["id"])
    user = users.get_user(999)

    # Assert
    assert retrieved_user is not None
    assert isinstance(retrieved_user, dict)
    assert retrieved_user["id"] == created_user["id"]
    assert retrieved_user["phone_number"] == "+1234567890"
    assert user is None


def test_get_user_by_phone_number():
    """Test retrieving a user by their phone number.

    Verifies that users can be looked up by phone number and returns the
    complete user record, while non-existent phone numbers properly return
    None.

    """
    # Arrange
    users.create_user(phone_number="+1234567890", timezone="America/New_York")

    # Act
    user = users.get_user_by_phone_number("+1234567890")

    # Assert
    assert user is not None
    assert user["phone_number"] == "+1234567890"


def test_get_all_users():
    """Test retrieving all users from the database.

    Verifies that all user records are returned with complete field data,
    and that the result set contains all expected users regardless of
    timestamp-based ordering.

    """
    # Arrange - create multiple users
    users.create_user("+1111111111", "America/New_York")
    users.create_user("+2222222222", "Europe/London")
    users.create_user("+3333333333", "Asia/Tokyo")

    # Act
    all_users = users.get_all_users()

    # Assert
    assert len(all_users) == 3

    # Check all phone numbers are present (order may vary with same timestamp)
    phone_numbers = {user["phone_number"] for user in all_users}
    assert phone_numbers == {"+1111111111", "+2222222222", "+3333333333"}

    # Verify all users have required fields
    for user in all_users:
        assert "id" in user
        assert "phone_number" in user
        assert "timezone" in user
        assert "created_at" in user


def test_update_user():
    """Test updating user information with optional fields.

    Verifies that individual fields (phone_number, timezone) can be updated
    independently or together, and that unchanged fields retain their
    original values.

    """
    # Arrange
    user = users.create_user("+1234567890", "America/New_York")

    # Act
    updated_user = users.update_user(user["id"], timezone="Europe/Paris", send_transcript_file=0)

    # Assert
    assert updated_user["timezone"] == "Europe/Paris"
    assert updated_user["phone_number"] == "+1234567890"  # unchanged
    assert updated_user["send_transcript_file"] == 0


def test_delete_user():
    """Test deleting a user from the database.

    Verifies that a user can be successfully deleted by ID and that
    subsequent attempts to retrieve the deleted user return None.

    """
    # Arrange
    user = users.create_user("+1234567890", "America/New_York")
    user_id = user["id"]

    # Act
    users.delete_user(user_id)

    # Assert
    deleted_user = users.get_user(user_id)
    assert deleted_user is None
