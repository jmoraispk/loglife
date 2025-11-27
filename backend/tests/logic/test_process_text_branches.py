"""Tests for process_text logic (missing branches)."""


import pytest
from app.db.operations import user_goals, users
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
