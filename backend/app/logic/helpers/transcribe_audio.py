"""Helpers for audio transcription workflows."""

import base64
import time
from typing import Any

import requests

from app.utils.api_config import ASSEMBLYAI_BASE_URL, ASSEMBLYAI_HEADERS


def transcribe_audio(audio_data: dict[str, Any]) -> dict[str, Any]:
    """Upload audio bytes to AssemblyAI and poll until transcription completes."""

    audio_bytes = base64.b64decode(audio_data["data"])
    upload_response = requests.post(
        f"{ASSEMBLYAI_BASE_URL}/v2/upload",
        headers=ASSEMBLYAI_HEADERS,
        data=audio_bytes,
    )
    upload_response.raise_for_status()

    upload_url = upload_response.json()["upload_url"]

    transcript_response = requests.post(
        f"{ASSEMBLYAI_BASE_URL}/v2/transcript",
        headers=ASSEMBLYAI_HEADERS,
        json={"audio_url": upload_url},
    )
    transcript_response.raise_for_status()

    transcript_id = transcript_response.json()["id"]
    polling_endpoint = f"{ASSEMBLYAI_BASE_URL}/v2/transcript/{transcript_id}"

    while True:
        poll_response = requests.get(polling_endpoint, headers=ASSEMBLYAI_HEADERS)
        poll_response.raise_for_status()
        transcript = poll_response.json()

        status = transcript.get("status")
        if status == "completed":
            return transcript
        if status == "error":
            raise RuntimeError(f"Transcription failed: {transcript.get('error')}")

        time.sleep(3)


