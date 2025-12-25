"""Message processing logic for inbound WhatsApp text commands."""

import logging
import re

from loglife.app.config import COMMAND_ALIASES, messages
from loglife.app.db.tables import User
from loglife.app.logic.text.handlers import (
    AddGoalHandler,
    CallHandler,
    CheckinHandler,
    CheckinNowHandler,
    DeleteGoalHandler,
    EditTimeHandler,
    EnableJournalingHandler,
    GoalsListHandler,
    HabitsHandler,
    HelpHandler,
    JournalPromptsHandler,
    ListHandler,
    LookbackHandler,
    MenuHandler,
    RateAllHandler,
    RateSingleHandler,
    ReminderTimeHandler,
    TextCommandHandler,
    TranscriptToggleHandler,
    UpdateReminderHandler,
    WeekSummaryHandler,
)
from loglife.core.messaging import Message

logger = logging.getLogger(__name__)

# Instantiate handlers once at module level to avoid overhead on every call
# Order matters for priority
HANDLERS: list[TextCommandHandler] = [
    AddGoalHandler(),
    EnableJournalingHandler(),
    JournalPromptsHandler(),
    DeleteGoalHandler(),
    ReminderTimeHandler(),
    GoalsListHandler(),
    UpdateReminderHandler(),
    TranscriptToggleHandler(),
    WeekSummaryHandler(),
    LookbackHandler(),
    RateSingleHandler(),
    RateAllHandler(),
    CheckinNowHandler(),
    EditTimeHandler(),
    CheckinHandler(),
    CallHandler(),
    HabitsHandler(),
    MenuHandler(),
    ListHandler(),
    HelpHandler(),
]


def _handle_reminder_time_state(user: User, text_content: str) -> str | None:
    """Handle messages when user is in awaiting_reminder_time state.

    Args:
        user: The user record
        text_content: The normalized message text

    Returns:
        Response message if handled, None otherwise
    """
    reminder_handler = ReminderTimeHandler()
    if reminder_handler.matches(text_content):
        result = reminder_handler.handle(user, text_content)
        if result:
            return result
    return messages.ERROR_COMPLETE_REMINDER_TIME


def _apply_command_aliases(text_content: str) -> str:
    """Apply command aliases to text content.

    Args:
        text_content: The original text content

    Returns:
        Text content with aliases replaced
    """
    for alias, command in COMMAND_ALIASES.items():
        pattern = r"\b" + re.escape(alias) + r"\b"
        text_content = re.sub(pattern, command, text_content)
    return text_content


def _try_handler(
    handler: TextCommandHandler, user: User, text_content: str
) -> tuple[str | None, bool]:
    """Try to handle a message with a specific handler.

    Args:
        handler: The handler to try
        user: The user record
        text_content: The normalized message text

    Returns:
        Tuple of (response message if handled, whether handler matched).
        If handler matched but returned None, returns (None, True) to indicate
        the message was already sent by the handler.
    """
    if not handler.matches(text_content):
        return None, False

    result = handler.handle(user, text_content)

    if result is not None:
        return result, True

    # If handler returns None and it's not AddGoalHandler,
    # it means the message was already sent (e.g., ListHandler, MenuHandler)
    # Return (None, True) to indicate handler matched and processed the message
    return None, True


def process_text(user: User, message: Message) -> str | None:
    """Route incoming text commands to the appropriate goal or rating handler.

    Handle commands such as adding goals, submitting ratings, configuring
    reminder times, and generating look-back summaries. Maintain temporary
    state for multi-step flows (e.g., goal reminder setup).

    Arguments:
        user: The user record for the message sender
        message: The incoming message object

    Returns:
        The WhatsApp response text to send back to the user.

    """
    try:
        text_content: str = message.raw_payload.strip().lower()

        # Check for blocking states
        if user.state == "awaiting_reminder_time":
            return _handle_reminder_time_state(user, text_content)

        # Add aliases (with word boundaries to avoid replacing partial words)
        text_content = _apply_command_aliases(text_content)

        # Execute the first matching command handler
        for handler in HANDLERS:
            result, matched = _try_handler(handler, user, text_content)
            if matched:
                # Handler matched - if it returned a message, return it
                # If it returned None, it means it already sent the message, so return None
                return result
            # If handler didn't match, continue to next handler

    except Exception as exc:
        logger.exception("Error in text processor")
        return messages.ERROR_TEXT_PROCESSOR.format(exc=exc)

    # No handler matched the message
    return messages.ERROR_WRONG_COMMAND
