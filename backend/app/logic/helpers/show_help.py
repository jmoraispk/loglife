"""Help message display utilities.

This module provides functions for displaying help and usage information
to users of the Life Bot application.
"""
from app.utils.messages import HELP_MESSAGE

def show_help() -> str:
    """
    Show available commands and their descriptions.
    
    Returns:
        str: Formatted help message
    """
    return HELP_MESSAGE
