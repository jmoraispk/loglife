"""Goal-related text processing utilities.

This module provides functions for extracting and processing goal-related text,
including emoji extraction from goal descriptions.
"""

import re

from app.config import DEFAULT_GOAL_EMOJI

# internal variable (not intended for import)
_emoji_pattern: str = (
    r"[\U0001F600-\U0001F64F"
    r"\U0001F300-\U0001F5FF"
    r"\U0001F680-\U0001F6FF"
    r"\U0001F1E0-\U0001F1FF"
    r"\U00002600-\U000026FF"
    r"\U00002700-\U000027BF"
    r"\U0001F900-\U0001F9FF"
    r"\U0001FA70-\U0001FAFF"
    r"\U0001F018-\U0001F0F5"
    r"\U0001F200-\U0001F2FF]+"
)


def extract_emoji(text: str) -> str:
    """Extract the first emoji from the given text.

    Args:
        text: The text string to search for emoji

    Returns:
        The first emoji found, or the default goal emoji if none is found.

    """
    match = re.search(_emoji_pattern, text)
    return match.group(0) if match else DEFAULT_GOAL_EMOJI
