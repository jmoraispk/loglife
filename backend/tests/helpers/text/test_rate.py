"""Tests for rating validation helpers."""

from app.helpers.text import rate


def test_is_valid_rating_digits() -> None:
    """Test validation of rating digit strings."""
    test_cases = [
        ("111", True),
        ("141", False),
        ("abc", False),
        ("", False),
    ]

    for message, expected in test_cases:
        assert rate.is_valid_rating_digits(message) == expected
