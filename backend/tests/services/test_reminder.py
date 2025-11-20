from zoneinfo import ZoneInfo
from datetime import datetime, timezone, timedelta
import backend.app.services.reminder as reminder_module


def test_get_timezone_safe():
    assert reminder_module._get_timezone_safe("America/New_York") == ZoneInfo(
        "America/New_York"
    )
    assert reminder_module._get_timezone_safe(" America/New_York ") == ZoneInfo(
        "America/New_York"
    )
    assert reminder_module._get_timezone_safe("Not/AZone") == ZoneInfo("UTC")
    assert reminder_module._get_timezone_safe("") == ZoneInfo("UTC")


def test_next_reminder_seconds(mocker):
    now = datetime.now(timezone.utc)
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
    wait = reminder_module._next_reminder_seconds()
    # The wait should be roughly 1800 seconds (30 minutes)
    assert 1795 <= wait <= 1805  # allow a few seconds tolerance

    # Second call: empty list
    mocker.patch.object(reminder_module, "get_all_goal_reminders", return_value=[])
    wait_empty = reminder_module._next_reminder_seconds()
    # Default wait should be between 10 and 3600 (your function uses 60 if no reminders)
    assert 10 <= wait_empty <= 60


def test_check_reminders(mocker):
    now = datetime.now(timezone.utc)
    reminder_time = now.strftime("%H:%M")

    # Mock data
    mocker.patch.object(
        reminder_module,
        "get_all_goal_reminders",
        return_value=[
            {"user_id": 1, "user_goal_id": 10, "reminder_time": reminder_time}
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

    send_mock = mocker.patch.object(reminder_module, "send_whatsapp_message")

    reminder_module._check_reminders()

    # Assert message sent
    send_mock.assert_called_once_with("1234567890", "⏰ Reminder: ✅ Test Goal")
