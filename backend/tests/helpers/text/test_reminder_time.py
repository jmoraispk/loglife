"""Tests for reminder time parsing helpers."""

from app.helpers.text import reminder_time


def test_parse_time_string():
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
