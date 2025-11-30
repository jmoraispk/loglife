"""Tests for webhook utilities."""

from loglife.app.routes.webhook.utils import get_timezone_from_number


def test_get_timezone_from_number() -> None:
    """Test timezone detection from various phone number formats.

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
