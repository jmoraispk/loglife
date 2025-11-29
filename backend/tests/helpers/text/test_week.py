"""Weekly look-back text helpers for summaries."""

from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import app.logic.text.week as week_module
from app.config import LOOKBACK_NO_GOALS
from app.db.tables import Goal, Rating


def test_get_monday_before() -> None:
    """Test calculation of the previous Monday.

    Verifies that the date returned is always a Monday and is in the past
    or present (never in the future relative to "now").
    """
    monday = week_module.get_monday_before()
    assert monday.weekday() == 0
    assert monday <= datetime.now(tz=UTC)


def test_look_back_summary() -> None:
    """Test look-back summary generation with goals and ratings.

    Verifies that the function correctly handles empty goal lists,
    formats markdown output properly, and includes goal ratings
    for multiple days in the summary.
    """
    # Test with no goals
    with patch("app.db.tables.goals.GoalsTable.get_by_user", return_value=[]) as mock_get_goals:
        summary = week_module.look_back_summary(1, 7, datetime.now(UTC))
        assert summary == LOOKBACK_NO_GOALS

    # Test with goals and ratings
    goal1 = Goal(
        id=1,
        user_id=1,
        goal_emoji="🏃",
        goal_description="Run",
        boost_level=1,
        created_at=datetime.now(UTC),
    )
    goal2 = Goal(
        id=2,
        user_id=1,
        goal_emoji="📚",
        goal_description="Read",
        boost_level=1,
        created_at=datetime.now(UTC),
    )

    # Mock rating returns
    # Day 1: Goal 1 rated 3 (success), Goal 2 not rated
    # Day 2: Goal 1 rated 2 (partial), Goal 2 rated 1 (fail)
    rating_day1 = Rating(
        id=1,
        user_goal_id=1,
        rating=3,
        rating_date=datetime.now(UTC),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    rating_day2_g1 = Rating(
        id=2,
        user_goal_id=1,
        rating=2,
        rating_date=datetime.now(UTC),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    rating_day2_g2 = Rating(
        id=3,
        user_goal_id=2,
        rating=1,
        rating_date=datetime.now(UTC),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )

    with (
        patch("app.db.tables.goals.GoalsTable.get_by_user") as mock_get_goals,
        patch("app.db.tables.ratings.RatingsTable.get_by_goal_and_date") as mock_get_rating,
    ):
        mock_get_goals.return_value = [goal1, goal2]

        # We want specific ratings for specific calls.
        # look_back_summary calls get_rating_by_goal_and_date for each goal for each day.
        # If days=2, start=today:
        # Day 0: Goal 1, Goal 2
        # Day 1: Goal 1, Goal 2
        mock_get_rating.side_effect = [
            rating_day1,  # Day 0, Goal 1
            None,  # Day 0, Goal 2
            rating_day2_g1,  # Day 1, Goal 1
            rating_day2_g2,  # Day 1, Goal 2
        ]

        summary = week_module.look_back_summary(1, 2, datetime.now(UTC))

        # assert "🏃" in summary  # Goals listed - Header is added by handler, not this function
        # assert "📚" in summary
        assert "✅" in summary  # Rating 3
        assert "⚠️" in summary  # Rating 2
        assert "❌" in summary  # Rating 1
