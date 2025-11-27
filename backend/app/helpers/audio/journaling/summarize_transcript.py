"""Transcript summarization using OpenAI API.

This module provides functionality to summarize audio transcripts using OpenAI's
chat completion API with a configured system prompt.
"""

import logging

import requests

from app.config import (
    OPENAI_API_KEY,
    OPENAI_API_URL,
    OPENAI_CHAT_MODEL,
    OPENAI_SUMMARIZATION_SYSTEM_PROMPT,
)


def summarize_transcript(transcript: str) -> str:
    """Summarizes a transcript using OpenAI's chat completion API.

    Sends the transcript to OpenAI with a configured system prompt and returns
    the summarized content from the API response.

    Arguments:
    transcript -- The transcript text to summarize

    Returns the summarized content as a string.
    
    Raises:
    RuntimeError -- If the API request fails due to connection, timeout, or HTTP errors

    """
    logging.debug(f"Incoming transcript: {transcript}")
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
        raise RuntimeError(f"OpenAI API request timed out: {e}")
    except requests.ConnectionError as e:
        raise RuntimeError(f"Failed to connect to OpenAI API: {e}")
    except requests.HTTPError as e:
        raise RuntimeError(f"OpenAI API returned an error: {e}")
    except requests.RequestException as e:
        raise RuntimeError(f"OpenAI API request failed: {e}")
    except (KeyError, ValueError) as e:
        raise RuntimeError(f"Failed to parse OpenAI API response: {e}")
