"""Tests for rating validation helpers."""

import pytest
from app.helpers.text import rate


@pytest.mark.parametrize(
    "message, expected",
    [
        ("111", True),
        ("141", False),
        ("abc", False),
        ("", False),
    ],
)
def test_is_valid_rating_digits(message, expected):
    """Test validation of rating digit strings.

    Arguments:
        message: Rating string to validate (parametrized)
        expected: Whether the rating is valid (parametrized)

    """
    assert rate.is_valid_rating_digits(message) == expected
