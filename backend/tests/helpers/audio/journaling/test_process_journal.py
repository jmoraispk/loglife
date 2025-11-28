"""Tests for process_journal helper."""

from unittest.mock import patch

from app.db.operations import users
from app.helpers.audio.journaling import process_journal

MODULE = "app.helpers.audio.journaling.process_journal"


def test_process_journal_success() -> None:
    """Test successful journal processing with real DB."""
    # Arrange - Setup DB state
    user = users.create_user("+1234567890", "UTC")

    with (
        patch(f"{MODULE}.send_message") as mock_send,
        patch(f"{MODULE}.summarize_transcript") as mock_summarize,
        patch(f"{MODULE}.transcribe_audio") as mock_transcribe,
    ):
        mock_transcribe.return_value = "Transcript"
        mock_summarize.return_value = "Summary"

        # Act
        response = process_journal("12345", user, "audio_data")

        # Assert
        assert response is not None
        assert response[1] == "Summary"
        mock_transcribe.assert_called_once()
        mock_summarize.assert_called_once()
        mock_send.assert_called()


def test_process_journal_exceptions() -> None:
    """Test exception handling in process_journal."""
    user = users.create_user("+1234567890", "UTC")

    # Test Transcription Error
    with (
        patch(f"{MODULE}.send_message"),
        patch(f"{MODULE}.transcribe_audio") as mock_transcribe,
    ):
        mock_transcribe.side_effect = RuntimeError("API Error")
        response = process_journal("12345", user, "audio_data")
        assert response == "Transcription failed!"

    # Test Summarization Error
    with (
        patch(f"{MODULE}.send_message"),
        patch(f"{MODULE}.transcribe_audio") as mock_transcribe,
        patch(f"{MODULE}.summarize_transcript") as mock_summarize,
    ):
        mock_transcribe.return_value = "Transcript"
        mock_summarize.side_effect = RuntimeError("API Error")

        response = process_journal("12345", user, "audio_data")
        assert response == "Summarization failed!"
