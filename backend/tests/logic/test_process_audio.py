"""Tests for process_audio logic."""

from unittest.mock import patch

from app.db.operations import users
from app.logic import process_audio

MODULE = "app.logic.audio.processor"


def test_process_audio_success() -> None:
    """Test successful audio processing with real DB."""
    # Arrange - Setup DB state
    user = users.create_user("+1234567890", "UTC")
    # Ensure send_transcript_file is enabled (default)
    assert user["send_transcript_file"] == 1

    with (
        patch(f"{MODULE}.send_message") as mock_send,
        patch(f"{MODULE}.summarize_transcript") as mock_summarize,
        patch(f"{MODULE}.transcribe_audio") as mock_transcribe,
        patch(f"{MODULE}.create_audio_journal_entry") as mock_create_entry,
    ):
        mock_transcribe.return_value = "Transcript"
        mock_summarize.return_value = "Summary"

        # Act
        response = process_audio("12345", user, "audio_data")

        # Assert
        assert isinstance(response, tuple)
        assert response[1] == "Summary"
        mock_transcribe.assert_called_once()
        mock_summarize.assert_called_once()
        # send_message called:
        # 1. "Audio received. Transcribing..."
        # 2. "Audio transcribed. Summarizing..."
        # 3. "Summary stored in Database."
        assert mock_send.call_count == 3
        mock_create_entry.assert_called_once()


def test_process_audio_no_transcript_file() -> None:
    """Test successful audio processing when transcript file is disabled."""
    # Arrange
    user = users.create_user("+1987654321", "UTC")
    users.update_user(user["id"], send_transcript_file=0)
    user = users.get_user(user["id"])  # Refresh user data

    with (
        patch(f"{MODULE}.send_message"),
        patch(f"{MODULE}.summarize_transcript") as mock_summarize,
        patch(f"{MODULE}.transcribe_audio") as mock_transcribe,
        patch(f"{MODULE}.transcript_to_base64") as mock_base64,
        patch(f"{MODULE}.create_audio_journal_entry"),
    ):
        mock_transcribe.return_value = "Transcript"
        mock_summarize.return_value = "Summary"

        # Act
        response = process_audio("12345", user, "audio_data")

        # Assert
        assert isinstance(response, str)
        assert response == "Summary"
        mock_base64.assert_not_called()


def test_process_audio_transcription_error() -> None:
    """Test handling of transcription errors."""
    user = users.create_user("+1234567890", "UTC")

    with (
        patch(f"{MODULE}.send_message"),
        patch(f"{MODULE}.transcribe_audio") as mock_transcribe,
    ):
        mock_transcribe.side_effect = RuntimeError("API Error")
        response = process_audio("12345", user, "audio_data")
        assert response == "Transcription failed!"


def test_process_audio_summarization_error() -> None:
    """Test handling of summarization errors."""
    user = users.create_user("+1234567890", "UTC")

    with (
        patch(f"{MODULE}.send_message"),
        patch(f"{MODULE}.transcribe_audio") as mock_transcribe,
        patch(f"{MODULE}.summarize_transcript") as mock_summarize,
    ):
        mock_transcribe.return_value = "Transcript"
        mock_summarize.side_effect = RuntimeError("API Error")

        response = process_audio("12345", user, "audio_data")
        assert response == "Summarization failed!"
