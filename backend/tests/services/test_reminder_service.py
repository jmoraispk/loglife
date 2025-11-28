"""Tests for the reminder service functionality.

This module tests reminder-related operations including reminder scheduling calculations
and reminder notification triggering.
"""

from datetime import UTC, datetime, timedelta

import app.services.reminder as reminder_module
import pytest_mock


def test_next_reminder_seconds(mocker: pytest_mock.MockerFixture) -> None:
    """Test calculation of seconds until next reminder.

    Verifies that the _next_reminder_seconds function correctly:
    - Calculates wait time for upcoming reminders (capped at 60s)
    - Returns default wait time when no reminders are scheduled
    - Uses mocked data to avoid dependency on actual database state


    """
    now = datetime.now(UTC)
    # Set a reminder 30 minutes in the future
    reminder_time = (now + timedelta(minutes=30)).strftime("%H:%M")

    # Patch get_all_goal_reminders and get_user
    mocker.patch.object(
        reminder_module,
        "get_all_goal_reminders",
        return_value=[{"user_id": 1, "reminder_time": reminder_time}],
    )
    mocker.patch.object(reminder_module, "get_user", return_value={"timezone": "UTC"})

    # First call: non-empty list
    wait = reminder_module._next_reminder_seconds()  # noqa: SLF001
    # The wait should be capped at 60 seconds
    assert wait == 60

    # Second call: empty list
    mocker.patch.object(reminder_module, "get_all_goal_reminders", return_value=[])
    wait_empty = reminder_module._next_reminder_seconds()  # noqa: SLF001
    # Default wait should be between 10 and 60
    assert 10 <= wait_empty <= 60


def test_check_reminders(mocker: pytest_mock.MockerFixture) -> None:
    """Test reminder checking and notification sending.

    Verifies that the _check_reminders function correctly:
    - Identifies reminders that are due at the current time
    - Retrieves user and goal information
    - Sends WhatsApp notification with proper message format
    - Includes goal emoji and description in the reminder message


    """
    now = datetime.now(UTC)
    reminder_time = now.strftime("%H:%M")

    # Mock data
    mocker.patch.object(
        reminder_module,
        "get_all_goal_reminders",
        return_value=[
            {"id": 1, "user_id": 1, "user_goal_id": 10, "reminder_time": reminder_time},
        ],
    )
    mocker.patch.object(
        reminder_module,
        "get_user",
        return_value={"timezone": "UTC", "phone_number": "1234567890"},
    )
    mocker.patch.object(
        reminder_module,
        "get_goal",
        return_value={"goal_description": "Test Goal", "goal_emoji": "✅"},
    )

    send_mock = mocker.patch.object(reminder_module, "send_message")

    reminder_module._check_reminders()  # noqa: SLF001

    # Assert message sent
    send_mock.assert_called_once_with("1234567890", "⏰ Reminder: ✅ Test Goal")
