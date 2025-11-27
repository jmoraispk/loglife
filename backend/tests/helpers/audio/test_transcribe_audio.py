"""Tests for audio transcription helpers."""

import os
from unittest.mock import MagicMock, patch

from app.helpers.audio.transcribe_audio import transcribe_audio

FIXTURE_DIR = os.path.dirname(__file__)
AUDIO_PATH = os.path.join(FIXTURE_DIR, "audio_bytes.txt")


def test_transcribe_audio():
    """Test audio transcription using fixture data."""
    # Arrange
    with open(AUDIO_PATH) as f:
        fake_audio = f.read()

    # Mock upload response
    mock_upload_response = MagicMock()
    mock_upload_response.json.return_value = {"upload_url": "http://fake.url/audio"}
    mock_upload_response.raise_for_status.return_value = None

    # Mock transcript init response
    mock_transcript_response = MagicMock()
    mock_transcript_response.json.return_value = {"id": "fake_id"}
    mock_transcript_response.raise_for_status.return_value = None

    # Mock polling response
    mock_poll_response = MagicMock()
    mock_poll_response.json.return_value = {"status": "completed", "text": "Hello world"}
    mock_poll_response.raise_for_status.return_value = None

    with (
        patch("app.helpers.audio.transcribe_audio.requests.post") as mock_post,
        patch("app.helpers.audio.transcribe_audio.requests.get") as mock_get,
    ):
        # Configure mock side effects
        mock_post.side_effect = [mock_upload_response, mock_transcript_response]
        mock_get.return_value = mock_poll_response

        # Act
        result = transcribe_audio(fake_audio)

        # Assert
        assert result == "Hello world"
