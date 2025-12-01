"""Tests for timezone utilities."""

from loglife.app.logic.timezone import get_timezone_from_number


def test_get_timezone_from_number() -> None:
    cases = [
        ("923186491240", "Asia/Karachi"),
        ("+923186491240", "Asia/Karachi"),
        ("123_some_digits", "UTC"),
        ("no_digits", "UTC"),
        ("", "UTC"),
    ]

    for number, expected in cases:
        assert get_timezone_from_number(number) == expected
