"""Edge case tests for reminder worker."""

from datetime import UTC, datetime
from unittest.mock import MagicMock

from loglife.app.services.reminder.worker import _is_reminder_due


def test_missed_reminder_window():
    """Test that reminders are missed if the worker sleeps too long.

    This documents a limitation in the current infrastructure:
    Reminders require exact minute matching.
    """
    reminder = MagicMock()
    reminder.reminder_time = "09:00"

    user = MagicMock()
    user.timezone = "UTC"

    # 1. Exact time match -> True
    now_exact = datetime(2023, 1, 1, 9, 0, 0, tzinfo=UTC)
    assert _is_reminder_due(reminder, user, now_exact) is True

    # 2. Worker runs 1 minute late -> False (Missed!)
    now_late = datetime(2023, 1, 1, 9, 1, 0, tzinfo=UTC)
    assert _is_reminder_due(reminder, user, now_late) is False
