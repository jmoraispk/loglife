"""Audio transcription using AssemblyAI API.

This module provides functionality to transcribe audio files by uploading them
to AssemblyAI and polling for the transcription results.
"""

import base64
import time

import requests
from app.config import ASSEMBLYAI_API_KEY, ASSEMBLYAI_BASE_URL


def transcribe_audio(audio_data: str) -> str:
    """Transcribe audio data using AssemblyAI's transcription service.

    Decode base64 audio data, upload it to AssemblyAI, initiate transcription,
    and poll the API until the transcription is completed or an error occurs.

    Arguments:
        audio_data: Base64-encoded audio data string

    Returns:
        The transcription result as text.

    Raises:
        RuntimeError: If the transcription fails at any step.

    """
    audio_bytes = base64.b64decode(audio_data)
    upload_response = requests.post(
        f"{ASSEMBLYAI_BASE_URL}/v2/upload",
        headers={"authorization": ASSEMBLYAI_API_KEY},
        data=audio_bytes,
        timeout=30,
    )
    try:
        upload_response.raise_for_status()
    except requests.HTTPError as e:
        msg = f"Audio upload failed: {e}"
        raise RuntimeError(msg) from e

    upload_url = upload_response.json()["upload_url"]

    transcript_response = requests.post(
        f"{ASSEMBLYAI_BASE_URL}/v2/transcript",
        headers={"authorization": ASSEMBLYAI_API_KEY},
        json={"audio_url": upload_url},
        timeout=30,
    )
    try:
        transcript_response.raise_for_status()
    except requests.HTTPError as e:
        msg = f"Transcription failed: {e}"
        raise RuntimeError(msg) from e

    transcript_id = transcript_response.json()["id"]
    polling_endpoint = f"{ASSEMBLYAI_BASE_URL}/v2/transcript/{transcript_id}"

    while True:
        poll_response = requests.get(
            polling_endpoint,
            headers={"authorization": ASSEMBLYAI_API_KEY},
            timeout=30,
        )
        try:
            poll_response.raise_for_status()
        except requests.HTTPError as e:
            msg = f"Transcription polling failed: {e}"
            raise RuntimeError(msg) from e
        transcript = poll_response.json()

        status = transcript["status"]
        if status == "completed":
            return transcript["text"]
        if status == "error":
            msg = f"Transcription failed: {transcript['error']}"
            raise RuntimeError(msg) from None

        time.sleep(3)
