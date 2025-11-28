"""Tests for transcript_to_base64 helper."""

import base64

from app.helpers.audio.journaling.transcript_to_base64 import transcript_to_base64


def test_transcript_to_base64() -> None:
    """Test converting text to base64."""
    text = "Hello World"
    expected = base64.b64encode(text.encode("utf-8")).decode("utf-8")

    result = transcript_to_base64(text)
    assert result == expected
