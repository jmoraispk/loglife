"""Command parsing utilities.

This module provides functions for parsing user commands and extracting
parameters from message strings.
"""
from typing import Optional, Tuple


def parse_lookback_days(message: str, default: int = 7) -> int:
    """
    Parse number of days from lookback command.
    
    Args:
        message (str): Command message (e.g., "lookback 5" or "lookback")
        default (int): Default number of days if not specified
    
    Returns:
        int: Number of days to look back
    """
    parts = message.split()
    if len(parts) > 1 and parts[1].isdigit():
        return int(parts[1])
    return default


def parse_add_goal_command(message: str) -> Optional[str]:
    """
    Parse goal string from "add goal" command.
    
    Args:
        message (str): Command message (e.g., "add goal 😴 Sleep by 9pm")
    
    Returns:
        Optional[str]: Goal string (emoji + description) or None if invalid format
    """
    parts = message.split(" ", 2)  # Split into max 3 parts
    if len(parts) >= 3:
        return parts[2]  # Everything after "add goal"
    return None


def parse_rate_command(message: str) -> Optional[Tuple[int, int]]:
    """
    Parse goal number and rating from "rate" command.
    
    Args:
        message (str): Command message (e.g., "rate 2 3")
    
    Returns:
        Optional[Tuple[int, int]]: Tuple of (goal_number, rating) or None if invalid
    """
    parts = message.split()
    if len(parts) == 3 and parts[1].isdigit() and parts[2].isdigit():
        return (int(parts[1]), int(parts[2]))
    return None


def is_valid_rating_digits(message: str) -> bool:
    """
    Check if message contains valid rating digits (1-3 only).
    
    Args:
        message (str): Message to check
    
    Returns:
        bool: True if message contains only digits 1, 2, or 3
    """
    return message.isdigit() and all(c in "123" for c in message)

