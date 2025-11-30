"""Tests for individual handlers in text_handlers logic."""

import json
from datetime import UTC, datetime

import pytest
from app.config.messages import (
    ERROR_ADD_GOAL_FIRST,
    ERROR_INVALID_DELETE_FORMAT,
    ERROR_INVALID_GOAL_NUMBER,
    ERROR_INVALID_TIME_FORMAT,
    ERROR_INVALID_UPDATE_FORMAT,
    ERROR_NO_GOALS_SET,
    SUCCESS_GOAL_ADDED,
    SUCCESS_JOURNALING_ENABLED,
    SUCCESS_TRANSCRIPT_DISABLED,
    SUCCESS_TRANSCRIPT_ENABLED,
    USAGE_RATE,
)
from app.db.client import db
from app.logic.text.handlers import (
    AddGoalHandler,
    DeleteGoalHandler,
    EnableJournalingHandler,
    GoalsListHandler,
    JournalPromptsHandler,
    LookbackHandler,
    RateAllHandler,
    RateSingleHandler,
    ReminderTimeHandler,
    TranscriptToggleHandler,
    UpdateReminderHandler,
    WeekSummaryHandler,
)


# Helper to create a user
@pytest.fixture
def user():
    return db.users.create("+1234567890", "UTC")


def test_add_goal(user):
    """Test AddGoalHandler."""
    handler = AddGoalHandler()
    message = "add goal 🏃 Run 5k"
    assert handler.matches(message)
    response = handler.handle(user, message)

    assert SUCCESS_GOAL_ADDED in response

    # Verify goal created
    goals = db.goals.get_by_user(user.id)
    assert len(goals) == 1
    assert goals[0].goal_emoji == "🏃"
    assert goals[0].goal_description == "Run 5k"

    # Verify state transition
    state = db.user_states.get(user.id)
    assert state.state == "awaiting_reminder_time"
    temp = json.loads(state.temp_data)
    assert temp["goal_id"] == goals[0].id


def test_add_goal_empty(user):
    """Test AddGoalHandler with empty message."""
    handler = AddGoalHandler()
    message = "add goal"
    assert handler.matches(message)
    response = handler.handle(user, message)
    assert response is None


def test_enable_journaling(user):
    """Test EnableJournalingHandler."""
    handler = EnableJournalingHandler()
    message = "enable journaling"
    assert handler.matches(message)
    response = handler.handle(user, message)
    assert SUCCESS_GOAL_ADDED in response

    goals = db.goals.get_by_user(user.id)
    assert len(goals) == 1
    assert goals[0].goal_emoji == "📓"
    assert "journaling" in goals[0].goal_description


def test_enable_journaling_existing(user):
    """Test EnableJournalingHandler when already enabled."""
    handler = EnableJournalingHandler()
    handler.handle(user, "enable journaling")  # Create it first

    response = handler.handle(user, "enable journaling")
    assert SUCCESS_JOURNALING_ENABLED in response

    goals = db.goals.get_by_user(user.id)
    assert len(goals) == 1


def test_journal_prompts(user):
    """Test JournalPromptsHandler."""
    handler = JournalPromptsHandler()
    assert handler.matches("journal prompts")

    # Setup goals
    goal1 = db.goals.create(user.id, "🏃", "Run")
    goal2 = db.goals.create(user.id, "📚", "Read")

    # No ratings today
    response = handler.handle(user, "journal prompts")
    assert "Did you complete the goals?" in response
    assert "Run" in response
    assert "Read" in response

    # Rate one
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    db.ratings.create(goal1.id, 3)

    response = handler.handle(user, "journal prompts")
    assert "Run" not in response
    assert "Read" in response

    # Rate all
    db.ratings.create(goal2.id, 3)
    response = handler.handle(user, "journal prompts")
    assert "Did you complete the goals?" not in response


def test_delete_goal(user):
    """Test DeleteGoalHandler."""
    handler = DeleteGoalHandler()
    message = "delete 1"
    assert handler.matches(message)

    db.goals.create(user.id, "🏃", "Run")

    response = handler.handle(user, message)
    assert "Goal deleted" in response
    assert "Run" in response

    goals = db.goals.get_by_user(user.id)
    assert len(goals) == 0


def test_delete_goal_invalid(user):
    """Test DeleteGoalHandler with invalid inputs."""
    handler = DeleteGoalHandler()
    response = handler.handle(user, "delete invalid")
    assert ERROR_INVALID_DELETE_FORMAT in response

    db.goals.create(user.id, "🏃", "Run")
    response = handler.handle(user, "delete 99")
    assert ERROR_INVALID_GOAL_NUMBER in response


