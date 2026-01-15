"""Tests for individual handlers in text_handlers logic."""

import json
from datetime import UTC, datetime
from unittest.mock import patch

import pytest

from loglife.app.config import (
    ERROR_ADD_GOAL_FIRST,
    ERROR_INVALID_DELETE_FORMAT,
    ERROR_INVALID_GOAL_NUMBER,
    ERROR_INVALID_TIME_FORMAT,
    ERROR_INVALID_UPDATE_FORMAT,
    ERROR_NO_GOALS_SET,
    HELP_MESSAGE,
    SUCCESS_GOAL_ADDED,
    SUCCESS_JOURNALING_ENABLED,
    SUCCESS_TRANSCRIPT_DISABLED,
    SUCCESS_TRANSCRIPT_ENABLED,
    USAGE_RATE,
)
from loglife.app.db import db
from loglife.app.db.tables import User
from loglife.app.logic.text.handlers import (
    AddGoalHandler,
    CallHandler,
    CheckinHandler,
    DeleteGoalHandler,
    EditTimeHandler,
    EnableJournalingHandler,
    GoalsListHandler,
    HabitsHandler,
    HelpHandler,
    JournalPromptsHandler,
    ListHandler,
    LookbackHandler,
    MenuHandler,
    RateAllHandler,
    RateSingleHandler,
    ReminderTimeHandler,
    TranscriptToggleHandler,
    UpdateReminderHandler,
    WeekSummaryHandler,
)


# Helper to create a user
@pytest.fixture
def user() -> User:
    """Create a test user."""
    return db.users.create("+1234567890", "UTC")


def test_add_goal(user: User) -> None:
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
    updated_user = db.users.get(user.id)
    assert updated_user.state == "awaiting_reminder_time"
    temp = json.loads(updated_user.state_data)
    assert temp["goal_id"] == goals[0].id


def test_add_goal_empty(user: User) -> None:
    """Test AddGoalHandler with empty message."""
    handler = AddGoalHandler()
    message = "add goal"
    assert handler.matches(message)
    response = handler.handle(user, message)
    assert response is None


def test_enable_journaling(user: User) -> None:
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


def test_enable_journaling_existing(user: User) -> None:
    """Test EnableJournalingHandler when already enabled."""
    handler = EnableJournalingHandler()
    handler.handle(user, "enable journaling")  # Create it first

    response = handler.handle(user, "enable journaling")
    assert SUCCESS_JOURNALING_ENABLED in response

    goals = db.goals.get_by_user(user.id)
    assert len(goals) == 1


def test_journal_prompts(user: User) -> None:
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
    db.ratings.create(goal1.id, 3)

    response = handler.handle(user, "journal prompts")
    assert "Run" not in response
    assert "Read" in response

    # Rate all
    db.ratings.create(goal2.id, 3)
    response = handler.handle(user, "journal prompts")
    assert "Did you complete the goals?" not in response


def test_delete_goal(user: User) -> None:
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


def test_delete_goal_invalid(user: User) -> None:
    """Test DeleteGoalHandler with invalid inputs."""
    handler = DeleteGoalHandler()
    response = handler.handle(user, "delete invalid")
    assert ERROR_INVALID_DELETE_FORMAT in response

    db.goals.create(user.id, "🏃", "Run")
    response = handler.handle(user, "delete 99")
    assert ERROR_INVALID_GOAL_NUMBER in response


def test_reminder_time(user: User) -> None:
    """Test ReminderTimeHandler."""
    handler = ReminderTimeHandler()
    message = "10:00"
    assert handler.matches(message)

    # Setup state
    goal = db.goals.create(user.id, "🏃", "Run")
    db.users.set_state(
        user.id,
        state="awaiting_reminder_time",
        state_data=json.dumps({"goal_id": goal.id}),
    )

    response = handler.handle(user, message)
    assert "remind you daily at 10:00 AM" in response

    updated_goal = db.goals.get(goal.id)
    assert str(updated_goal.reminder_time) == "10:00:00"

    # Check state cleared
    updated_user = db.users.get(user.id)
    assert updated_user.state is None


def test_reminder_time_no_state(user: User) -> None:
    """Test ReminderTimeHandler without proper state."""
    handler = ReminderTimeHandler()
    response = handler.handle(user, "10:00")
    assert ERROR_ADD_GOAL_FIRST in response


def test_goals_list(user: User) -> None:
    """Test GoalsListHandler."""
    handler = GoalsListHandler()
    assert handler.matches("goals")

    # No goals
    response = handler.handle(user, "goals")
    assert response == ERROR_NO_GOALS_SET

    # With goals
    g1 = db.goals.create(user.id, "🏃", "Run")
    db.goals.update(g1.id, reminder_time="09:00:00")

    response = handler.handle(user, "goals")
    assert "1. 🏃 Run" in response
    assert "⏰ 09:00 AM" in response


