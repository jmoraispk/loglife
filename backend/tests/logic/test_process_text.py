"""Tests for process_text logic."""

import json
from datetime import UTC, datetime

from app.config import ERROR_NO_GOALS_SET
from app.db.operations import goal_ratings, goal_reminders, user_goals, user_states, users
from app.logic.text.processor import process_text
from app.logic.text.handlers import _extract_emoji


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


# is_valid_rating is no longer exposed in the same way or needed for this level of testing
# as it is tested via RateAllHandler in test_process_text_handlers.py


def test_process_text_add_goal() -> None:
    """Test adding a new goal."""
    user = users.create_user("+1234567890", "UTC")

    response = process_text(user, "add goal 🏃 Run 5k")

    assert "Goal Added successfully" in response

    # Verify goal created
    goals = user_goals.get_user_goals(user["id"])
    assert len(goals) == 1
    assert goals[0]["goal_emoji"] == "🏃"
    assert goals[0]["goal_description"] == "run 5k"

    # Verify state transition
    state = user_states.get_user_state(user["id"])
    assert state["state"] == "awaiting_reminder_time"
    temp = json.loads(state["temp_data"])
    assert temp["goal_id"] == goals[0]["id"]


def test_process_text_set_reminder_time() -> None:
    """Test setting reminder time after adding a goal."""
    user = users.create_user("+1234567890", "UTC")
    # Setup state as if goal was just added
    goal = user_goals.create_goal(user["id"], "🏃", "Run 5k")
    user_states.create_user_state(
        user["id"],
        state="awaiting_reminder_time",
        temp_data=json.dumps({"goal_id": goal["id"]}),
    )

    response = process_text(user, "10:00")

    assert "remind you daily at 10:00 AM" in response

    # Verify reminder created
    reminder = goal_reminders.get_goal_reminder_by_goal_id(goal["id"])
    assert reminder is not None
    assert reminder["reminder_time"] == "10:00:00"

    # Verify state cleared
    assert user_states.get_user_state(user["id"]) is None


def test_process_text_list_goals() -> None:
    """Test listing goals."""
    user = users.create_user("+1234567890", "UTC")

    # No goals case
    response = process_text(user, "goals")
    assert response == ERROR_NO_GOALS_SET

    # With goals
    user_goals.create_goal(user["id"], "🏃", "Run 5k")
    user_goals.create_goal(user["id"], "📚", "Read")

    response = process_text(user, "goals")
    assert "1. 🏃 Run 5k" in response
    assert "2. 📚 Read" in response


def test_process_text_delete_goal() -> None:
    """Test deleting a goal."""
    user = users.create_user("+1234567890", "UTC")
    user_goals.create_goal(user["id"], "🏃", "Run 5k")

    response = process_text(user, "delete 1")

    assert "Goal deleted" in response
    assert len(user_goals.get_user_goals(user["id"])) == 0


def test_process_text_rate_single_goal() -> None:
    """Test rating a single goal."""
    user = users.create_user("+1234567890", "UTC")
    goal = user_goals.create_goal(user["id"], "🏃", "Run 5k")

    response = process_text(user, "rate 1 3")

    assert "✅" in response
    assert "Run 5k" in response

    # Verify rating created
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    rating = goal_ratings.get_rating_by_goal_and_date(goal["id"], today)
    assert rating["rating"] == 3


def test_process_text_rate_all_goals() -> None:
    """Test rating all goals at once."""
    user = users.create_user("+1234567890", "UTC")
    goal1 = user_goals.create_goal(user["id"], "🏃", "Run")
    goal2 = user_goals.create_goal(user["id"], "📚", "Read")

    response = process_text(user, "32")  # Rate goal 1 as 3, goal 2 as 2

    assert "✅" in response  # Success symbol
    assert "⚠️" in response  # Partial symbol

    # Verify ratings
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    r1 = goal_ratings.get_rating_by_goal_and_date(goal1["id"], today)
    r2 = goal_ratings.get_rating_by_goal_and_date(goal2["id"], today)
    assert r1["rating"] == 3
    assert r2["rating"] == 2


