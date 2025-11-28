"""Tests for process_journal helper."""

from datetime import UTC, datetime
from unittest.mock import patch

from app.db.operations import audio_journal_entries, goal_reminders, user_goals, users
from app.helpers.audio.journaling import process_journal


def test_process_journal_success() -> None:
    """Test successful journal processing with real DB and injected time."""
    # Arrange - Setup DB state
    user = users.create_user("+1234567890", "UTC")
    goal = user_goals.create_goal(user["id"], "📓", "journaling")
    goal_reminders.create_goal_reminder(user["id"], goal["id"], "09:00:00")

    # Inject a time that is AFTER the reminder time (10:00 > 09:00)
    fake_now = datetime(2024, 1, 1, 10, 0, 0, tzinfo=UTC)

    with (
        patch("app.helpers.audio.journaling.send_message") as mock_send,
        patch("app.helpers.audio.journaling.summarize_transcript") as mock_summarize,
        patch("app.helpers.audio.journaling.transcribe_audio") as mock_transcribe,
    ):
        mock_transcribe.return_value = "Transcript"
        mock_summarize.return_value = "Summary"

        # Act
        response = process_journal("12345", user, "audio_data", now=fake_now)

        # Assert
        assert response is not None
        assert response[1] == "Summary"
        mock_transcribe.assert_called_once()
        mock_summarize.assert_called_once()
        mock_send.assert_called()


def test_process_journal_already_exists() -> None:
    """Test process_journal when an entry already exists for today."""
    user = users.create_user("+1234567890", "UTC")
    goal = user_goals.create_goal(user["id"], "📓", "journaling")
    goal_reminders.create_goal_reminder(user["id"], goal["id"], "09:00:00")

    # Create existing entry
    audio_journal_entries.create_audio_journal_entry(user["id"], "Old", "Old")

    # Create audio journal entry uses CURRENT_TIMESTAMP which is UTC.
    # The entry will have today's date.

    with (
        patch("app.helpers.audio.journaling.send_message"),
        patch("app.helpers.audio.journaling.transcribe_audio") as mock_transcribe,
    ):
        # Act
        response = process_journal(
            "12345", user, "audio_data"
        )  # uses datetime.now(UTC) internally if not passed, or I can pass one.
        # Ideally pass one to be safe.

        # Assert
        assert response is None  # Should skip processing
        mock_transcribe.assert_not_called()


def test_process_journal_exceptions() -> None:
    """Test exception handling in process_journal."""
    user = users.create_user("+1234567890", "UTC")
    goal = user_goals.create_goal(user["id"], "📓", "journaling")
    goal_reminders.create_goal_reminder(user["id"], goal["id"], "09:00:00")

    fake_now = datetime(2024, 1, 1, 10, 0, 0, tzinfo=UTC)

    # Test Transcription Error
    with (
        patch("app.helpers.audio.journaling.send_message"),
        patch("app.helpers.audio.journaling.transcribe_audio") as mock_transcribe,
    ):
        mock_transcribe.side_effect = RuntimeError("API Error")
        response = process_journal("12345", user, "audio_data", now=fake_now)
        assert response == "Transcription failed!"

    # Test Summarization Error
    with (
        patch("app.helpers.audio.journaling.send_message"),
        patch("app.helpers.audio.journaling.transcribe_audio") as mock_transcribe,
        patch("app.helpers.audio.journaling.summarize_transcript") as mock_summarize,
    ):
        mock_transcribe.return_value = "Transcript"
        mock_summarize.side_effect = RuntimeError("API Error")

        response = process_journal("12345", user, "audio_data", now=fake_now)
        assert response == "Summarization failed!"


def test_process_journal_no_goal() -> None:
    """Test process_journal when no journaling goal exists."""
    user = users.create_user("+1234567890", "UTC")
    # No journaling goal created

    response = process_journal("123", user, "data")
    assert response is None


def test_process_journal_too_early() -> None:
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
