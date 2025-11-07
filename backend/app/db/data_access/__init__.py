"""Data access layer for database operations.

This module provides a unified interface for accessing database functions
across different domains (user goals, users, etc.).
"""
from .user_goals import get_user_goals
from .audio_journal import create_audio_journal_entry

__all__ = ["get_user_goals", "create_audio_journal_entry"]

