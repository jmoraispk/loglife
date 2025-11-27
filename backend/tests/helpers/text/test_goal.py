"""Tests for goal text extraction helpers."""

from app.helpers.text import goal


def test_extract_emoji():
    """Test emoji extraction from goal text."""
    test_cases = [
        ("text without emoji", "🎯"),
        ("text with emoji 🍔", "🍔"),
    ]

    for text, expected in test_cases:
        assert goal.extract_emoji(text) == expected