def test_process_text_update_reminder() -> None:
    """Test updating a reminder."""
    user = users.create_user("+1234567890", "UTC")
    goal = user_goals.create_goal(user["id"], "🏃", "Run")
    goal_reminders.create_goal_reminder(user["id"], goal["id"], "09:00:00")

    response = process_text(user, "update 1 10pm")

    assert "Reminder updated" in response
    assert "10:00 PM" in response

    reminder = goal_reminders.get_goal_reminder_by_goal_id(goal["id"])
    assert reminder["reminder_time"] == "22:00:00"


def test_process_text_transcript_toggle() -> None:
    """Test toggling transcript settings."""
    user = users.create_user("+1234567890", "UTC")

    response = process_text(user, "transcript on")
    assert "Transcript files enabled" in response
    assert users.get_user(user["id"])["send_transcript_file"] == 1

    response = process_text(user, "transcript off")
    assert "Transcript files disabled" in response
    assert users.get_user(user["id"])["send_transcript_file"] == 0


def test_process_text_week_summary() -> None:
    """Test week summary command."""
    user = users.create_user("+1234567890", "UTC")
    user_goals.create_goal(user["id"], "🏃", "Run")

    response = process_text(user, "week")

    assert "Week" in response
    assert "🏃" in response


def test_process_text_lookback() -> None:
    """Test lookback command."""
    user = users.create_user("+1234567890", "UTC")
    user_goals.create_goal(user["id"], "🏃", "Run")

    response = process_text(user, "lookback 3")

    assert "3 Days" in response
    assert "🏃" in response


def test_process_text_enable_journaling() -> None:
    """Test enable journaling shortcut."""
    user = users.create_user("+1234567890", "UTC")

    response = process_text(user, "enable journaling")
    assert "When you would like to be reminded?" in response

    goals = user_goals.get_user_goals(user["id"])
    assert any(g["goal_emoji"] == "📓" and "journaling" in g["goal_description"] for g in goals)

    # Test duplicate check
    response = process_text(user, "enable journaling")
    assert "already have a journaling goal" in response


def test_process_text_journal_prompts() -> None:
    """Test journal prompts command."""
    user = users.create_user("+1234567890", "UTC")

    # Create goals
    goal1 = user_goals.create_goal(user["id"], "🏃", "Run")
    goal2 = user_goals.create_goal(user["id"], "📚", "Read")

    # Case 1: Goals not tracked
    response = process_text(user, "journal prompts")
    assert "Time to reflect on your day" in response
    assert "Did you complete the goals?" in response
    assert "Run" in response
    assert "Read" in response

    # Case 2: One goal tracked
    goal_ratings.create_rating(goal1["id"], 3)
    response = process_text(user, "journal prompts")
    assert "Run" not in response
    assert "Read" in response

    # Case 3: All goals tracked
    goal_ratings.create_rating(goal2["id"], 3)
    response = process_text(user, "journal prompts")
    assert "Did you complete the goals?" not in response


def test_process_text_journal_now() -> None:
    """Test journal now command."""
    user = users.create_user("+1234567890", "UTC")

    # Create goals
    goal1 = user_goals.create_goal(user["id"], "🏃", "Run")

    # Case 1: Goals not tracked
    response = process_text(user, "journal now")
    assert "Time to reflect on your day" in response
    assert "Did you complete the goals?" in response
    assert "Run" in response

    # Case 2: Goal tracked
    goal_ratings.create_rating(goal1["id"], 3)
    response = process_text(user, "journal now")
    assert "Time to reflect on your day" in response
    assert "Did you complete the goals?" not in response


def test_process_text_help() -> None:
    """Test help command."""
    user = users.create_user("+1234567890", "UTC")
    response = process_text(user, "help")
    assert "LogLife Commands" in response


def test_process_text_invalid() -> None:
    """Test invalid command."""
    user = users.create_user("+1234567890", "UTC")
    response = process_text(user, "notacommand")
    assert "Wrong command" in response
