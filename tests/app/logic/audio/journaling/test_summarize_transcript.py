"""Tests for transcript summarization helpers."""

from unittest.mock import MagicMock, patch

from loglife.app.logic.audio.journaling.summarize_transcript import summarize_transcript


def test_summarize_transcript() -> None:
    """Test transcript summarization returns a string."""
    # Arrange
    mock_response = MagicMock()
    mock_response.json.return_value = {"choices": [{"message": {"content": "Summarized text"}}]}
    mock_response.raise_for_status.return_value = None

    with patch(
        "loglife.app.logic.audio.journaling.summarize_transcript.requests.post"
    ) as mock_post:
        mock_post.return_value = mock_response

        # Act
        result = summarize_transcript("long transcript text")

        # Assert
        assert result == "Summarized text"
        mock_post.assert_called_once()
