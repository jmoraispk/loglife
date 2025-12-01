"""Weekly look-back text helpers for summaries."""

from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import loglife.app.logic.text.week as week_module
from loglife.app.config import LOOKBACK_NO_GOALS
from loglife.app.db.tables import Goal, Rating


def test_get_monday_before() -> None:
    """Test calculation of the previous Monday.

    Verifies that the date returned is always a Monday and is in the past
    or present (never in the future relative to "now").
    """
    monday = week_module.get_monday_before()
    now = datetime.now(tz=UTC)

    assert monday.weekday() == 0
    assert monday <= now
    assert (now - monday).days <= 6


def test_monday_before_edge_cases() -> None:
    """Test get_monday_before for various days of the week.

    Ensures that calling the function on different days (Monday vs Sunday vs Wednesday)
    always correctly identifies the most recent past Monday (or today if today is Monday).
    """
    # We verify the logic by strictly mocking datetime.now
    # If today is Monday (0), delta is 0
    # If today is Tuesday (1), delta is 1
    # ...
    # If today is Sunday (6), delta is 6

    # Use a known Monday as base for easy calculation.
    # Jan 1, 2024 was a Monday.
    base_monday = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)

    for i in range(7):
        # Simulating each day of the week: Monday (0) to Sunday (6)
        simulated_today = base_monday + timedelta(days=i)

        # We need to patch datetime in the module where it is used
        with patch("loglife.app.logic.text.week.datetime") as mock_datetime:
            mock_datetime.now.return_value = simulated_today

            monday = week_module.get_monday_before()

            # Expect the result to be the base_monday (same time as simulated_today)
            # because get_monday_before subtracts the days since Monday from current time.
            expected_monday = simulated_today - timedelta(days=i)

            assert monday == expected_monday
            assert monday.weekday() == 0

            # Verify the delta explicitly as requested
            # (simulated_today.date() - monday.date()).days should be i
            assert (simulated_today.date() - monday.date()).days == i


def test_look_back_summary() -> None:
    """Test look-back summary generation with goals and ratings.

    Verifies that the function correctly handles empty goal lists,
    formats markdown output properly, and includes goal ratings
    for multiple days in the summary.
    """
    # Test with no goals
    with patch(
        "loglife.app.db.tables.goals.GoalsTable.get_by_user", return_value=[],
    ) as mock_get_goals:
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
        patch("loglife.app.db.tables.goals.GoalsTable.get_by_user") as mock_get_goals,
        patch("loglife.app.db.tables.ratings.RatingsTable.get_by_goal_and_date") as mock_get_rating,
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
