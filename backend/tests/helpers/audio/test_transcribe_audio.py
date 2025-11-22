"""Tests for audio transcription helpers."""

import os
from backend.app.helpers.audio import transcribe_audio

FIXTURE_DIR = os.path.dirname(__file__)
AUDIO_PATH = os.path.join(FIXTURE_DIR, "audio_bytes.txt")


def test_transcribe_audio():
    """Test audio transcription using fixture data."""
    with open(AUDIO_PATH, "r") as f:
        fake_audio = f.read()

    result = transcribe_audio(fake_audio)

    assert result["status"] == "completed"
    assert result["text"].lower() == "hello" or "hello."
