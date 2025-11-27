"""Tests for process_text logic (missing branches)."""

import pytest
from datetime import datetime, timedelta
from app.logic.process_text import process_text
from app.db.operations import users, user_goals, user_states


def test_process_text_delete_invalid_format(mock_connect):
    """Test delete command with invalid format."""
    user = users.create_user("+1234567890", "UTC")
    
    response = process_text(user, "delete abc")
    assert "Invalid format" in response


def test_process_text_delete_invalid_number(mock_connect):
    """Test delete command with invalid goal number."""
    user = users.create_user("+1234567890", "UTC")
    user_goals.create_goal(user["id"], "🏃", "Run")
    
    response = process_text(user, "delete 99")
    assert "Invalid goal number" in response
    
    response = process_text(user, "delete 0")
    assert "Invalid goal number" in response


def test_process_text_reminder_no_state(mock_connect):
    """Test sending time without being in awaiting_reminder_time state."""
    user = users.create_user("+1234567890", "UTC")
    
    response = process_text(user, "10:00")
    assert "Please add a goal first" in response


def test_process_text_update_invalid_format(mock_connect):
    """Test update command with invalid format."""
    user = users.create_user("+1234567890", "UTC")
    
    response = process_text(user, "update")
    assert "Usage: update" in response
    
    response = process_text(user, "update 1")
    assert "Usage: update" in response


def test_process_text_update_invalid_time(mock_connect):
    """Test update command with invalid time."""
    user = users.create_user("+1234567890", "UTC")
    
    response = process_text(user, "update 1 nottime")
    assert "Invalid time format" in response


def test_process_text_update_invalid_goal(mock_connect):
    """Test update command with invalid goal number."""
    user = users.create_user("+1234567890", "UTC")
    
    response = process_text(user, "update 1 10:00")
    assert "Invalid goal number" in response


def test_process_text_lookback_default(mock_connect):
    """Test lookback command defaults to 7 days."""
    user = users.create_user("+1234567890", "UTC")
    user_goals.create_goal(user["id"], "🏃", "Run")
    
    response = process_text(user, "lookback")
    assert "7 Days" in response


def test_process_text_rate_invalid_format(mock_connect):
    """Test rate command with invalid format."""
    user = users.create_user("+1234567890", "UTC")
    
    response = process_text(user, "rate")
    assert "Usage: rate" in response
    
    response = process_text(user, "rate 1")
    assert "Usage: rate" in response


def test_process_text_rate_invalid_goal(mock_connect):
    """Test rate command with invalid goal number."""
    user = users.create_user("+1234567890", "UTC")
    
    response = process_text(user, "rate 1 3")
    assert "don't have any goals yet" in response
    
    user_goals.create_goal(user["id"], "🏃", "Run")
    response = process_text(user, "rate 99 3")
    assert "Usage: rate" in response
    
    response = process_text(user, "rate 0 3")
    assert "Usage: rate" in response


def test_process_text_rate_all_invalid_length(mock_connect):
    """Test rating all goals with invalid length string."""
    user = users.create_user("+1234567890", "UTC")
    user_goals.create_goal(user["id"], "🏃", "Run")
    
    response = process_text(user, "33") # 2 ratings for 1 goal
    assert "Invalid input" in response