def test_reminder_time(user):
    """Test ReminderTimeHandler."""
    handler = ReminderTimeHandler()
    message = "10:00"
    assert handler.matches(message)

    # Setup state
    goal = db.goals.create(user.id, "🏃", "Run")
    db.user_states.create(
        user.id, state="awaiting_reminder_time", temp_data=json.dumps({"goal_id": goal.id})
    )

    response = handler.handle(user, message)
    assert "remind you daily at 10:00 AM" in response

    reminder = db.reminders.get_by_goal_id(goal.id)
    assert str(reminder.reminder_time) == "10:00:00"

    # Check state cleared
    assert db.user_states.get(user.id) is None


def test_reminder_time_no_state(user):
    """Test ReminderTimeHandler without proper state."""
    handler = ReminderTimeHandler()
    response = handler.handle(user, "10:00")
    assert ERROR_ADD_GOAL_FIRST in response


def test_goals_list(user):
    """Test GoalsListHandler."""
    handler = GoalsListHandler()
    assert handler.matches("goals")

    # No goals
    response = handler.handle(user, "goals")
    assert response == ERROR_NO_GOALS_SET

    # With goals
    g1 = db.goals.create(user.id, "🏃", "Run")
    db.reminders.create(user.id, g1.id, "09:00:00")

    response = handler.handle(user, "goals")
    assert "1. 🏃 Run" in response
    assert "⏰ 09:00 AM" in response


def test_update_reminder(user):
    """Test UpdateReminderHandler."""
    handler = UpdateReminderHandler()
    assert handler.matches("update 1 8pm")

    goal = db.goals.create(user.id, "🏃", "Run")

    # Create new reminder
    response = handler.handle(user, "update 1 8pm")
    assert "Reminder updated" in response
    assert "08:00 PM" in response

    reminder = db.reminders.get_by_goal_id(goal.id)
    assert str(reminder.reminder_time) == "20:00:00"

    # Update existing
    response = handler.handle(user, "update 1 9pm")
    reminder = db.reminders.get_by_goal_id(goal.id)
    assert str(reminder.reminder_time) == "21:00:00"


def test_update_reminder_invalid(user):
    """Test UpdateReminderHandler with invalid inputs."""
    handler = UpdateReminderHandler()

    response = handler.handle(user, "update")
    assert ERROR_INVALID_UPDATE_FORMAT in response

    response = handler.handle(user, "update 1 invalid")
    assert ERROR_INVALID_TIME_FORMAT in response

    response = handler.handle(user, "update 1 10pm")  # No goals yet
    assert ERROR_INVALID_GOAL_NUMBER in response


def test_transcript_toggle(user):
    """Test TranscriptToggleHandler."""
    handler = TranscriptToggleHandler()
    assert handler.matches("transcript on")

    response = handler.handle(user, "transcript on")
    assert SUCCESS_TRANSCRIPT_ENABLED in response
    assert db.users.get(user.id).send_transcript_file == 1

    response = handler.handle(user, "transcript off")
    assert SUCCESS_TRANSCRIPT_DISABLED in response
    assert db.users.get(user.id).send_transcript_file == 0

    response = handler.handle(user, "transcript invalid")
    assert "Invalid command" in response


def test_week_summary(user):
    """Test WeekSummaryHandler."""
    handler = WeekSummaryHandler()
    assert handler.matches("week")

    # No goals
    response = handler.handle(user, "week")
    assert response == ERROR_NO_GOALS_SET

    # With goals
    db.goals.create(user.id, "🏃", "Run")
    response = handler.handle(user, "week")
    assert "Week" in response
    assert "🏃" in response


def test_lookback(user):
    """Test LookbackHandler."""
    handler = LookbackHandler()
    assert handler.matches("lookback")

    # No goals
    response = handler.handle(user, "lookback")
    assert response == ERROR_NO_GOALS_SET

    # With goals
    db.goals.create(user.id, "🏃", "Run")

    # Default 7 days
    response = handler.handle(user, "lookback")
    assert "7 Days" in response
    assert "🏃" in response

    # Custom days
    response = handler.handle(user, "lookback 3")
    assert "3 Days" in response


def test_rate_single(user):
    """Test RateSingleHandler."""
    handler = RateSingleHandler()
    assert handler.matches("rate 1 3")

    goal = db.goals.create(user.id, "🏃", "Run")

    response = handler.handle(user, "rate 1 3")
    assert "✅" in response  # Success symbol
    assert "Run" in response

    today = datetime.now(UTC).strftime("%Y-%m-%d")
    rating = db.ratings.get_by_goal_and_date(goal.id, today)
    assert rating.rating == 3

    # Update rating
    handler.handle(user, "rate 1 2")
    rating = db.ratings.get_by_goal_and_date(goal.id, today)
    assert rating.rating == 2


