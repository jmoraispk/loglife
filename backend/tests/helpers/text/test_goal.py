"""Tests for goal text extraction helpers."""

import pytest
from app.helpers.text import goal


@pytest.mark.parametrize(
    "text, expected",
    [
        ("text without emoji", "🎯"),
        ("text with emoji 🍔", "🍔"),
    ],
)
def test_extract_emoji(text, expected):
    """Test emoji extraction from goal text.

    Arguments:
        text: Goal text to extract emoji from (parametrized)
        expected: Expected emoji result (parametrized)

    """
    assert goal.extract_emoji(text) == expected
