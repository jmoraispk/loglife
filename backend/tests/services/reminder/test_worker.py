"""Tests for the reminder service worker.

This module tests reminder-related operations including reminder scheduling calculations
and reminder notification triggering.
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

import app.services.reminder.worker as reminder_worker
from app.db.tables import Goal, Reminder, User


def test_next_reminder_seconds() -> None:
    """Test calculation of seconds until next reminder.

    Verifies that the _next_reminder_seconds function correctly:
    - Calculates wait time for upcoming reminders (capped at 60s)
    - Returns default wait time when no reminders are scheduled
    - Uses mocked data to avoid dependency on actual database state
    """
    now = datetime.now(UTC)
    # Set a reminder 30 minutes in the future
    reminder_time = (now + timedelta(minutes=30)).strftime("%H:%M")

    # Mock objects for new DB structure
    mock_reminder = MagicMock(spec=Reminder)
    mock_reminder.user_id = 1
    mock_reminder.reminder_time = reminder_time

    mock_user = MagicMock(spec=User)
    mock_user.timezone = "UTC"

    # Use unittest.mock.patch as a context manager
    # We need to patch db.reminders.get_all and db.users.get
    with (
        patch("app.db.tables.reminders.RemindersTable.get_all") as mock_get_reminders,
        patch("app.db.tables.users.UsersTable.get") as mock_get_user,
    ):
        mock_get_reminders.return_value = [mock_reminder]
        mock_get_user.return_value = mock_user

        # First call: non-empty list
        wait = reminder_worker._next_reminder_seconds()  # noqa: SLF001
        # The wait should be capped at 60 seconds
        assert wait == 60

        # Second call: empty list
        mock_get_reminders.return_value = []
        wait_empty = reminder_worker._next_reminder_seconds()  # noqa: SLF001
        # Default wait should be between 10 and 60
        assert 10 <= wait_empty <= 60


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
    mock_user.timezone = "UTC"
    mock_user.phone_number = "1234567890"

    mock_goal = MagicMock(spec=Goal)
    mock_goal.goal_description = "Test Goal"
    mock_goal.goal_emoji = "✅"

    with (
        patch("app.db.tables.reminders.RemindersTable.get_all") as mock_get_reminders,
        patch("app.db.tables.users.UsersTable.get") as mock_get_user,
        patch("app.db.tables.goals.GoalsTable.get") as mock_get_goal,
        patch("app.services.reminder.worker.send_message") as mock_send,
    ):
        mock_get_reminders.return_value = [mock_reminder]
        mock_get_user.return_value = mock_user
        mock_get_goal.return_value = mock_goal

        reminder_worker._check_reminders()  # noqa: SLF001

        # Assert message sent
        # Ensure we are matching the exact call format including args
        mock_send.assert_called_once_with("1234567890", "⏰ Reminder: ✅ Test Goal")