def test_rate_single_invalid(user):
    """Test RateSingleHandler with invalid inputs."""
    handler = RateSingleHandler()

    response = handler.handle(user, "rate")
    assert response == USAGE_RATE

    # No goals
    response = handler.handle(user, "rate 1 3")
    assert response == ERROR_NO_GOALS_SET


def test_rate_all(user):
    """Test RateAllHandler."""
    handler = RateAllHandler()
    assert handler.matches("31")

    # No goals
    response = handler.handle(user, "123")
    assert response == ERROR_NO_GOALS_SET

    goal1 = db.goals.create(user.id, "🏃", "Run")
    goal2 = db.goals.create(user.id, "📚", "Read")

    # Valid
    response = handler.handle(user, "31")
    assert "✅" in response  # 3
    assert "❌" in response  # 1

    today = datetime.now(UTC).strftime("%Y-%m-%d")
    r1 = db.ratings.get_by_goal_and_date(goal1.id, today)
    r2 = db.ratings.get_by_goal_and_date(goal2.id, today)
    assert r1.rating == 3
    assert r2.rating == 1


def test_rate_all_invalid_length(user):
    """Test RateAllHandler with invalid length."""
    handler = RateAllHandler()
    db.goals.create(user.id, "🏃", "Run")

    response = handler.handle(user, "33")
    assert "Invalid input" in response
    assert "Send 1 digits" in response


def test_add_goal_special_chars(user):
    """Test adding a goal with special characters and SQL injection attempts."""
    handler = AddGoalHandler()
    # SQL injection attempt
    dangerous_string = "run 5k'); DROP TABLE users; --"
    message = f"add goal 🏃 {dangerous_string}"

    response = handler.handle(user, message)
    assert SUCCESS_GOAL_ADDED in response

    # Verify it was stored literally (case-insensitive check as needed)
    goals = db.goals.get_by_user(user.id)
    assert len(goals) == 1
    assert goals[0].goal_description.lower() == dangerous_string.lower()


def test_add_goal_very_long(user):
    """Test adding a goal with a very long description."""
    handler = AddGoalHandler()
    long_desc = "a" * 1000
    message = f"add goal 🏃 {long_desc}"

    response = handler.handle(user, message)
    assert SUCCESS_GOAL_ADDED in response

    goals = db.goals.get_by_user(user.id)
    assert goals[0].goal_description == long_desc


def test_rate_single_out_of_bounds(user):
    """Test rating with values outside valid range."""
    handler = RateSingleHandler()
    db.goals.create(user.id, "🏃", "Run")

    # Rating 0
    assert handler.handle(user, "rate 1 0") == USAGE_RATE
    # Rating 4
    assert handler.handle(user, "rate 1 4") == USAGE_RATE
    # Rating negative
    assert handler.handle(user, "rate 1 -1") == USAGE_RATE


def test_rate_single_goal_number_overflow(user):
    """Test rating a goal number that doesn't exist (too high)."""
    handler = RateSingleHandler()
    db.goals.create(user.id, "🏃", "Run")

    # Only 1 goal exists, try to rate goal 2
    assert handler.handle(user, "rate 2 3") == USAGE_RATE


def test_delete_goal_overflow(user):
    """Test deleting a goal number that is too high."""
    handler = DeleteGoalHandler()
    db.goals.create(user.id, "🏃", "Run")

    response = handler.handle(user, "delete 2")
    assert ERROR_INVALID_GOAL_NUMBER in response


def test_delete_goal_zero_or_negative(user):
    """Test deleting goal 0 or negative."""
    handler = DeleteGoalHandler()
    db.goals.create(user.id, "🏃", "Run")

    response = handler.handle(user, "delete 0")
    assert ERROR_INVALID_GOAL_NUMBER in response

    response = handler.handle(user, "delete -1")
    assert ERROR_INVALID_GOAL_NUMBER in response


def test_lookback_negative_days(user):
    """Test lookback with negative days."""
    handler = LookbackHandler()
    db.goals.create(user.id, "🏃", "Run")

    # Falls back to default 7 days
    response = handler.handle(user, "lookback -5")
    assert "7 Days" in response


def test_lookback_huge_days(user):
    """Test lookback with a huge number of days."""
    handler = LookbackHandler()
    db.goals.create(user.id, "🏃", "Run")

    response = handler.handle(user, "lookback 1000")
    assert "1000 Days" in response
