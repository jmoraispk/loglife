"""Tests for process_audio logic."""

from unittest.mock import patch, MagicMock
from app.logic.process_audio import process_audio


def test_process_audio_journaling_handled():
    """Test audio processing when handled by journaling."""
    # Arrange
    user = {"id": 1}
    
    with (
        patch("app.logic.process_audio.process_text") as mock_process_text,
        patch("app.logic.process_audio.transcribe_audio") as mock_transcribe,
        patch("app.logic.process_audio.process_journal") as mock_journal,
        patch("app.logic.process_audio.send_message") as mock_send
    ):
        mock_journal.return_value = "Journaling processed"
        
        # Act
        response = process_audio("12345", user, "audio_data")
        
        # Assert
        assert response == "Journaling processed"
        mock_send.assert_called_once()
        mock_journal.assert_called_once()
        mock_transcribe.assert_not_called()
        mock_process_text.assert_not_called()


def test_process_audio_transcription_fallback():
    """Test audio processing falling back to transcription."""
    # Arrange
    user = {"id": 1}
    
    with (
        patch("app.logic.process_audio.process_text") as mock_process_text,
        patch("app.logic.process_audio.transcribe_audio") as mock_transcribe,
        patch("app.logic.process_audio.process_journal") as mock_journal,
        patch("app.logic.process_audio.send_message") as mock_send
    ):
        mock_journal.return_value = None  # Journaling didn't handle it
        mock_transcribe.return_value = "add goal run"
        mock_process_text.return_value = "Goal added"
        
        # Act
        response = process_audio("12345", user, "audio_data")
        
        # Assert
        assert response == "Goal added"
        mock_transcribe.assert_called_once_with("audio_data")
        mock_process_text.assert_called_once_with(user, "add goal run")


def test_process_audio_transcription_error():
    """Test handling of transcription errors."""
    # Arrange
    user = {"id": 1}
    
    with (
        patch("app.logic.process_audio.process_text") as mock_process_text,
        patch("app.logic.process_audio.transcribe_audio") as mock_transcribe,
        patch("app.logic.process_audio.process_journal") as mock_journal,
        patch("app.logic.process_audio.send_message") as mock_send
    ):
        mock_journal.return_value = None
        mock_transcribe.side_effect = RuntimeError("API Error")
        
        # Act
        response = process_audio("12345", user, "audio_data")
        
        # Assert
        assert response == "Audio transcription failed!"
