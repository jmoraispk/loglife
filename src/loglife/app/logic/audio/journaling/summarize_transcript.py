"""Transcript summarization using OpenAI API.

This module provides functionality to summarize audio transcripts using OpenAI's
chat completion API with a configured system prompt.
"""

import logging

import requests
from loglife.app.config import (
    OPENAI_API_KEY,
    OPENAI_API_URL,
    OPENAI_CHAT_MODEL,
    OPENAI_SUMMARIZATION_SYSTEM_PROMPT,
)

logger = logging.getLogger(__name__)


def summarize_transcript(transcript: str) -> str:
    """Summarize a transcript using OpenAI's chat completion API.

    Send the transcript to OpenAI with a configured system prompt and returns
    the summarized content from the API response.

    Arguments:
        transcript: The transcript text to summarize

    Returns:
        The summarized content as a string.

    Raises:
        RuntimeError: If the API request fails due to connection, timeout, or
            HTTP errors

    """
    logger.debug("Incoming transcript: %s", transcript)
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

    try:
        # Set timeout to 30 seconds to prevent indefinite hangs
        response = requests.post(OPENAI_API_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except requests.Timeout as e:
        msg = "OpenAI API request timed out"
        raise RuntimeError(msg) from e
    except requests.ConnectionError as e:
        msg = "Failed to connect to OpenAI API"
        raise RuntimeError(msg) from e
    except requests.HTTPError as e:
        msg = "OpenAI API returned an error"
        raise RuntimeError(msg) from e
    except requests.RequestException as e:
        msg = "OpenAI API request failed"
        raise RuntimeError(msg) from e
    except (KeyError, ValueError) as e:
        msg = "Failed to parse OpenAI API response"
        raise RuntimeError(msg) from e
