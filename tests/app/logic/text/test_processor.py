"""Tests for process_text logic."""


import json
from datetime import UTC, datetime
from unittest.mock import patch

import pytest

from loglife.app.config import ERROR_NO_GOALS_SET, USAGE_RATE
from loglife.app.db.client import db
from loglife.app.db.tables import User
from loglife.app.logic import process_text
from loglife.app.logic.text.handlers import _extract_emoji


@pytest.fixture
def user() -> User:
    """Create a test user."""
    return db.users.create("+1234567890", "UTC")


def test_internal_extract_emoji() -> None:
    """Test internal _extract_emoji function."""
    test_cases = [
        ("text without emoji", "🎯"),
        ("text with emoji 🍔", "🍔"),
        ("🏃 Run 5k", "🏃"),
        ("Multiple emojis 🏃 📚", "🏃"),
    ]
    for text, expected in test_cases:
        assert _extract_emoji(text) == expected


def test_process_text_add_goal() -> None:
    """Test adding a new goal."""
    user = db.users.create("+1234567890", "UTC")

    response = process_text(user, "add goal 🏃 Run 5k")

    assert "Goal Added successfully" in response

    # Verify goal created
    goals = db.goals.get_by_user(user.id)
    assert len(goals) == 1
    assert goals[0].goal_emoji == "🏃"
    assert goals[0].goal_description == "run 5k"

    # Verify state transition
    state = db.user_states.get(user.id)
    assert state.state == "awaiting_reminder_time"
    temp = json.loads(state.temp_data)
    assert temp["goal_id"] == goals[0].id


def test_process_text_set_reminder_time() -> None:
    """Test setting reminder time after adding a goal."""
    user = db.users.create("+1234567890", "UTC")
    # Setup state as if goal was just added
    goal = db.goals.create(user.id, "🏃", "Run 5k")
    db.user_states.create(
        user.id,
        state="awaiting_reminder_time",
        temp_data=json.dumps({"goal_id": goal.id}),
    )

    response = process_text(user, "10:00")

    assert "remind you daily at 10:00 AM" in response

    # Verify reminder created
    reminder = db.reminders.get_by_goal_id(goal.id)
    assert reminder is not None
    assert str(reminder.reminder_time) == "10:00:00"

    # Verify state cleared
    assert db.user_states.get(user.id) is None


def test_process_text_list_goals() -> None:
    """Test listing goals."""
    user = db.users.create("+1234567890", "UTC")

    # No goals case
    response = process_text(user, "goals")
    assert response == ERROR_NO_GOALS_SET

    # With goals
    db.goals.create(user.id, "🏃", "Run 5k")
    db.goals.create(user.id, "📚", "Read")

    response = process_text(user, "goals")
    assert "1. 🏃 Run 5k" in response
    assert "2. 📚 Read" in response


def test_process_text_delete_goal() -> None:
    """Test deleting a goal."""
    user = db.users.create("+1234567890", "UTC")
    db.goals.create(user.id, "🏃", "Run 5k")

    response = process_text(user, "delete 1")

    assert "Goal deleted" in response
    assert len(db.goals.get_by_user(user.id)) == 0


def test_process_text_rate_single_goal() -> None:
    """Test rating a single goal."""
    user = db.users.create("+1234567890", "UTC")
    goal = db.goals.create(user.id, "🏃", "Run 5k")

    response = process_text(user, "rate 1 3")

    assert "✅" in response
    assert "Run 5k" in response

    # Verify rating created
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    rating = db.ratings.get_by_goal_and_date(goal.id, today)
    assert rating.rating == 3


def test_process_text_rate_all_goals() -> None:
    """Test rating all goals at once."""
    user = db.users.create("+1234567890", "UTC")
    goal1 = db.goals.create(user.id, "🏃", "Run")
    goal2 = db.goals.create(user.id, "📚", "Read")

    response = process_text(user, "32")  # Rate goal 1 as 3, goal 2 as 2

    assert "✅" in response  # Success symbol
    assert "⚠️" in response  # Partial symbol

    # Verify ratings
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    r1 = db.ratings.get_by_goal_and_date(goal1.id, today)
    r2 = db.ratings.get_by_goal_and_date(goal2.id, today)
    assert r1.rating == 3
    assert r2.rating == 2


