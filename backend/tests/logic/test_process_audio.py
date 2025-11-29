"""Tests for audio processing logic."""

from unittest.mock import patch

import pytest
from app.db.client import db
from app.logic.audio.processor import process_audio


@pytest.fixture
def user():
    return db.users.create("+1234567890", "UTC")


def test_process_audio_success(user):
    """Test successful audio processing flow."""
    with (
        patch("app.logic.audio.processor.transcribe_audio") as mock_transcribe,
        patch("app.logic.audio.processor.summarize_transcript") as mock_summarize,
        patch("app.logic.audio.processor.send_message") as mock_send,
    ):
        mock_transcribe.return_value = "Transcribed text"
        mock_summarize.return_value = "Summary text"

        response = process_audio("+1234567890", user, "base64_audio")

        if isinstance(response, tuple):
            # Unpack if user settings cause a tuple return (e.g., file enabled)
            _, summary = response
            assert summary == "Summary text"
        else:
            assert response == "Summary text"
            
        assert mock_send.call_count == 3  # Received, Transcribed, Stored

        # Verify DB entry
        entries = db.audio_journal.get_by_user(user.id)
        assert len(entries) == 1
        assert entries[0].transcription_text == "Transcribed text"
        assert entries[0].summary_text == "Summary text"


def test_process_audio_transcribe_failure(user):
    """Test audio processing with transcription failure."""
    with (
        patch("app.logic.audio.processor.transcribe_audio") as mock_transcribe,
        patch("app.logic.audio.processor.send_message") as mock_send,
    ):
        mock_transcribe.side_effect = RuntimeError("Transcription error")

        response = process_audio("+1234567890", user, "base64_audio")

        assert response == "Transcription failed!"
        mock_send.assert_called_once_with("+1234567890", "Audio received. Transcribing...")


def test_process_audio_summarize_failure(user):
    """Test audio processing with summarization failure."""
    with (
        patch("app.logic.audio.processor.transcribe_audio") as mock_transcribe,
        patch("app.logic.audio.processor.summarize_transcript") as mock_summarize,
        patch("app.logic.audio.processor.send_message") as mock_send,
    ):
        mock_transcribe.return_value = "Transcribed text"
        mock_summarize.side_effect = RuntimeError("Summarization error")

        response = process_audio("+1234567890", user, "base64_audio")

        assert response == "Summarization failed!"
        assert mock_send.call_count == 2  # Received, Transcribed


def test_process_audio_with_transcript_file(user):
    """Test audio processing with transcript file enabled."""
    db.users.update(user.id, send_transcript_file=1)
    # Need to re-fetch user or manually update the object passed, 
    # because user is a dataclass copy, not a live reference to DB.
    # The process_audio function takes a User object.
    user = db.users.get(user.id)

    with (
        patch("app.logic.audio.processor.transcribe_audio") as mock_transcribe,
        patch("app.logic.audio.processor.summarize_transcript") as mock_summarize,
        patch("app.logic.audio.processor.transcript_to_base64") as mock_to_b64,
        patch("app.logic.audio.processor.send_message") as mock_send,
    ):
        mock_transcribe.return_value = "Transcribed text"
        mock_summarize.return_value = "Summary text"
        mock_to_b64.return_value = "base64_file_content"

        response = process_audio("+1234567890", user, "base64_audio")

        assert isinstance(response, tuple)
        # Check for the tuple order (transcript_file, summary)
        assert response == ("base64_file_content", "Summary text")
