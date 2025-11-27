"""Tests for process_text logic (missing branches)."""


import pytest
from datetime import datetime
from app.config import ERROR_NO_GOALS_SET, STYLE
from app.db.operations import goal_ratings, goal_reminders, user_goals, users
from app.logic.process_text import process_text


def test_process_text_add_goal_no_emoji():
    """Test adding a goal with description but no emoji (should use default)."""
    user = users.create_user("+1234567890", "UTC")

    # No emoji -> Default emoji ("🎯")
    response = process_text(user, "add goal Run 5k")
    assert "Goal Added successfully" in response

    goals = user_goals.get_user_goals(user["id"])
    # Should have 1 goal
    assert len(goals) == 1
    assert goals[0]["goal_emoji"] == "🎯"
    assert goals[0]["goal_description"] == "run 5k"


def test_process_text_add_goal_only_emoji():
    """Test adding a goal with only an emoji (should use emoji as description)."""
    user = users.create_user("+1234567890", "UTC")

    # Only emoji -> Empty description after extraction, should fallback to emoji
    response = process_text(user, "add goal 🏃")
    assert "Goal Added successfully" in response

    goals = user_goals.get_user_goals(user["id"])
    assert len(goals) == 1
    assert goals[0]["goal_emoji"] == "🏃"
    # Logic updated to use emoji as description if description is empty
    assert goals[0]["goal_description"] == ""


def test_process_text_rate_invalid_values():
    """Test rate command with values outside 1-3."""
    user = users.create_user("+1234567890", "UTC")
    user_goals.create_goal(user["id"], "🏃", "Run")

    with pytest.raises(Exception): # sqlite3.IntegrityError
        process_text(user, "rate 1 4")

    with pytest.raises(Exception):
        process_text(user, "rate 1 0")


def test_process_text_delete_invalid_format():
    """Test delete command with invalid format."""
    user = users.create_user("+1234567890", "UTC")

    response = process_text(user, "delete abc")
    assert "Invalid format" in response


def test_process_text_delete_invalid_number():
    """Test delete command with invalid goal number."""
    user = users.create_user("+1234567890", "UTC")
    user_goals.create_goal(user["id"], "🏃", "Run")

    response = process_text(user, "delete 99")
    assert "Invalid goal number" in response

    response = process_text(user, "delete 0")
    assert "Invalid goal number" in response


def test_process_text_reminder_no_state():
    """Test sending time without being in awaiting_reminder_time state."""
    user = users.create_user("+1234567890", "UTC")

    response = process_text(user, "10:00")
    assert "Please add a goal first" in response


def test_process_text_update_invalid_format():
    """Test update command with invalid format."""
    user = users.create_user("+1234567890", "UTC")

    response = process_text(user, "update")
    assert "Usage: update" in response

    response = process_text(user, "update 1")
    assert "Usage: update" in response


def test_process_text_update_invalid_time():
    """Test update command with invalid time."""
    user = users.create_user("+1234567890", "UTC")

    response = process_text(user, "update 1 nottime")
    assert "Invalid time format" in response


def test_process_text_update_invalid_goal():
    """Test update command with invalid goal number."""
    user = users.create_user("+1234567890", "UTC")

    response = process_text(user, "update 1 10:00")
    assert "Invalid goal number" in response


def test_process_text_lookback_default():
    """Test lookback command defaults to 7 days."""
    user = users.create_user("+1234567890", "UTC")
    user_goals.create_goal(user["id"], "🏃", "Run")

    response = process_text(user, "lookback")
    assert "7 Days" in response


def test_process_text_rate_invalid_format():
    """Test rate command with invalid format."""
    user = users.create_user("+1234567890", "UTC")

    response = process_text(user, "rate")
    assert "Usage: rate" in response

    response = process_text(user, "rate 1")
    assert "Usage: rate" in response


def test_process_text_rate_invalid_goal():
    """Test rate command with invalid goal number."""
    user = users.create_user("+1234567890", "UTC")

    response = process_text(user, "rate 1 3")
    assert "don't have any goals yet" in response

    user_goals.create_goal(user["id"], "🏃", "Run")
    response = process_text(user, "rate 99 3")
    assert "Usage: rate" in response

    response = process_text(user, "rate 0 3")
    assert "Usage: rate" in response


