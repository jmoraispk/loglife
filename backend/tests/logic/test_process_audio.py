"""Tests for process_audio logic."""

from unittest.mock import patch

from app.logic.process_audio import process_audio


def test_process_audio_journaling_handled() -> None:
    """Test audio processing when handled by journaling."""
    # Arrange
    user = {"id": 1}

    with (
        patch("app.logic.process_audio.process_journal") as mock_journal,
        patch("app.logic.process_audio.send_message") as mock_send,
    ):
        mock_journal.return_value = "Journaling processed"

        # Act
        response = process_audio("12345", user, "audio_data")

        # Assert
        assert response == "Journaling processed"
        mock_send.assert_called_once()
        mock_journal.assert_called_once()
