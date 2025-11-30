"""Tests for the reminder service worker.

This module tests reminder-related operations including reminder scheduling calculations
and reminder notification triggering.
"""

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import app.services.reminder.worker as reminder_worker
from app.config import JOURNAL_REMINDER_MESSAGE, REMINDER_MESSAGE
from app.db.tables import Goal, Reminder, User


def test_check_reminders() -> None:
    """Test reminder checking and notification sending.

    Verifies that the _check_reminders function correctly:
    - Identifies reminders that are due at the current time
    - Retrieves user and goal information
    - Sends WhatsApp notification with proper message format
    - Includes goal emoji and description in the reminder message
    """
    now = datetime.now(UTC)
    reminder_time = now.strftime("%H:%M")

    # Mock objects
    mock_reminder = MagicMock(spec=Reminder)
    mock_reminder.id = 1
    mock_reminder.user_id = 1
    mock_reminder.user_goal_id = 10
    mock_reminder.reminder_time = reminder_time

    mock_user = MagicMock(spec=User)
    mock_user.id = 1
    mock_user.timezone = "UTC"
    mock_user.phone_number = "1234567890"

    mock_goal = MagicMock(spec=Goal)
    mock_goal.goal_description = "Test Goal"
    mock_goal.goal_emoji = "✅"

    with (
        patch("app.db.tables.reminders.RemindersTable.get_all") as mock_get_reminders,
        patch("app.db.tables.users.UsersTable.get_all") as mock_get_all_users,
        patch("app.db.tables.goals.GoalsTable.get") as mock_get_goal,
        patch("app.services.reminder.worker.send_message") as mock_send,
    ):
        mock_get_reminders.return_value = [mock_reminder]
        mock_get_all_users.return_value = [mock_user]
        mock_get_goal.return_value = mock_goal

        reminder_worker._check_reminders()  # noqa: SLF001

        # Assert message sent
        # Ensure we are matching the exact call format including args
        mock_send.assert_called_once_with("1234567890", "⏰ Reminder: ✅ Test Goal")


def test_is_reminder_due_true() -> None:
    """Test _is_reminder_due returns True when times match."""
    now_utc = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)

    mock_user = MagicMock(spec=User)
    mock_user.timezone = "UTC"

    mock_reminder = MagicMock(spec=Reminder)
    mock_reminder.reminder_time = "12:00:00"

    assert reminder_worker._is_reminder_due(mock_reminder, mock_user, now_utc)  # noqa: SLF001


def test_is_reminder_due_false() -> None:
    """Test _is_reminder_due returns False when times do not match."""
    now_utc = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)

    mock_user = MagicMock(spec=User)
    mock_user.timezone = "UTC"

    mock_reminder = MagicMock(spec=Reminder)
    mock_reminder.reminder_time = "12:01:00"

    assert not reminder_worker._is_reminder_due(mock_reminder, mock_user, now_utc)  # noqa: SLF001


def test_is_reminder_due_timezone_conversion() -> None:
    """Test _is_reminder_due handles timezone conversion correctly.

    If user is in UTC+1 (e.g., Europe/Paris in winter), 13:00 local is 12:00 UTC.
    """
    now_utc = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)  # 12:00 UTC

    mock_user = MagicMock(spec=User)
    mock_user.timezone = "Europe/Paris"

    mock_reminder = MagicMock(spec=Reminder)
    # In Jan (Standard Time), Paris is UTC+1. So 12:00 UTC -> 13:00 Paris.
    mock_reminder.reminder_time = "13:00:00"

    assert reminder_worker._is_reminder_due(  # noqa: SLF001
        mock_reminder,
        mock_user,
        now_utc,
    )


def test_build_standard_reminder_message() -> None:
    """Test construction of standard reminder message."""
    mock_goal = MagicMock(spec=Goal)
    mock_goal.goal_emoji = "🏃"
    mock_goal.goal_description = "Run 5k"

    msg = reminder_worker._build_standard_reminder_message(mock_goal)  # noqa: SLF001

    expected = REMINDER_MESSAGE.replace("<goal_emoji>", "🏃").replace(
        "<goal_description>", "Run 5k"
    )
    assert msg == expected


def test_build_journal_reminder_message_with_untracked() -> None:
    """Test journaling reminder message when there are untracked goals."""
    mock_goal1 = MagicMock(spec=Goal)
    mock_goal1.goal_description = "Run 5k"

    with patch("app.services.reminder.worker.get_goals_not_tracked_today") as mock_get_goals:
        mock_get_goals.return_value = [mock_goal1]

        msg = reminder_worker._build_journal_reminder_message(1)  # noqa: SLF001

        assert "Did you complete the goals?" in msg
        assert "Run 5k" in msg


def test_build_journal_reminder_message_all_tracked() -> None:
    """Test journaling reminder message when all goals are tracked."""
    with patch("app.services.reminder.worker.get_goals_not_tracked_today") as mock_get_goals:
        mock_get_goals.return_value = []

        msg = reminder_worker._build_journal_reminder_message(1)  # noqa: SLF001

        assert "Did you complete the goals?" not in msg
        assert msg == JOURNAL_REMINDER_MESSAGE.replace("\n\n<goals_not_tracked_today>", "")
