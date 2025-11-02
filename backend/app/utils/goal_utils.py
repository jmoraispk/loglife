"""Goal parsing and utility functions.

This module provides functions for parsing and extracting information from goal strings,
including emoji detection and extraction.
"""
import re
from typing import Tuple, Optional
from app.utils.messages import DEFAULT_GOAL_EMOJI


def parse_goal_emoji_and_description(goal_string: str) -> Tuple[str, str]:
    """
    Parse emoji and description from a goal string.
    
    Extracts emoji from anywhere in the string and separates it from the description.
    If no emoji is found, uses the default emoji.
    
    Args:
        goal_string (str): Complete goal string with emoji and description
    
    Returns:
        Tuple[str, str]: A tuple containing (goal_emoji, goal_description)
    
    Example:
        emoji, desc = parse_goal_emoji_and_description("😴 Sleep by 9pm")
        # Returns: ("😴", "Sleep by 9pm")
        
        emoji, desc = parse_goal_emoji_and_description("Exercise daily")
        # Returns: ("🎯", "Exercise daily")  # Default emoji
    """
    # Emoji pattern matching common emoji ranges
    emoji_pattern: str = r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\U00002600-\U000026FF\U00002700-\U000027BF\U0001F900-\U0001F9FF\U0001FA70-\U0001FAFF\U0001F018-\U0001F0F5\U0001F200-\U0001F2FF]+'
    match: Optional[re.Match[str]] = re.search(emoji_pattern, goal_string)
    
    if match:
        goal_emoji: str = match.group(0)
        # Remove the emoji from the original string
        goal_description: str = re.sub(emoji_pattern, '', goal_string).strip()
    else:
        # If no emoji found, use default and treat whole string as description
        goal_emoji = DEFAULT_GOAL_EMOJI
        goal_description = goal_string.strip()
    
    return (goal_emoji, goal_description)

