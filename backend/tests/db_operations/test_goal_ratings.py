"""Tests for goal_ratings database operations."""

import sqlite3
from datetime import UTC, datetime

import pytest
from app.db.operations import goal_ratings, user_goals, users


def test_create_rating(mock_connect):
    """Test creating a new goal rating with constraint validation.

    Verifies successful rating creation with values 1-3, ensures all fields
    are properly stored, and validates that ratings outside the valid range
    (0 or 4+) are rejected with an IntegrityError due to CHECK constraint.

    Arguments:
        mock_connect: Fixture providing isolated test database connection

    """
    # Arrange - create user and goal
    user = users.create_user("+1234567890", "America/New_York")
    goal = user_goals.create_goal(user["id"], "🎯", "Learn Python")

    # Test successful creation
    rating = goal_ratings.create_rating(user_goal_id=goal["id"], rating=3)

    # Assert successful creation
    assert rating is not None
    assert isinstance(rating, dict)
    assert rating["user_goal_id"] == goal["id"]
    assert rating["rating"] == 3
    assert rating["id"] is not None
    assert "rating_date" in rating
    assert "created_at" in rating

    # Test creating rating with different value
    rating2 = goal_ratings.create_rating(user_goal_id=goal["id"], rating=1)

    assert rating2["rating"] == 1

    # Test invalid rating (should fail CHECK constraint)
    with pytest.raises(sqlite3.IntegrityError):
        goal_ratings.create_rating(goal["id"], 0)

    with pytest.raises(sqlite3.IntegrityError):
        goal_ratings.create_rating(goal["id"], 4)


def test_get_rating(mock_connect):
    """Test retrieving a rating by its unique ID.

    Verifies that existing ratings can be successfully retrieved by ID with
    all expected fields, while non-existent rating IDs properly return None.

    Arguments:
        mock_connect: Fixture providing isolated test database connection

    """
    # Arrange - create user, goal, and rating
    user = users.create_user("+1234567890", "America/New_York")
    goal = user_goals.create_goal(user["id"], "🎯", "Learn Python")
    created_rating = goal_ratings.create_rating(goal["id"], 3)

    # Test retrieving existing rating
    retrieved_rating = goal_ratings.get_rating(created_rating["id"])

    # Assert existing rating
    assert retrieved_rating is not None
    assert isinstance(retrieved_rating, dict)
    assert retrieved_rating["id"] == created_rating["id"]
    assert retrieved_rating["user_goal_id"] == goal["id"]
    assert retrieved_rating["rating"] == 3

    # Test retrieving non-existent rating
    non_existent_rating = goal_ratings.get_rating(999)
    assert non_existent_rating is None


def test_get_rating_by_goal_and_date(mock_connect):
    """Test retrieving a rating by goal ID and date.

    Verifies that ratings can be retrieved by combining goal ID and date,
    returning the most recent rating for that combination, while non-existent
    goal/date combinations properly return None.

    Arguments:
        mock_connect: Fixture providing isolated test database connection

    """
    # Arrange - create user, goal, and rating
    user = users.create_user("+1234567890", "America/New_York")
    goal = user_goals.create_goal(user["id"], "🎯", "Learn Python")
    goal_ratings.create_rating(goal["id"], 3)

    # Get today's date (UTC to match SQLite CURRENT_TIMESTAMP)
    today = datetime.now(UTC).strftime("%Y-%m-%d")

    # Test retrieving rating by goal and date
    retrieved_rating = goal_ratings.get_rating_by_goal_and_date(goal["id"], today)

    # Assert rating found
    assert retrieved_rating is not None
    assert retrieved_rating["user_goal_id"] == goal["id"]
    assert retrieved_rating["rating"] == 3

    # Test non-existent date
    non_existent_rating = goal_ratings.get_rating_by_goal_and_date(
        goal["id"], "2020-01-01",
    )
    assert non_existent_rating is None

    # Test non-existent goal
    non_existent_rating = goal_ratings.get_rating_by_goal_and_date(999, today)
    assert non_existent_rating is None


