"""Tests for goal_ratings database operations."""

import sqlite3
from datetime import UTC, datetime

import pytest
from app.db.client import db
from app.db.tables.ratings import Rating
from app.db.tables.users import User


def test_create_rating() -> None:
    """Test creating a new goal rating with constraint validation.

    Verifies successful rating creation with values 1-3, ensures all fields
    are properly stored, and validates that ratings outside the valid range
    (0 or 4+) are rejected with an IntegrityError due to CHECK constraint.

    """
    # Arrange - create user and goal
    user = db.users.create("+1234567890", "America/New_York")
    goal = db.goals.create(user.id, "🎯", "Learn Python")

    # Test successful creation
    rating = db.ratings.create(user_goal_id=goal.id, rating=3)

    # Assert successful creation
    assert rating is not None
    assert isinstance(rating, Rating)
    assert rating.user_goal_id == goal.id
    assert rating.rating == 3
    assert rating.id is not None
    assert rating.rating_date is not None
    assert rating.created_at is not None

    # Test creating rating with different value
    rating2 = db.ratings.create(user_goal_id=goal.id, rating=1)

    assert rating2.rating == 1

    # Test invalid rating (should fail CHECK constraint)
    with pytest.raises(sqlite3.IntegrityError):
        db.ratings.create(goal.id, 0)

    with pytest.raises(sqlite3.IntegrityError):
        db.ratings.create(goal.id, 4)


def test_get_rating() -> None:
    """Test retrieving a rating by its unique ID.

    Verifies that existing ratings can be successfully retrieved by ID with
    all expected fields, while non-existent rating IDs properly return None.

    """
    # Arrange - create user, goal, and rating
    user = db.users.create("+1234567890", "America/New_York")
    goal = db.goals.create(user.id, "🎯", "Learn Python")
    created_rating = db.ratings.create(goal.id, 3)

    # Test retrieving existing rating
    retrieved_rating = db.ratings.get(created_rating.id)

    # Assert existing rating
    assert retrieved_rating is not None
    assert isinstance(retrieved_rating, Rating)
    assert retrieved_rating.id == created_rating.id
    assert retrieved_rating.user_goal_id == goal.id
    assert retrieved_rating.rating == 3

    # Test retrieving non-existent rating
    non_existent_rating = db.ratings.get(999)
    assert non_existent_rating is None


def test_get_rating_by_goal_and_date() -> None:
    """Test retrieving a rating by goal ID and date.

    Verifies that ratings can be retrieved by combining goal ID and date,
    returning the most recent rating for that combination, while non-existent
    goal/date combinations properly return None.

    """
    # Arrange - create user, goal, and rating
    user = db.users.create("+1234567890", "America/New_York")
    goal = db.goals.create(user.id, "🎯", "Learn Python")
    db.ratings.create(goal.id, 3)

    # Get today's date (UTC to match SQLite CURRENT_TIMESTAMP)
    today = datetime.now(UTC).strftime("%Y-%m-%d")

    # Test retrieving rating by goal and date
    retrieved_rating = db.ratings.get_by_goal_and_date(goal.id, today)

    # Assert rating found
    assert retrieved_rating is not None
    assert retrieved_rating.user_goal_id == goal.id
    assert retrieved_rating.rating == 3

    # Test non-existent date
    non_existent_rating = db.ratings.get_by_goal_and_date(
        goal.id,
        "2020-01-01",
    )
    assert non_existent_rating is None

    # Test non-existent goal
    non_existent_rating = db.ratings.get_by_goal_and_date(999, today)
    assert non_existent_rating is None


def test_get_all_ratings() -> None:
    """Test retrieving all ratings from the database.

    Verifies that all rating records are returned with complete field data,
    and that all ratings contain values within the valid range (1-3).

    """
    # Arrange - create user, goals, and ratings
    user = db.users.create("+1234567890", "America/New_York")
    goal1 = db.goals.create(user.id, "🎯", "Learn Python")
    goal2 = db.goals.create(user.id, "💪", "Exercise")
    goal3 = db.goals.create(user.id, "📚", "Read books")

    db.ratings.create(goal1.id, 3)
    db.ratings.create(goal2.id, 2)
    db.ratings.create(goal3.id, 1)

    # Act
    all_ratings = db.ratings.get_all()

    # Assert correct count
    assert len(all_ratings) == 3

    # Verify all ratings have required fields
    for rating in all_ratings:
        assert rating.id is not None
        assert rating.user_goal_id is not None
        assert rating.rating is not None
        assert rating.rating_date is not None
        assert rating.created_at is not None
        assert rating.rating in [1, 2, 3]


def test_update_rating() -> None:
    """Test updating rating information with optional fields.

    Verifies that individual fields (rating value, user_goal_id, rating_date)
    can be updated independently or together, and that unchanged fields retain
    their original values. Also tests that calling without fields returns the
    existing rating.

    """
    # Arrange - create user, goals, and rating
    user = db.users.create("+1234567890", "America/New_York")
    goal1 = db.goals.create(user.id, "🎯", "Learn Python")
    goal2 = db.goals.create(user.id, "💪", "Exercise")
    rating = db.ratings.create(goal1.id, 3)

    # Test updating rating value only
    updated_rating = db.ratings.update(rating.id, rating=2)

    assert updated_rating.rating == 2
    assert updated_rating.user_goal_id == goal1.id

    # Test updating user_goal_id only
    updated_rating = db.ratings.update(rating.id, user_goal_id=goal2.id)

    assert updated_rating.user_goal_id == goal2.id
    assert updated_rating.rating == 2

    # Test updating rating_date
    new_date = "2024-01-01"
    updated_rating = db.ratings.update(rating.id, rating_date=new_date)

    # Check that date was updated - Model field is datetime, SQLite stores string.
    # The Table.update method might need to handle this if it returns Model.
    # The Model has rating_date: datetime.
    # If we pass string to update, and the helper converts row to Model,
    # it might fail if it tries to parse or just stores string in datetime field.
    # Assuming for now it works like before (duck typing or string).
    assert new_date in str(updated_rating.rating_date)

    # Test updating all fields
    updated_rating = db.ratings.update(
        rating.id,
        user_goal_id=goal1.id,
        rating=1,
        rating_date="2024-06-15",
    )

    assert updated_rating.user_goal_id == goal1.id
    assert updated_rating.rating == 1

    # Test updating with no fields returns existing rating
    unchanged_rating = db.ratings.update(rating.id)
    assert unchanged_rating.id == rating.id


def test_delete_rating() -> None:
    """Test deleting a rating from the database.

    Verifies that a rating can be successfully deleted by ID and that
    subsequent attempts to retrieve the deleted rating return None.

    """
    # Arrange - create user, goal, and rating
    user = db.users.create("+1234567890", "America/New_York")
    goal = db.goals.create(user.id, "🎯", "Learn Python")
    rating = db.ratings.create(goal.id, 3)
    rating_id = rating.id

    # Verify rating exists
    assert db.ratings.get(rating_id) is not None

    # Act - delete the rating
    db.ratings.delete(rating_id)

    # Assert rating is deleted
    deleted_rating = db.ratings.get(rating_id)
    assert deleted_rating is None
