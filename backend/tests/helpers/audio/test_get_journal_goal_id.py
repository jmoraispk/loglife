"""Tests for get_journal_goal_id helper."""

from app.db.operations import user_goals, users
from app.helpers.audio.journaling.get_journal_goal_id import get_journal_goal_id


def test_get_journal_goal_id_found(mock_connect):
    """Test retrieving existing journal goal ID."""
    user = users.create_user("+1234567890", "UTC")
    goal = user_goals.create_goal(user["id"], "📓", "journaling")

    goal_id = get_journal_goal_id(user["id"])
    assert goal_id == goal["id"]


def test_get_journal_goal_id_not_found(mock_connect):
    """Test retrieving journal goal ID when it doesn't exist."""
    user = users.create_user("+1234567890", "UTC")
    user_goals.create_goal(user["id"], "🏃", "run")

    goal_id = get_journal_goal_id(user["id"])
    assert goal_id is None

