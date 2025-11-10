"""Utilities for summarizing audio transcripts using OpenAI models."""

from typing import Any

import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()


def summarize_transcript(transcript_text: str) -> str:
    """Return a concise summary for the provided transcript text."""

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is not set")

    client = OpenAI(api_key=api_key)
    response: Any = client.responses.create(
        model="gpt-5-nano",
        instructions="You are a helpful assistant that summarizes audio transcripts.",
        input=transcript_text,
    )
    return response.output_text


