"""
Tests for timezone detection from phone numbers.

This module tests the get_timezone_from_number helper function
which extracts timezone information based on phone number patterns.
"""

from app.helpers import get_timezone_from_number


def test_get_timezone_from_number():
    """
    Test timezone detection from various phone number formats.

    Verifies that the function correctly identifies timezones from valid
    phone numbers and defaults to UTC for invalid or empty inputs.
    """
    test_cases = [
        ("923186491240", "Asia/Karachi"),
        ("+923186491240", "Asia/Karachi"),
        ("123_some_digits", "UTC"),
        ("no_digits", "UTC"),
        ("", "UTC"),
    ]
    
    for number, expected in test_cases:
        assert get_timezone_from_number(number) == expected
