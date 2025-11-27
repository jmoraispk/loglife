"""Tests for transcript summarization helpers."""

from unittest.mock import patch, MagicMock
from app.helpers.audio.journaling.summarize_transcript import summarize_transcript


@patch("app.helpers.audio.journaling.summarize_transcript.requests.post")
def test_summarize_transcript(mock_post):
    """Test transcript summarization returns a string."""
    # Arrange
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "choices": [{"message": {"content": "Summarized text"}}]
    }
    mock_response.raise_for_status.return_value = None
    mock_post.return_value = mock_response

    # Act
    result = summarize_transcript("long transcript text")

    # Assert
    assert result == "Summarized text"
    mock_post.assert_called_once()
