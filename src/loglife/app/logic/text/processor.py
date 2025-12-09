"""Message processing logic for inbound WhatsApp text commands."""

import logging
import re

from loglife.app.config import COMMAND_ALIASES, messages
from loglife.app.db.tables import User
from loglife.app.logic.text.handlers import (
    AddGoalHandler,
    DeleteGoalHandler,
    EnableJournalingHandler,
    GoalsListHandler,
    HelpHandler,
    JournalPromptsHandler,
    LookbackHandler,
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
    HelpHandler(),
]


def process_text(user: User, message: Message) -> str:
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

        # Add aliases (with word boundaries to avoid replacing partial words)
        for alias, command in COMMAND_ALIASES.items():
            # Escape alias to be safe in regex
            pattern = r"\b" + re.escape(alias) + r"\b"
            text_content = re.sub(pattern, command, text_content)

        # Execute the first matching command handler
        for handler in HANDLERS:
            if handler.matches(text_content):
                result = handler.handle(user, text_content)
                # Special case: add_goal can return None if no goal text provided
                if result is not None:
                    return result

    except Exception as exc:
        logger.exception("Error in text processor")
        return messages.ERROR_TEXT_PROCESSOR.format(exc=exc)

    return messages.ERROR_WRONG_COMMAND
