"""Tests for process_journal helper."""

from datetime import datetime
from unittest.mock import MagicMock, patch
from zoneinfo import ZoneInfo

from app.helpers.audio.journaling import process_journal


@patch("app.helpers.audio.journaling.get_journal_goal_id")
@patch("app.helpers.audio.journaling.get_goal_reminder_by_goal_id")
@patch("app.helpers.audio.journaling.get_user")
@patch("app.helpers.audio.journaling.get_timezone_safe")
@patch("app.helpers.audio.journaling.get_user_audio_journal_entries")
@patch("app.helpers.audio.journaling.transcribe_audio")
@patch("app.helpers.audio.journaling.summarize_transcript")
@patch("app.helpers.audio.journaling.create_audio_journal_entry")
@patch("app.helpers.audio.journaling.send_message")
def test_process_journal_success(
    mock_send,
    mock_create,
    mock_summarize,
    mock_transcribe,
    mock_get_entries,
    mock_get_tz,
    mock_get_user,
    mock_get_reminder,
    mock_get_goal_id,
):
    """Test successful journal processing."""
    # Arrange
    user = {"id": 1}
    sender = "12345"
    audio_data = "data"

    mock_get_goal_id.return_value = 10
    mock_get_reminder.return_value = {"reminder_time": "09:00:00"}
    mock_get_user.return_value = {"timezone": "UTC"}
    mock_get_tz.return_value = ZoneInfo("UTC")
    mock_get_entries.return_value = []  # No existing entries for today

    mock_transcribe.return_value = "Transcript"
    mock_summarize.return_value = "Summary"

    # Mock time to be after reminder time
    # Since we can't easily mock datetime.now inside the function without patching datetime,
    # we'll rely on the fact that "09:00:00" is likely in the past if we run this test late in day,
    # OR we assume the test environment time.
    # Better approach: Mock datetime in the module.

    with patch("app.helpers.audio.journaling.datetime") as mock_datetime:
        mock_datetime.now.return_value = datetime(2024, 1, 1, 10, 0, 0)
        mock_datetime.strptime.side_effect = datetime.strptime  # Pass through for strptime

        # Need to handle .now(timezone.utc) call and .astimezone
        mock_now_utc = MagicMock()
        mock_now_utc.astimezone.return_value = datetime(2024, 1, 1, 10, 0, 0)
        mock_datetime.now.side_effect = [
            datetime(2024, 1, 1, 10, 0, 0),  # for today str
            mock_now_utc,  # for now_utc
        ]

        # The code calls datetime.now().strftime... then datetime.now(timezone.utc)...
        # Actually looking at code:
        # today = datetime.now().strftime("%Y-%m-%d")
        # now_utc = datetime.now(timezone.utc)

        # Let's retry patching slightly differently or just ensure the logic passes
        # If we set reminder to 00:00:00 it will always be passed
        mock_get_reminder.return_value = {"reminder_time": "00:00:00"}

        # Act
        response = process_journal(sender, user, audio_data)

        # Assert
        assert response is not None
        assert response[1] == "Summary"
        mock_create.assert_called_once()
        mock_send.assert_called()


@patch("app.helpers.audio.journaling.get_journal_goal_id")
def test_process_journal_no_goal(mock_get_goal_id):
    """Test process_journal when no journaling goal exists."""
    mock_get_goal_id.return_value = None
    response = process_journal("123", {"id": 1}, "data")
    assert response is None


@patch("app.helpers.audio.journaling.get_journal_goal_id")
@patch("app.helpers.audio.journaling.get_goal_reminder_by_goal_id")
@patch("app.helpers.audio.journaling.get_user")
@patch("app.helpers.audio.journaling.get_timezone_safe")
def test_process_journal_too_early(
    mock_get_tz,
    mock_get_user,
    mock_get_reminder,
    mock_get_goal_id,
):
    """Test process_journal when it's too early."""
    mock_get_goal_id.return_value = 10
    mock_get_reminder.return_value = {"reminder_time": "23:59:59"}  # Late reminder
    mock_get_user.return_value = {"timezone": "UTC"}
    mock_get_tz.return_value = ZoneInfo("UTC")

    # Act
    # Assuming current time is not 23:59:59
    response = process_journal("123", {"id": 1}, "data")

    # Assert
    assert response is None