def test_update_reminder(user: User) -> None:
    """Test UpdateReminderHandler."""
    handler = UpdateReminderHandler()
    assert handler.matches("update 1 8pm")

    goal = db.goals.create(user.id, "🏃", "Run")

    # Create new reminder
    response = handler.handle(user, "update 1 8pm")
    assert "Reminder updated" in response
    assert "08:00 PM" in response

    updated_goal = db.goals.get(goal.id)
    assert str(updated_goal.reminder_time) == "20:00:00"

    # Update existing
    response = handler.handle(user, "update 1 9pm")
    updated_goal = db.goals.get(goal.id)
    assert str(updated_goal.reminder_time) == "21:00:00"


def test_update_reminder_invalid(user: User) -> None:
    """Test UpdateReminderHandler with invalid inputs."""
    handler = UpdateReminderHandler()

    response = handler.handle(user, "update")
    assert ERROR_INVALID_UPDATE_FORMAT in response

    response = handler.handle(user, "update 1 invalid")
    assert ERROR_INVALID_TIME_FORMAT in response

    response = handler.handle(user, "update 1 10pm")  # No goals yet
    assert ERROR_INVALID_GOAL_NUMBER in response


def test_transcript_toggle(user: User) -> None:
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


def test_week_summary(user: User) -> None:
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


def test_lookback(user: User) -> None:
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


def test_rate_single(user: User) -> None:
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


def test_rate_single_invalid(user: User) -> None:
    """Test RateSingleHandler with invalid inputs."""
    handler = RateSingleHandler()

    response = handler.handle(user, "rate")
    assert response == USAGE_RATE

    # No goals
    response = handler.handle(user, "rate 1 3")
    assert response == ERROR_NO_GOALS_SET


def test_rate_all(user: User) -> None:
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


def test_rate_all_invalid_length(user: User) -> None:
    """Test RateAllHandler with invalid length."""
    handler = RateAllHandler()
    db.goals.create(user.id, "🏃", "Run")

    response = handler.handle(user, "33")
    assert "Invalid input" in response
    assert "Send 1 digits" in response


def test_add_goal_special_chars(user: User) -> None:
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


def test_add_goal_very_long(user: User) -> None:
    """Test adding a goal with a very long description."""
    handler = AddGoalHandler()
    long_desc = "a" * 1000
    message = f"add goal 🏃 {long_desc}"

    response = handler.handle(user, message)
    assert SUCCESS_GOAL_ADDED in response

    goals = db.goals.get_by_user(user.id)
    assert goals[0].goal_description == long_desc


def test_rate_single_out_of_bounds(user: User) -> None:
    """Test rating with values outside valid range."""
    handler = RateSingleHandler()
    db.goals.create(user.id, "🏃", "Run")

    # Rating 0
    assert handler.handle(user, "rate 1 0") == USAGE_RATE
    # Rating 4
    assert handler.handle(user, "rate 1 4") == USAGE_RATE
    # Rating negative
    assert handler.handle(user, "rate 1 -1") == USAGE_RATE


def test_rate_single_goal_number_overflow(user: User) -> None:
    """Test rating a goal number that doesn't exist (too high)."""
    handler = RateSingleHandler()
    db.goals.create(user.id, "🏃", "Run")

    # Only 1 goal exists, try to rate goal 2
    assert handler.handle(user, "rate 2 3") == USAGE_RATE


def test_delete_goal_overflow(user: User) -> None:
    """Test deleting a goal number that is too high."""
    handler = DeleteGoalHandler()
    db.goals.create(user.id, "🏃", "Run")

    response = handler.handle(user, "delete 2")
    assert ERROR_INVALID_GOAL_NUMBER in response


def test_delete_goal_zero_or_negative(user: User) -> None:
    """Test deleting goal 0 or negative."""
    handler = DeleteGoalHandler()
    db.goals.create(user.id, "🏃", "Run")

    response = handler.handle(user, "delete 0")
    assert ERROR_INVALID_GOAL_NUMBER in response

    response = handler.handle(user, "delete -1")
    assert ERROR_INVALID_GOAL_NUMBER in response


def test_lookback_negative_days(user: User) -> None:
    """Test lookback with negative days."""
    handler = LookbackHandler()
    db.goals.create(user.id, "🏃", "Run")

    # Falls back to default 7 days
    response = handler.handle(user, "lookback -5")
    assert "7 Days" in response


