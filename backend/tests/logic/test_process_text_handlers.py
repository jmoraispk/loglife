"""Tests for individual handlers in process_text logic."""

import json
from datetime import UTC, datetime, timedelta

import pytest
from app.config import ERROR_NO_GOALS_SET, ERROR_INVALID_INPUT_LENGTH, USAGE_RATE
from app.db.operations import (
    goal_ratings,
    goal_reminders,
    user_goals,
    user_states,
    users,
)
from app.logic.process_text import (
    _add_goal,
    _enable_journaling,
    _journal_prompts,
    _delete_goal,
    _reminder_time,
    _goals_list,
    _update_reminder,
    _transcript_toggle,
    _week_summary,
    _lookback,
    _rate_single,
    _rate_all,
)

# Helper to create a user
@pytest.fixture
def user():
    return users.create_user("+1234567890", "UTC")

def test_add_goal(user):
    """Test _add_goal handler."""
    message = "add goal 🏃 Run 5k"
    response = _add_goal(user["id"], message)
    
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
    """Test _add_goal with empty message."""
    message = "add goal"
    response = _add_goal(user["id"], message)
    assert response is None

def test_enable_journaling(user):
    """Test _enable_journaling handler."""
    response = _enable_journaling(user)
    assert "Goal Added successfully" in response
    
    goals = user_goals.get_user_goals(user["id"])
    assert len(goals) == 1
    assert goals[0]["goal_emoji"] == "📓"
    assert "journaling" in goals[0]["goal_description"]

def test_enable_journaling_existing(user):
    """Test _enable_journaling when already enabled."""
    _enable_journaling(user) # Create it first
    
    response = _enable_journaling(user)
    assert "already have a journaling goal" in response
    
    goals = user_goals.get_user_goals(user["id"])
    assert len(goals) == 1

def test_journal_prompts(user):
    """Test _journal_prompts handler."""
    # Setup goals
    goal1 = user_goals.create_goal(user["id"], "🏃", "Run")
    goal2 = user_goals.create_goal(user["id"], "📚", "Read")
    
    # No ratings today
    response = _journal_prompts(user["id"])
    assert "Did you complete the goals?" in response
    assert "Run" in response
    assert "Read" in response
    
    # Rate one
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    goal_ratings.create_rating(goal1["id"], 3)
    
    response = _journal_prompts(user["id"])
    assert "Run" not in response
    assert "Read" in response
    
    # Rate all
    goal_ratings.create_rating(goal2["id"], 3)
    response = _journal_prompts(user["id"])
    assert "Did you complete the goals?" not in response

def test_delete_goal(user):
    """Test _delete_goal handler."""
    goal = user_goals.create_goal(user["id"], "🏃", "Run")
    
    response = _delete_goal(user["id"], "delete 1")
    assert "Goal deleted" in response
    assert "Run" in response
    
    goals = user_goals.get_user_goals(user["id"])
    assert len(goals) == 0

def test_delete_goal_invalid(user):
    """Test _delete_goal with invalid inputs."""
    response = _delete_goal(user["id"], "delete invalid")
    assert "Invalid format" in response
    
    user_goals.create_goal(user["id"], "🏃", "Run")
    response = _delete_goal(user["id"], "delete 99")
    assert "Invalid goal number" in response

def test_reminder_time(user):
    """Test _reminder_time handler."""
    # Setup state
    goal = user_goals.create_goal(user["id"], "🏃", "Run")
    user_states.create_user_state(
        user["id"],
        state="awaiting_reminder_time",
        temp_data=json.dumps({"goal_id": goal["id"]})
    )
    
    response = _reminder_time(user["id"], "10:00")
    assert "remind you daily at 10:00 AM" in response
    
    reminder = goal_reminders.get_goal_reminder_by_goal_id(goal["id"])
    assert reminder["reminder_time"] == "10:00:00"
    
    # Check state cleared
    assert user_states.get_user_state(user["id"]) is None

def test_reminder_time_no_state(user):
    """Test _reminder_time without proper state."""
    response = _reminder_time(user["id"], "10:00")
    assert "Please add a goal first" in response

def test_goals_list(user):
    """Test _goals_list handler."""
    # No goals
    response = _goals_list(user["id"])
    assert response == ERROR_NO_GOALS_SET
    
    # With goals
    g1 = user_goals.create_goal(user["id"], "🏃", "Run")
    goal_reminders.create_goal_reminder(user["id"], g1["id"], "09:00:00")
    
    response = _goals_list(user["id"])
    assert "1. 🏃 Run" in response
    assert "⏰ 09:00 AM" in response

