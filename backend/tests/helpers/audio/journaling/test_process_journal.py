"""Tests for process_journal helper."""

import pytest
from unittest.mock import patch
from datetime import datetime, UTC
from zoneinfo import ZoneInfo
from app.helpers.audio.journaling import process_journal
from app.db.operations import users, user_goals, goal_reminders

# We still need to mock external APIs (transcribe/summarize/send) as they do IO.
# But we can remove all DB mocks and datetime mocks.

@patch("app.helpers.audio.journaling.send_message")
@patch("app.helpers.audio.journaling.summarize_transcript")
@patch("app.helpers.audio.journaling.transcribe_audio")
def test_process_journal_success(
    mock_transcribe,
    mock_summarize,
    mock_send,
    mock_connect
):
    """Test successful journal processing with real DB and injected time."""
    # Arrange - Setup DB state
    user = users.create_user("+1234567890", "UTC")
    goal = user_goals.create_goal(user["id"], "📓", "journaling")
    goal_reminders.create_goal_reminder(user["id"], goal["id"], "09:00:00")
    
    mock_transcribe.return_value = "Transcript"
    mock_summarize.return_value = "Summary"
    
    # Inject a time that is AFTER the reminder time (10:00 > 09:00)
    fake_now = datetime(2024, 1, 1, 10, 0, 0, tzinfo=UTC)
    
    # Act
    response = process_journal("12345", user, "audio_data", now=fake_now)
    
    # Assert
    assert response is not None
    assert response[1] == "Summary"
    mock_transcribe.assert_called_once()
    mock_summarize.assert_called_once()
    mock_send.assert_called()


def test_process_journal_no_goal(mock_connect):
    """Test process_journal when no journaling goal exists."""
    user = users.create_user("+1234567890", "UTC")
    # No journaling goal created
    
    response = process_journal("123", user, "data")
    assert response is None


def test_process_journal_too_early(mock_connect):
    """Test process_journal when it's too early."""
    user = users.create_user("+1234567890", "UTC")
    goal = user_goals.create_goal(user["id"], "📓", "journaling")
    # Reminder at 23:00
    goal_reminders.create_goal_reminder(user["id"], goal["id"], "23:00:00")
    
    # Inject a time that is BEFORE the reminder (10:00 < 23:00)
    fake_now = datetime(2024, 1, 1, 10, 0, 0, tzinfo=UTC)
    
    # Act
    response = process_journal("123", user, "data", now=fake_now)
    
    # Assert
    assert response is None
