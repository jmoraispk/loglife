"""Unit tests for multi-habit check-in parsing in services._parse_ratings."""

from app.core.services import ServiceContainer


def test_parse_ratings_digits_three_habits():
    sc = ServiceContainer.default()
    vals = sc._parse_ratings("321", 3)
    assert vals == [3, 2, 1]


def test_parse_ratings_spaces_two_habits():
    sc = ServiceContainer.default()
    vals = sc._parse_ratings("3 2", 2)
    assert vals == [3, 2]


def test_parse_ratings_emojis_pad():
    sc = ServiceContainer.default()
    vals = sc._parse_ratings("✅⚠️", 3)
    assert vals == [3, 2, None]