def test_lookback_huge_days(user: User) -> None:
    """Test lookback with a huge number of days."""
    handler = LookbackHandler()
    db.goals.create(user.id, "🏃", "Run")

    response = handler.handle(user, "lookback 1000")
    assert "1000 Days" in response


def test_help_handler(user: User) -> None:
    """Test HelpHandler."""
    handler = HelpHandler()
    assert handler.matches("help")
    assert not handler.matches("help me")
    assert not handler.matches("no help")

    response = handler.handle(user, "help")
    assert response == HELP_MESSAGE


def test_list_handler(user: User) -> None:
    """Test ListHandler."""
    handler = ListHandler()
    assert handler.matches("list")
    assert not handler.matches("list goals")
    assert not handler.matches("listing")

    with patch("loglife.app.logic.text.handlers.send_whatsapp_list_message") as mock_send:
        response = handler.handle(user, "list")
        assert response is None
        mock_send.assert_called_once()
        call_args = mock_send.call_args
        assert call_args[1]["number"] == user.phone_number
        assert "LogLife Commands" in call_args[1]["body"]
        assert len(call_args[1]["sections"]) == 3


def test_menu_handler(user: User) -> None:
    """Test MenuHandler."""
    handler = MenuHandler()
    assert handler.matches("menu")
    assert not handler.matches("menu item")
    assert not handler.matches("show menu")

    with patch("loglife.app.logic.text.handlers.send_whatsapp_reply_buttons") as mock_send:
        response = handler.handle(user, "menu")
        assert response is None
        mock_send.assert_called_once()
        call_args = mock_send.call_args
        assert call_args[1]["number"] == user.phone_number
        assert "LogLife Menu" in call_args[1]["text"]
        assert len(call_args[1]["buttons"]) == 3


def test_checkin_handler(user: User) -> None:
    """Test CheckinHandler."""
    handler = CheckinHandler()
    assert handler.matches("checkin")
    assert not handler.matches("checkin now")
    assert not handler.matches("check in")

    with patch("loglife.app.logic.text.handlers.send_whatsapp_reply_buttons") as mock_send:
        response = handler.handle(user, "checkin")
        assert response is None
        mock_send.assert_called_once()
        call_args = mock_send.call_args
        assert call_args[1]["number"] == user.phone_number
        assert "Check in" in call_args[1]["text"]
        assert len(call_args[1]["buttons"]) == 2


def test_call_handler(user: User) -> None:
    """Test CallHandler."""
    handler = CallHandler()
    assert handler.matches("call")
    assert not handler.matches("call me")
    assert not handler.matches("phone call")

    with (
        patch("loglife.app.logic.text.handlers.WHATSAPP_CLIENT_TYPE", "business_api"),
        patch("loglife.app.logic.text.handlers.send_whatsapp_cta_url") as mock_send_cta,
        patch("loglife.app.logic.text.handlers.generate_short_token") as mock_token,
    ):
        mock_token.return_value = "test_token_123"
        response = handler.handle(user, "call")
        assert response is None
        assert mock_send_cta.call_count == 4
        # Verify all 4 buttons were sent
        calls = mock_send_cta.call_args_list
        assert len(calls) == 4
        assert all(call[1]["number"] == user.phone_number for call in calls)

    with (
        patch("loglife.app.logic.text.handlers.WHATSAPP_CLIENT_TYPE", "web"),
        patch("loglife.app.logic.text.handlers.send_whatsapp_message") as mock_send_msg,
        patch("loglife.app.logic.text.handlers.generate_short_token") as mock_token,
    ):
        mock_token.return_value = "test_token_123"
        response = handler.handle(user, "call")
        assert response is None
        mock_send_msg.assert_called_once()
        call_args = mock_send_msg.call_args
        assert call_args[0][0] == user.phone_number
        assert "Check in" in call_args[0][1]
        assert "Goal Setup" in call_args[0][1]


def test_edit_time_handler(user: User) -> None:
    """Test EditTimeHandler."""
    handler = EditTimeHandler()
    assert handler.matches("edit time")
    assert not handler.matches("edit")
    assert not handler.matches("time")

    response = handler.handle(user, "edit time")
    assert response == "Edit Time"


def test_habits_handler(user: User) -> None:
    """Test HabitsHandler."""
    handler = HabitsHandler()
    assert handler.matches("habits")
    assert not handler.matches("habit")
    assert not handler.matches("my habits")

    # No goals
    response = handler.handle(user, "habits")
    assert response == ERROR_NO_GOALS_SET

    # With goals - should delegate to WeekSummaryHandler
    db.goals.create(user.id, "🏃", "Run")
    response = handler.handle(user, "habits")
    assert "Week" in response
    assert "🏃" in response
