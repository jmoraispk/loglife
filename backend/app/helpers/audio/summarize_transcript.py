"""Transcript summarization using OpenAI API.

This module provides functionality to summarize audio transcripts using OpenAI's
chat completion API with a configured system prompt.
"""

import requests
from app.config import (
    OPENAI_API_URL,
    OPENAI_CHAT_MODEL,
    OPENAI_SUMMARIZATION_SYSTEM_PROMPT,
    OPENAI_API_KEY,
)


def summarize_transcript(transcript: str) -> str:
    """Summarizes a transcript using OpenAI's chat completion API.

    Sends the transcript to OpenAI with a configured system prompt and returns
    the summarized content from the API response.

    Arguments:
    transcript -- The transcript text to summarize

    Returns the summarized content as a string.
    """
    payload = {
        "model": OPENAI_CHAT_MODEL,
        "messages": [
            {"role": "developer", "content": OPENAI_SUMMARIZATION_SYSTEM_PROMPT},
            {"role": "user", "content": transcript},
        ],
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}",
    }

    response = requests.post(OPENAI_API_URL, json=payload, headers=headers)

    data = response.json()

    return data["choices"][0]["message"]["content"]