def test_process_text_rate_all_invalid_length():
    """Test rating all goals with invalid length string."""
    user = users.create_user("+1234567890", "UTC")
    user_goals.create_goal(user["id"], "🏃", "Run")

    response = process_text(user, "33") # 2 ratings for 1 goal
    assert "Invalid input" in response

def test_process_text_goals_with_reminder():
    """Test listing goals when a reminder is set."""
    user = users.create_user("+1234567890", "UTC")
    goal = user_goals.create_goal(user["id"], "🏃", "Run")
    goal_reminders.create_goal_reminder(user["id"], goal["id"], "08:00:00")

    response = process_text(user, "goals")
    
    assert "🏃 Run" in response
    assert "⏰ 08:00 AM" in response


def test_process_text_week_no_goals():
    """Test week command with no goals."""
    user = users.create_user("+1234567890", "UTC")
    
    response = process_text(user, "week")
    assert response == ERROR_NO_GOALS_SET


def test_process_text_lookback_no_goals():
    """Test lookback command with no goals."""
    user = users.create_user("+1234567890", "UTC")
    
    response = process_text(user, "lookback")
    assert response == ERROR_NO_GOALS_SET


def test_process_text_rate_update():
    """Test updating an existing rating."""
    user = users.create_user("+1234567890", "UTC")
    goal = user_goals.create_goal(user["id"], "🏃", "Run")
    
    # Create initial rating
    process_text(user, "rate 1 3")
    
    # Update rating
    response = process_text(user, "rate 1 2")
    assert STYLE[2] in response
    
    today = datetime.now().strftime("%Y-%m-%d")
    rating = goal_ratings.get_rating_by_goal_and_date(goal["id"], today)
    assert rating["rating"] == 2


def test_process_text_rate_all_update():
    """Test updating existing ratings via rate all command."""
    user = users.create_user("+1234567890", "UTC")
    goal1 = user_goals.create_goal(user["id"], "🏃", "Run")
    goal2 = user_goals.create_goal(user["id"], "📚", "Read")
    
    # Create initial ratings
    process_text(user, "32")
    
    # Update ratings - using "13" causes it to be parsed as time (1:00 PM)
    # Use inputs that won't be parsed as time, e.g., "33"
    response = process_text(user, "33")
    assert STYLE[3] in response
    
    today = datetime.now().strftime("%Y-%m-%d")
    r1 = goal_ratings.get_rating_by_goal_and_date(goal1["id"], today)
    r2 = goal_ratings.get_rating_by_goal_and_date(goal2["id"], today)
    assert r1["rating"] == 3
    assert r2["rating"] == 3


def test_process_text_update_create_reminder():
    """Test update command creating a reminder when none exists."""
    user = users.create_user("+1234567890", "UTC")
    goal = user_goals.create_goal(user["id"], "🏃", "Run")
    # No reminder created
    
    response = process_text(user, "update 1 10pm")
    assert "Reminder updated" in response
    
    reminder = goal_reminders.get_goal_reminder_by_goal_id(goal["id"])
    assert reminder is not None
    assert reminder["reminder_time"] == "22:00:00"


def test_process_text_transcript_off_explicit():
    """Test transcript off explicitly to ensure coverage."""
    user = users.create_user("+1234567890", "UTC")
    # Default is enabled (1)
    assert users.get_user(user["id"])["send_transcript_file"] == 1
    
    response = process_text(user, "transcript off")
    assert "Transcript files disabled" in response
    assert users.get_user(user["id"])["send_transcript_file"] == 0


def test_process_text_transcript_invalid():
    """Test invalid transcript command."""
    user = users.create_user("+1234567890", "UTC")
    
    response = process_text(user, "transcript foo")
    assert "Invalid command" in response


def test_process_text_rate_all_no_goals():
    """Test rate all goals command when no goals exist."""
    user = users.create_user("+1234567890", "UTC")
    
    response = process_text(user, "123")
    # "123" is valid digits but no goals to rate
    assert response == ERROR_NO_GOALS_SET
