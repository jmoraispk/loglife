"""Date formatting utilities.

This module provides common date formatting functions used across the application
for consistent date handling and storage.
"""
from datetime import datetime


def storage_date_format(date: datetime) -> str:
    """
    Standardize date format for storage/indexing in the database.
    
    Args:
        date (datetime): The date to format
    
    Returns:
        str: Date formatted as YYYY-MM-DD for storage
    """
    return date.strftime('%Y-%m-%d')