def test_process_text_update_reminder() -> None:
    """Test updating a reminder."""
    user = db.users.create("+1234567890", "UTC")
    goal = db.goals.create(user.id, "🏃", "Run")
    db.reminders.create(user.id, goal.id, "09:00:00")

    response = process_text(user, "update 1 10pm")

    assert "Reminder updated" in response
    assert "10:00 PM" in response

    reminder = db.reminders.get_by_goal_id(goal.id)
    assert str(reminder.reminder_time) == "22:00:00"


def test_process_text_transcript_toggle() -> None:
    """Test toggling transcript settings."""
    user = db.users.create("+1234567890", "UTC")

    response = process_text(user, "transcript on")
    assert "Transcript files enabled" in response
    assert db.users.get(user.id).send_transcript_file == 1

    response = process_text(user, "transcript off")
    assert "Transcript files disabled" in response
    assert db.users.get(user.id).send_transcript_file == 0


def test_process_text_week_summary() -> None:
    """Test week summary command."""
    user = db.users.create("+1234567890", "UTC")
    db.goals.create(user.id, "🏃", "Run")

    response = process_text(user, "week")

    assert "Week" in response
    assert "🏃" in response


def test_process_text_lookback() -> None:
    """Test lookback command."""
    user = db.users.create("+1234567890", "UTC")
    db.goals.create(user.id, "🏃", "Run")

    response = process_text(user, "lookback 3")

    assert "3 Days" in response
    assert "🏃" in response


def test_process_text_enable_journaling() -> None:
    """Test enable journaling shortcut."""
    user = db.users.create("+1234567890", "UTC")

    response = process_text(user, "enable journaling")
    assert "When you would like to be reminded?" in response

    goals = db.goals.get_by_user(user.id)
    assert any(g.goal_emoji == "📓" and "journaling" in g.goal_description for g in goals)

    # Test duplicate check
    response = process_text(user, "enable journaling")
    assert "already have a journaling goal" in response


def test_process_text_journal_prompts() -> None:
    """Test journal prompts command."""
    user = db.users.create("+1234567890", "UTC")

    # Create goals
    goal1 = db.goals.create(user.id, "🏃", "Run")
    goal2 = db.goals.create(user.id, "📚", "Read")

    # Case 1: Goals not tracked
    response = process_text(user, "journal prompts")
    assert "Time to reflect on your day" in response
    assert "Did you complete the goals?" in response
    assert "Run" in response
    assert "Read" in response

    # Case 2: One goal tracked
    db.ratings.create(goal1.id, 3)
    response = process_text(user, "journal prompts")
    assert "Run" not in response
    assert "Read" in response

    # Case 3: All goals tracked
    db.ratings.create(goal2.id, 3)
    response = process_text(user, "journal prompts")
    assert "Did you complete the goals?" not in response


def test_process_text_journal_now() -> None:
    """Test journal now command."""
    user = db.users.create("+1234567890", "UTC")

    # Create goals
    goal1 = db.goals.create(user.id, "🏃", "Run")

    # Case 1: Goals not tracked
    response = process_text(user, "journal now")
    assert "Time to reflect on your day" in response
    assert "Did you complete the goals?" in response
    assert "Run" in response

    # Case 2: Goal tracked
    db.ratings.create(goal1.id, 3)
    response = process_text(user, "journal now")
    assert "Time to reflect on your day" in response
    assert "Did you complete the goals?" not in response


def test_process_text_help() -> None:
    """Test help command."""
    user = db.users.create("+1234567890", "UTC")
    response = process_text(user, "help")
    assert "LogLife Commands" in response