def test_get_all_ratings(mock_connect):
    """Test retrieving all ratings from the database.

    Verifies that all rating records are returned with complete field data,
    and that all ratings contain values within the valid range (1-3).

    Arguments:
        mock_connect: Fixture providing isolated test database connection

    """
    # Arrange - create user, goals, and ratings
    user = users.create_user("+1234567890", "America/New_York")
    goal1 = user_goals.create_goal(user["id"], "🎯", "Learn Python")
    goal2 = user_goals.create_goal(user["id"], "💪", "Exercise")
    goal3 = user_goals.create_goal(user["id"], "📚", "Read books")

    goal_ratings.create_rating(goal1["id"], 3)
    goal_ratings.create_rating(goal2["id"], 2)
    goal_ratings.create_rating(goal3["id"], 1)

    # Act
    all_ratings = goal_ratings.get_all_ratings()

    # Assert correct count
    assert len(all_ratings) == 3

    # Verify all ratings have required fields
    for rating in all_ratings:
        assert "id" in rating
        assert "user_goal_id" in rating
        assert "rating" in rating
        assert "rating_date" in rating
        assert "created_at" in rating
        assert rating["rating"] in [1, 2, 3]


def test_update_rating(mock_connect):
    """Test updating rating information with optional fields.

    Verifies that individual fields (rating value, user_goal_id, rating_date)
    can be updated independently or together, and that unchanged fields retain
    their original values. Also tests that calling without fields returns the
    existing rating.

    Arguments:
        mock_connect: Fixture providing isolated test database connection

    """
    # Arrange - create user, goals, and rating
    user = users.create_user("+1234567890", "America/New_York")
    goal1 = user_goals.create_goal(user["id"], "🎯", "Learn Python")
    goal2 = user_goals.create_goal(user["id"], "💪", "Exercise")
    rating = goal_ratings.create_rating(goal1["id"], 3)

    # Test updating rating value only
    updated_rating = goal_ratings.update_rating(rating["id"], rating=2)

    assert updated_rating["rating"] == 2
    assert updated_rating["user_goal_id"] == goal1["id"]

    # Test updating user_goal_id only
    updated_rating = goal_ratings.update_rating(rating["id"], user_goal_id=goal2["id"])

    assert updated_rating["user_goal_id"] == goal2["id"]
    assert updated_rating["rating"] == 2

    # Test updating rating_date
    new_date = "2024-01-01"
    updated_rating = goal_ratings.update_rating(rating["id"], rating_date=new_date)

    # Check that date was updated
    assert new_date in updated_rating["rating_date"]

    # Test updating all fields
    updated_rating = goal_ratings.update_rating(
        rating["id"], user_goal_id=goal1["id"], rating=1, rating_date="2024-06-15",
    )

    assert updated_rating["user_goal_id"] == goal1["id"]
    assert updated_rating["rating"] == 1

    # Test updating with no fields returns existing rating
    unchanged_rating = goal_ratings.update_rating(rating["id"])
    assert unchanged_rating["id"] == rating["id"]


def test_delete_rating(mock_connect):
    """Test deleting a rating from the database.

    Verifies that a rating can be successfully deleted by ID and that
    subsequent attempts to retrieve the deleted rating return None.

    Arguments:
        mock_connect: Fixture providing isolated test database connection

    """
    # Arrange - create user, goal, and rating
    user = users.create_user("+1234567890", "America/New_York")
    goal = user_goals.create_goal(user["id"], "🎯", "Learn Python")
    rating = goal_ratings.create_rating(goal["id"], 3)
    rating_id = rating["id"]

    # Verify rating exists
    assert goal_ratings.get_rating(rating_id) is not None

    # Act - delete the rating
    goal_ratings.delete_rating(rating_id)

    # Assert rating is deleted
    deleted_rating = goal_ratings.get_rating(rating_id)
    assert deleted_rating is None
