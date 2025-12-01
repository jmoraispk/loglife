"""Tests for audio processing logic."""

from unittest.mock import patch

import pytest
from loglife.app.db.client import db
from loglife.app.db.tables import User
from loglife.app.logic.audio.processor import process_audio


@pytest.fixture
def user() -> User:
    """Create a test user."""
    return db.users.create("+1234567890", "UTC")


def test_process_audio_success(user: User) -> None:
    """Test successful audio processing flow."""
    with (
        patch("loglife.app.logic.audio.processor.transcribe_audio") as mock_transcribe,
        patch("loglife.app.logic.audio.processor.summarize_transcript") as mock_summarize,
        patch("loglife.app.logic.audio.processor.queue_async_message") as mock_queue,
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

        assert mock_queue.call_count == 3  # Received, Transcribed, Stored

        # Verify DB entry
        entries = db.audio_journal.get_by_user(user.id)
        assert len(entries) == 1
        assert entries[0].transcription_text == "Transcribed text"
        assert entries[0].summary_text == "Summary text"


def test_process_audio_empty_transcript(user: User) -> None:
    """Test audio processing when transcription returns empty text.

    Should handle gracefully by returning an error message and NOT summarizing.
    """
    with (
        patch("loglife.app.logic.audio.processor.transcribe_audio") as mock_transcribe,
        patch("loglife.app.logic.audio.processor.summarize_transcript") as mock_summarize,
        patch("loglife.app.logic.audio.processor.queue_async_message"),
    ):
        mock_transcribe.return_value = ""

        response = process_audio("+1234567890", user, "base64_audio")

        assert isinstance(response, str)
        assert response == "Transcription was empty."

        # Verify summarize was NOT called
        mock_summarize.assert_not_called()


def test_process_audio_no_transcript_file(user: User) -> None:
    """Test audio processing explicitly without transcript file."""
    # Ensure user has file disabled
    db.users.update(user.id, send_transcript_file=0)
    user = db.users.get(user.id)  # Refresh
    assert user is not None

    with (
        patch("loglife.app.logic.audio.processor.transcribe_audio") as mock_transcribe,
        patch("loglife.app.logic.audio.processor.summarize_transcript") as mock_summarize,
        patch("loglife.app.logic.audio.processor.queue_async_message"),
    ):
        mock_transcribe.return_value = "Transcribed text"
        mock_summarize.return_value = "Summary text"

        response = process_audio("+1234567890", user, "base64_audio")

        # Should strictly be a string, not a tuple
        assert isinstance(response, str)
        assert response == "Summary text"


def test_process_audio_empty_summary(user: User) -> None:
    """Test audio processing when summarization returns empty text.

    Should store the empty summary without error.
    """
    with (
        patch("loglife.app.logic.audio.processor.transcribe_audio") as mock_transcribe,
        patch("loglife.app.logic.audio.processor.summarize_transcript") as mock_summarize,
        patch("loglife.app.logic.audio.processor.queue_async_message"),
    ):
        mock_transcribe.return_value = "Transcribed text"
        mock_summarize.return_value = ""

        response = process_audio("+1234567890", user, "base64_audio")

        if isinstance(response, tuple):
            _, summary = response
            assert summary == ""
        else:
            assert response == ""

        # Verify DB entry stores empty summary
        entries = db.audio_journal.get_by_user(user.id)
        assert len(entries) == 1
        assert entries[0].transcription_text == "Transcribed text"
        assert entries[0].summary_text == ""


def test_process_audio_transcribe_failure(user: User) -> None:
    """Test audio processing with transcription failure."""
    with (
        patch("loglife.app.logic.audio.processor.transcribe_audio") as mock_transcribe,
        patch("loglife.app.logic.audio.processor.queue_async_message") as mock_queue,
    ):
        mock_transcribe.side_effect = RuntimeError("Transcription error")

        response = process_audio("+1234567890", user, "base64_audio")

        assert response == "Transcription failed!"
        mock_queue.assert_called_once_with(
            "+1234567890", "Audio received. Transcribing...", client_type="whatsapp"
        )


def test_process_audio_summarize_failure(user: User) -> None:
    """Test audio processing with summarization failure."""
    with (
        patch("loglife.app.logic.audio.processor.transcribe_audio") as mock_transcribe,
        patch("loglife.app.logic.audio.processor.summarize_transcript") as mock_summarize,
        patch("loglife.app.logic.audio.processor.queue_async_message") as mock_queue,
    ):
        mock_transcribe.return_value = "Transcribed text"
        mock_summarize.side_effect = RuntimeError("Summarization error")

        response = process_audio("+1234567890", user, "base64_audio")

        assert response == "Summarization failed!"
        assert mock_queue.call_count == 2  # Received, Transcribed


def test_process_audio_with_transcript_file(user: User) -> None:
    """Test audio processing with transcript file enabled."""
    db.users.update(user.id, send_transcript_file=1)
    # Need to re-fetch user or manually update the object passed,
    # because user is a dataclass copy, not a live reference to DB.
    # The process_audio function takes a User object.
    user = db.users.get(user.id)
    assert user is not None

    with (
        patch("loglife.app.logic.audio.processor.transcribe_audio") as mock_transcribe,
        patch("loglife.app.logic.audio.processor.summarize_transcript") as mock_summarize,
        patch("loglife.app.logic.audio.processor.transcript_to_base64") as mock_to_b64,
        patch("loglife.app.logic.audio.processor.queue_async_message"),
    ):
        mock_transcribe.return_value = "Transcribed text"
        mock_summarize.return_value = "Summary text"
        mock_to_b64.return_value = "base64_file_content"

        response = process_audio("+1234567890", user, "base64_audio")

        assert isinstance(response, tuple)
        # Check for the tuple order (transcript_file, summary)
        assert response == ("base64_file_content", "Summary text")

