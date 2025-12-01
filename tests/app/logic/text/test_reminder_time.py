"""Tests for reminder time parsing helpers."""

from loglife.app.logic.text import reminder_time


def test_parse_time_string() -> None:
    """Test parsing of time strings in various formats.

    Verifies support for HH:MM, 12-hour AM/PM, and hour-only formats,
    and properly rejects invalid time inputs.
    """
    test_cases = [
        # Valid HH:MM format
        ("18:00", True),
        ("09:30", True),
        ("0:00", True),
        ("23:59", True),
        # Valid HH AM/PM format
        ("6pm", True),
        ("6 PM", True),
        ("12am", True),
        ("11 AM", True),
        ("12:00 pm", True),
        ("12:00 am", True),
        ("12:30 am", True),
        ("12:30 pm", True),
        # Valid HH only format
        ("0", True),
        ("12", True),
        ("23", True),
        # Invalid cases
        ("25:00", False),  # Invalid hour
        ("12:60", False),  # Invalid minute
        ("13pm", False),  # Invalid 12-hour format
        ("abc", False),  # Not a time
        ("", False),  # Empty string
        ("24", False),  # Hour out of range
    ]

    for message, expected in test_cases:
        assert (reminder_time.parse_time_string(message) is not None) == expected


def test_parse_time_string_values() -> None:
    """Test that parsed times are correct."""
    # Test 12 PM/AM specific logic
    assert reminder_time.parse_time_string("12pm") == "12:00:00"
    assert reminder_time.parse_time_string("12am") == "00:00:00"
    assert reminder_time.parse_time_string("12:00 pm") == "12:00:00"
    assert reminder_time.parse_time_string("12:00 am") == "00:00:00"
    assert reminder_time.parse_time_string("12:30 pm") == "12:30:00"
    assert reminder_time.parse_time_string("12:30 am") == "00:30:00"
