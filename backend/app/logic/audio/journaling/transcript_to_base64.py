"""Utility to convert text transcript to base64 format."""

import base64


def transcript_to_base64(text: str) -> str:
    """Convert a string into Base64-encoded data for a .txt file.

    Arguments:
        text: The text string to encode

    Returns:
        The Base64 string.

    """
    file_bytes = text.encode("utf-8")
    return base64.b64encode(file_bytes).decode("utf-8")
