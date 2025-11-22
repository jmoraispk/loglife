"""Tests for transcript summarization helpers."""

from backend.app.helpers.audio import summarize_transcript


def test_summarize_transcript():
    """Test transcript summarization returns a string."""
    result = summarize_transcript("long transcript text")

    assert isinstance(result, str)
