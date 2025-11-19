# backend\app\helpers\webhook\get_timezone.py
import pytest
from app.helpers import get_timezone_from_number

@pytest.mark.parametrize(
    "number, expected",
    [
        ("923186491240", "Asia/Karachi"),
        ("+923186491240", "Asia/Karachi"),
        ("123_some_digits", "UTC"),
        ("no_digits", "UTC"),
        ("", "UTC"),
    ]
)
def test_get_timezone_from_number(number, expected):
    assert get_timezone_from_number(number) == expected