def test_update_reminder(user):
    """Test _update_reminder handler."""
    goal = user_goals.create_goal(user["id"], "🏃", "Run")
    
    # Create new reminder
    response = _update_reminder(user["id"], "update 1 8pm")
    assert "Reminder updated" in response
    assert "08:00 PM" in response
    
    reminder = goal_reminders.get_goal_reminder_by_goal_id(goal["id"])
    assert reminder["reminder_time"] == "20:00:00"
    
    # Update existing
    response = _update_reminder(user["id"], "update 1 9pm")
    reminder = goal_reminders.get_goal_reminder_by_goal_id(goal["id"])
    assert reminder["reminder_time"] == "21:00:00"

def test_update_reminder_invalid(user):
    """Test _update_reminder with invalid inputs."""
    response = _update_reminder(user["id"], "update")
    assert "Usage: update" in response
    
    response = _update_reminder(user["id"], "update 1 invalid")
    assert "Invalid time format" in response
    
    response = _update_reminder(user["id"], "update 1 10pm") # No goals yet
    assert "Invalid goal number" in response

def test_transcript_toggle(user):
    """Test _transcript_toggle handler."""
    response = _transcript_toggle(user["id"], "transcript on")
    assert "Transcript files enabled" in response
    assert users.get_user(user["id"])["send_transcript_file"] == 1
    
    response = _transcript_toggle(user["id"], "transcript off")
    assert "Transcript files disabled" in response
    assert users.get_user(user["id"])["send_transcript_file"] == 0
    
    response = _transcript_toggle(user["id"], "transcript invalid")
    assert "Invalid command" in response

def test_week_summary(user):
    """Test _week_summary handler."""
    # No goals
    response = _week_summary(user["id"])
    assert response == ERROR_NO_GOALS_SET
    
    # With goals
    user_goals.create_goal(user["id"], "🏃", "Run")
    response = _week_summary(user["id"])
    assert "Week" in response
    assert "🏃" in response

def test_lookback(user):
    """Test _lookback handler."""
    # No goals
    response = _lookback(user["id"], "lookback")
    assert response == ERROR_NO_GOALS_SET
    
    # With goals
    user_goals.create_goal(user["id"], "🏃", "Run")
    
    # Default 7 days
    response = _lookback(user["id"], "lookback")
    assert "7 Days" in response
    assert "🏃" in response
    
    # Custom days
    response = _lookback(user["id"], "lookback 3")
    assert "3 Days" in response

def test_rate_single(user):
    """Test _rate_single handler."""
    goal = user_goals.create_goal(user["id"], "🏃", "Run")
    
    response = _rate_single(user["id"], "rate 1 3")
    assert "✅" in response # Success symbol
    assert "Run" in response
    
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    rating = goal_ratings.get_rating_by_goal_and_date(goal["id"], today)
    assert rating["rating"] == 3
    
    # Update rating
    _rate_single(user["id"], "rate 1 2")
    rating = goal_ratings.get_rating_by_goal_and_date(goal["id"], today)
    assert rating["rating"] == 2

def test_rate_single_invalid(user):
    """Test _rate_single with invalid inputs."""
    response = _rate_single(user["id"], "rate")
    assert response == USAGE_RATE
    
    # No goals
    response = _rate_single(user["id"], "rate 1 3")
    assert response == ERROR_NO_GOALS_SET

def test_rate_all(user):
    """Test _rate_all handler."""
    # No goals
    response = _rate_all(user["id"], "123")
    assert response == ERROR_NO_GOALS_SET
    
    goal1 = user_goals.create_goal(user["id"], "🏃", "Run")
    goal2 = user_goals.create_goal(user["id"], "📚", "Read")
    
    # Valid
    response = _rate_all(user["id"], "31")
    assert "✅" in response # 3
    assert "❌" in response # 1
    
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    r1 = goal_ratings.get_rating_by_goal_and_date(goal1["id"], today)
    r2 = goal_ratings.get_rating_by_goal_and_date(goal2["id"], today)
    assert r1["rating"] == 3
    assert r2["rating"] == 1

def test_rate_all_invalid_length(user):
    """Test _rate_all with invalid length."""
    user_goals.create_goal(user["id"], "🏃", "Run")
    
    response = _rate_all(user["id"], "33")
    assert "Invalid input" in response
    assert "Send 1 digits" in response

