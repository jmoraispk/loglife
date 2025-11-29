"""Tests for individual handlers in text_handlers logic."""

import json
from datetime import UTC, datetime

import pytest
from app.config import ERROR_NO_GOALS_SET, USAGE_RATE
from app.db.operations import (
    goal_ratings,
    goal_reminders,
    user_goals,
    user_states,
    users,
)
from app.logic.text_handlers import (
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
    return users.create_user("+1234567890", "UTC")

def test_add_goal(user):
    """Test AddGoalHandler."""
    handler = AddGoalHandler()
    message = "add goal 🏃 Run 5k"
    assert handler.matches(message)
    response = handler.handle(user, message)
    
    assert "Goal Added successfully" in response
    
    # Verify goal created
    goals = user_goals.get_user_goals(user["id"])
    assert len(goals) == 1
    assert goals[0]["goal_emoji"] == "🏃"
    assert goals[0]["goal_description"] == "Run 5k"
    
    # Verify state transition
    state = user_states.get_user_state(user["id"])
    assert state["state"] == "awaiting_reminder_time"
    temp = json.loads(state["temp_data"])
    assert temp["goal_id"] == goals[0]["id"]

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
    assert "Goal Added successfully" in response
    
    goals = user_goals.get_user_goals(user["id"])
    assert len(goals) == 1
    assert goals[0]["goal_emoji"] == "📓"
    assert "journaling" in goals[0]["goal_description"]

def test_enable_journaling_existing(user):
    """Test EnableJournalingHandler when already enabled."""
    handler = EnableJournalingHandler()
    handler.handle(user, "enable journaling") # Create it first
    
    response = handler.handle(user, "enable journaling")
    assert "already have a journaling goal" in response
    
    goals = user_goals.get_user_goals(user["id"])
    assert len(goals) == 1

def test_journal_prompts(user):
    """Test JournalPromptsHandler."""
    handler = JournalPromptsHandler()
    assert handler.matches("journal prompts")
    
    # Setup goals
    goal1 = user_goals.create_goal(user["id"], "🏃", "Run")
    goal2 = user_goals.create_goal(user["id"], "📚", "Read")
    
    # No ratings today
    response = handler.handle(user, "journal prompts")
    assert "Did you complete the goals?" in response
    assert "Run" in response
    assert "Read" in response
    
    # Rate one
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    goal_ratings.create_rating(goal1["id"], 3)
    
    response = handler.handle(user, "journal prompts")
    assert "Run" not in response
    assert "Read" in response
    
    # Rate all
    goal_ratings.create_rating(goal2["id"], 3)
    response = handler.handle(user, "journal prompts")
    assert "Did you complete the goals?" not in response

def test_delete_goal(user):
    """Test DeleteGoalHandler."""
    handler = DeleteGoalHandler()
    message = "delete 1"
    assert handler.matches(message)
    
    user_goals.create_goal(user["id"], "🏃", "Run")
    
    response = handler.handle(user, message)
    assert "Goal deleted" in response
    assert "Run" in response
    
    goals = user_goals.get_user_goals(user["id"])
    assert len(goals) == 0

def test_delete_goal_invalid(user):
    """Test DeleteGoalHandler with invalid inputs."""
    handler = DeleteGoalHandler()
    response = handler.handle(user, "delete invalid")
    assert "Invalid format" in response
    
    user_goals.create_goal(user["id"], "🏃", "Run")
    response = handler.handle(user, "delete 99")
    assert "Invalid goal number" in response

def test_reminder_time(user):
    """Test ReminderTimeHandler."""
    handler = ReminderTimeHandler()
    message = "10:00"
    assert handler.matches(message)
    
    # Setup state
    goal = user_goals.create_goal(user["id"], "🏃", "Run")
    user_states.create_user_state(
        user["id"],
        state="awaiting_reminder_time",
        temp_data=json.dumps({"goal_id": goal["id"]})
    )
    
    response = handler.handle(user, message)
    assert "remind you daily at 10:00 AM" in response
    
    reminder = goal_reminders.get_goal_reminder_by_goal_id(goal["id"])
    assert reminder["reminder_time"] == "10:00:00"
    
    # Check state cleared
    assert user_states.get_user_state(user["id"]) is None

def test_reminder_time_no_state(user):
    """Test ReminderTimeHandler without proper state."""
    handler = ReminderTimeHandler()
    response = handler.handle(user, "10:00")
    assert "Please add a goal first" in response

def test_goals_list(user):
    """Test GoalsListHandler."""
    handler = GoalsListHandler()
    assert handler.matches("goals")
    
    # No goals
    response = handler.handle(user, "goals")
    assert response == ERROR_NO_GOALS_SET
    
    # With goals
    g1 = user_goals.create_goal(user["id"], "🏃", "Run")
    goal_reminders.create_goal_reminder(user["id"], g1["id"], "09:00:00")
    
    response = handler.handle(user, "goals")
    assert "1. 🏃 Run" in response
    assert "⏰ 09:00 AM" in response

def test_update_reminder(user):
    """Test UpdateReminderHandler."""
    handler = UpdateReminderHandler()
    assert handler.matches("update 1 8pm")
    
    goal = user_goals.create_goal(user["id"], "🏃", "Run")
    
    # Create new reminder
    response = handler.handle(user, "update 1 8pm")
    assert "Reminder updated" in response
    assert "08:00 PM" in response
    
    reminder = goal_reminders.get_goal_reminder_by_goal_id(goal["id"])
    assert reminder["reminder_time"] == "20:00:00"
    
    # Update existing
    response = handler.handle(user, "update 1 9pm")
    reminder = goal_reminders.get_goal_reminder_by_goal_id(goal["id"])
    assert reminder["reminder_time"] == "21:00:00"

def test_update_reminder_invalid(user):
    """Test UpdateReminderHandler with invalid inputs."""
    handler = UpdateReminderHandler()
    
    response = handler.handle(user, "update")
    assert "Usage: update" in response
    
    response = handler.handle(user, "update 1 invalid")
    assert "Invalid time format" in response
    
    response = handler.handle(user, "update 1 10pm") # No goals yet
    assert "Invalid goal number" in response

def test_transcript_toggle(user):
    """Test TranscriptToggleHandler."""
    handler = TranscriptToggleHandler()
    assert handler.matches("transcript on")
    
    response = handler.handle(user, "transcript on")
    assert "Transcript files enabled" in response
    assert users.get_user(user["id"])["send_transcript_file"] == 1
    
    response = handler.handle(user, "transcript off")
    assert "Transcript files disabled" in response
    assert users.get_user(user["id"])["send_transcript_file"] == 0
    
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
    user_goals.create_goal(user["id"], "🏃", "Run")
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
    user_goals.create_goal(user["id"], "🏃", "Run")
    
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
    
    goal = user_goals.create_goal(user["id"], "🏃", "Run")
    
    response = handler.handle(user, "rate 1 3")
    assert "✅" in response # Success symbol
    assert "Run" in response
    
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    rating = goal_ratings.get_rating_by_goal_and_date(goal["id"], today)
    assert rating["rating"] == 3
    
    # Update rating
    handler.handle(user, "rate 1 2")
    rating = goal_ratings.get_rating_by_goal_and_date(goal["id"], today)
    assert rating["rating"] == 2

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
    
    goal1 = user_goals.create_goal(user["id"], "🏃", "Run")
    goal2 = user_goals.create_goal(user["id"], "📚", "Read")
    
    # Valid
    response = handler.handle(user, "31")
    assert "✅" in response # 3
    assert "❌" in response # 1
    
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    r1 = goal_ratings.get_rating_by_goal_and_date(goal1["id"], today)
    r2 = goal_ratings.get_rating_by_goal_and_date(goal2["id"], today)
    assert r1["rating"] == 3
    assert r2["rating"] == 1

def test_rate_all_invalid_length(user):
    """Test RateAllHandler with invalid length."""
    handler = RateAllHandler()
    user_goals.create_goal(user["id"], "🏃", "Run")
    
    response = handler.handle(user, "33")
    assert "Invalid input" in response
    assert "Send 1 digits" in response
