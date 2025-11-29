"""Reminder service package."""

from app.services.reminder.worker import start_reminder_service

__all__ = ["start_reminder_service"]
