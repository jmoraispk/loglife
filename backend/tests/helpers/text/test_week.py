"""Tests for weekly look-back summary helpers."""

from datetime import datetime
import backend.app.helpers.text.week as week_module


def test_get_monday_before():
    """Test that get_monday_before returns a Monday in the current week."""
    result = week_module.get_monday_before()
    now = datetime.now()
    assert (
        result.weekday() == 0
    )  # Check that the result is a Monday (weekday() returns 0 for Monday)
    # Check that the Monday is in the past or today
    assert result <= now
    assert (now - result).days <= 6


def test_look_back_summary(mocker):
    """
    Test look-back summary generation with goals and ratings.

    Verifies that the function correctly handles empty goal lists,
    formats markdown output properly, and includes goal ratings
    for multiple days in the summary.

    Arguments:
        mocker: pytest-mock fixture for patching dependencies
    """
    # Test with no goals
    mocker.patch.object(week_module, "get_user_goals", return_value=[])
    result = week_module.look_back_summary(
        user_id=1, days=3, start=datetime(2024, 1, 1)
    )
    assert "No goals set" in result

    # Test with goals and ratings
    mocker.patch.object(
        week_module,
        "get_user_goals",
        return_value=[
            {"id": 1, "goal_emoji": "💪", "goal_description": "Exercise"},
        ],
    )
    mocker.patch.object(
        week_module, "get_rating_by_goal_and_date", return_value={"rating": 3}
    )

    start = datetime(2024, 1, 1)
    result = week_module.look_back_summary(user_id=1, days=2, start=start)

    # Check markdown format
    assert result.startswith("```")
    assert result.endswith("```")
    # Check days are included
    assert "Mon" in result
    assert "Tue" in result
    # Check status symbol
    assert "✅" in result