def test_process_text_invalid() -> None:
    """Test invalid command."""
    user = db.users.create("+1234567890", "UTC")
    response = process_text(user, "notacommand")
    assert "Wrong command" in response


def test_process_text_empty_string(user: User) -> None:
    """Test processing an empty string."""
    # Should return "Wrong command!" or handle gracefully
    response = process_text(user, "")
    assert "Wrong command" in response


def test_process_text_only_whitespace(user: User) -> None:
    """Test processing a string with only whitespace."""
    response = process_text(user, "   ")
    assert "Wrong command" in response


def test_add_goal_special_chars(user: User) -> None:
    """Test adding a goal with special characters and SQL injection attempts."""
    # SQL injection attempt
    dangerous_string = "run 5k'); DROP TABLE users; --"
    response = process_text(user, f"add goal 🏃 {dangerous_string}")

    assert "Goal Added successfully" in response

    # Verify it was stored literally
    goals = db.goals.get_by_user(user.id)
    assert len(goals) == 1
    # The processor lowercases input before handlers see it
    assert goals[0].goal_description == dangerous_string.lower()


def test_add_goal_very_long(user: User) -> None:
    """Test adding a goal with a very long description."""
    long_desc = "a" * 1000
    response = process_text(user, f"add goal 🏃 {long_desc}")

    assert "Goal Added successfully" in response
    goals = db.goals.get_by_user(user.id)
    assert goals[0].goal_description == long_desc


def test_rate_single_out_of_bounds(user: User) -> None:
    """Test rating with values outside valid range."""
    db.goals.create(user.id, "🏃", "Run")

    # Rating 0
    assert process_text(user, "rate 1 0") == USAGE_RATE
    # Rating 4
    assert process_text(user, "rate 1 4") == USAGE_RATE
    # Rating negative
    assert process_text(user, "rate 1 -1") == USAGE_RATE


def test_rate_single_goal_number_overflow(user: User) -> None:
    """Test rating a goal number that doesn't exist (too high)."""
    db.goals.create(user.id, "🏃", "Run")

    # Only 1 goal exists, try to rate goal 2
    assert process_text(user, "rate 2 3") == USAGE_RATE


def test_delete_goal_overflow(user: User) -> None:
    """Test deleting a goal number that is too high."""
    db.goals.create(user.id, "🏃", "Run")

    assert "Invalid goal number" in process_text(user, "delete 2")


def test_delete_goal_zero_or_negative(user: User) -> None:
    """Test deleting goal 0 or negative."""
    db.goals.create(user.id, "🏃", "Run")

    assert "Invalid goal number" in process_text(user, "delete 0")
    assert "Invalid goal number" in process_text(user, "delete -1")


def test_lookback_negative_days(user: User) -> None:
    """Test lookback with negative days."""
    db.goals.create(user.id, "🏃", "Run")

    # Negative numbers fall back to default 7 days
    response = process_text(user, "lookback -5")
    assert "7 Days" in response


def test_lookback_huge_days(user: User) -> None:
    """Test lookback with a huge number of days."""
    db.goals.create(user.id, "🏃", "Run")

    response = process_text(user, "lookback 1000")
    assert "1000 Days" in response


def test_alias_collision_partial_word(user: User) -> None:
    """Test if partial word replacement corrupts messages."""
    # Define aliases that would cause collision
    aliases = {"add": "add goal"}

    with patch("loglife.app.logic.text.processor.COMMAND_ALIASES", aliases):
        # "saddle" should NOT become "sadd goal le"
        result = process_text(user, "saddle")
        assert result == "Wrong command!"


def test_unicode_and_emojis(user: User) -> None:
    """Test handling of messages with only emojis or complex unicode."""
    # 1. Only Emoji - should generally fail unless we have an emoji handler
    assert process_text(user, "🏃") == "Wrong command!"

    # 2. Zalgo text or weird unicode - should handle gracefully
    zalgo = "Ĥell̂o"
    assert process_text(user, zalgo) == "Wrong command!"
