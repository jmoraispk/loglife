"""Time parsing and formatting utilities.

This module provides functions for parsing various time input formats
from users and formatting time values for display.
"""
import re
import logging


def parse_reminder_time(time_input):
    """
    Parse user input for reminder time.
    Supports formats: 18:00, 6 PM, 6pm, 6:00 PM, etc.
    
    Args:
        time_input (str): User's time input
        
    Returns:
        str: Time in HH:MM format (24-hour), or None if invalid
    """
    if not time_input:
        return None
    
    time_input = time_input.strip().upper()
    
    try:
        # Handle 24-hour format (18:00, 18:30, etc.)
        if re.match(r'^\d{1,2}:\d{2}$', time_input):
            hour, minute = time_input.split(':')
            hour = int(hour)
            minute = int(minute)
            
            if 0 <= hour <= 23 and 0 <= minute <= 59:
                return f"{hour:02d}:{minute:02d}"
        
        # Handle 12-hour format (6 PM, 6:30 PM, etc.)
        pm_match = re.match(r'^(\d{1,2})(?::(\d{2}))?\s*PM$', time_input)
        am_match = re.match(r'^(\d{1,2})(?::(\d{2}))?\s*AM$', time_input)
        
        if pm_match:
            hour = int(pm_match.group(1))
            minute = int(pm_match.group(2) or 0)
            
            if hour == 12:
                hour = 12
            else:
                hour += 12
                
            if 0 <= minute <= 59:
                return f"{hour:02d}:{minute:02d}"
        
        elif am_match:
            hour = int(am_match.group(1))
            minute = int(am_match.group(2) or 0)
            
            if hour == 12:
                hour = 0
                
            if 0 <= minute <= 59:
                return f"{hour:02d}:{minute:02d}"
        
        # Handle simple numbers (6, 18, etc.)
        if re.match(r'^\d{1,2}$', time_input):
            hour = int(time_input)
            if 0 <= hour <= 23:
                return f"{hour:02d}:00"
            elif 1 <= hour <= 12:
                # Assume PM for 1-12
                if hour == 12:
                    return "12:00"
                else:
                    return f"{hour + 12:02d}:00"
        
        return None
        
    except Exception as e:
        logging.error(f"[TIME_PARSER] Failed to parse time '{time_input}': {str(e)}")
        return None


def format_time_for_display(time_str):
    """
    Format time string for user display.
    
    Args:
        time_str (str): Time in HH:MM format
        
    Returns:
        str: Formatted time for display
    """
    if not time_str:
        return "Not set"
    
    try:
        hour, minute = time_str.split(':')
        hour = int(hour)
        minute = int(minute)
        
        if hour == 0:
            return f"12:{minute:02d} AM"
        elif hour < 12:
            return f"{hour}:{minute:02d} AM"
        elif hour == 12:
            return f"12:{minute:02d} PM"
        else:
            return f"{hour - 12}:{minute:02d} PM"
            
    except Exception:
        return time_str
