"""Handlers for WhatsApp text commands using the Command Pattern."""

import json
import logging
import re
from abc import ABC, abstractmethod
from datetime import UTC, datetime, timedelta

from loglife.app.config import (
    DEFAULT_GOAL_EMOJI,
    LOGLIFE_DOMAIN,
    SECRET_KEY,
    STYLE,
    WHATSAPP_CLIENT_TYPE,
    messages,
)
from loglife.app.db import db
from loglife.app.db.tables import Goal, Rating, User
from loglife.app.logic.text.reminder_time import parse_time_string
from loglife.app.logic.text.week import get_monday_before, look_back_summary
from loglife.app.services.reminder.utils import get_goals_not_tracked_today
from loglife.core.messaging import (
    send_whatsapp_cta_url,
    send_whatsapp_list_message,
    send_whatsapp_reply_buttons,
)
from loglife.core.tokens import generate_short_token
from loglife.core.transports import send_whatsapp_message
from loglife.core.whatsapp_business_api import (
    ListRow,
    ListSection,
    ReplyButton,
    URLButton,
)

logger = logging.getLogger(__name__)

MIN_PARTS_EXPECTED = 2

# internal variable
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


def _extract_emoji(text: str) -> str:
    """Extract the first emoji from the given text."""
    match = re.search(_emoji_pattern, text)
    return match.group(0) if match else DEFAULT_GOAL_EMOJI


class TextCommandHandler(ABC):
    """Abstract base class for text command handlers."""

    @abstractmethod
    def matches(self, message: str) -> bool:
        """Check if the handler can process the message."""
        ...

    @abstractmethod
    def handle(self, user: User, message: str) -> str | None:
        """Process the message and return a response."""
        ...


class AddGoalHandler(TextCommandHandler):
    """Handle 'add goal' command."""

    PREFIX = "add goal"

    def matches(self, message: str) -> bool:
        """Check if message contains 'add goal'."""
        return self.PREFIX in message

    def handle(self, user: User, message: str) -> str | None:
        """Process 'add goal' command."""
        user_id = user.id
        raw_goal: str = message.replace(self.PREFIX, "")
        if raw_goal:
            goal_emoji: str = _extract_emoji(raw_goal)
            goal_description: str = raw_goal.replace(goal_emoji, "").strip()
            goal: Goal = db.goals.create(user_id, goal_emoji, goal_description)
            if goal:
                db.users.set_state(
                    user_id,
                    state="awaiting_reminder_time",
                    state_data=json.dumps({"goal_id": goal.id}),
                )
                return messages.SUCCESS_GOAL_ADDED
        return None


class EnableJournalingHandler(TextCommandHandler):
    """Handle 'enable journaling' command."""

    COMMAND = "enable journaling"

    def matches(self, message: str) -> bool:
        """Check if message is 'enable journaling'."""
        return message == self.COMMAND

    def handle(self, user: User, _message: str) -> str | None:
        """Process 'enable journaling' command."""
        user_id: int = user.id
        user_goals: list[Goal] = db.goals.get_by_user(user_id)
        for goal in user_goals:
            if goal.goal_emoji == "📓" and "journaling" in goal.goal_description:
                return messages.SUCCESS_JOURNALING_ENABLED

        # Delegate to AddGoalHandler
        add_handler = AddGoalHandler()
        return add_handler.handle(user, "add goal 📓 journaling")


class JournalPromptsHandler(TextCommandHandler):
    """Handle 'journal prompts' or 'journal now' commands."""

    def matches(self, message: str) -> bool:
        """Check if message contains journal prompts/now."""
        return "journal prompts" in message or "journal now" in message

    def handle(self, user: User, _message: str) -> str | None:
        """Process journal prompts command."""
        user_id = user.id
        goals_not_tracked_today: list[Goal] = get_goals_not_tracked_today(user_id)
        if goals_not_tracked_today:
            return messages.JOURNAL_REMINDER_MESSAGE.replace(
                "<goals_not_tracked_today>",
                messages.REMINDER_UNTRACKED_HEADER
                + "\n".join([f"- {goal.goal_description}" for goal in goals_not_tracked_today]),
            )

        return messages.JOURNAL_REMINDER_MESSAGE.replace("\n\n<goals_not_tracked_today>", "")


class DeleteGoalHandler(TextCommandHandler):
    """Handle 'delete' command."""

    PREFIX = "delete"

    def matches(self, message: str) -> bool:
        """Check if message starts with 'delete'."""
        return message.startswith(self.PREFIX)

    def handle(self, user: User, message: str) -> str | None:
        """Process delete command."""
        user_id = user.id
        try:
            goal_num: int = int(message.replace(self.PREFIX, "").strip())
        except ValueError:
            return messages.ERROR_INVALID_DELETE_FORMAT

        if goal_num <= 0:
            return messages.ERROR_INVALID_GOAL_NUMBER

        user_goals: list[Goal] = db.goals.get_by_user(user_id)
        if not user_goals or goal_num > len(user_goals):
            return messages.ERROR_INVALID_GOAL_NUMBER

        goal: Goal = user_goals[goal_num - 1]

        db.goals.delete(goal.id)

        return messages.SUCCESS_GOAL_DELETED.format(
            goal_emoji=goal.goal_emoji,
            goal_description=goal.goal_description,
        )


class ReminderTimeHandler(TextCommandHandler):
    """Handle time input for goal reminders."""

    def matches(self, message: str) -> bool:
        """Check if message is a valid time string."""
        return parse_time_string(message) is not None

    def handle(self, user: User, message: str) -> str | None:
        """Process time input."""
        user_id = user.id
        normalized_time: str | None = parse_time_string(message)
        if normalized_time is None:
            return None  # Should be caught by matches, but for type safety

        # Refresh user object to get latest state
        current_user: User | None = db.users.get(user_id)
        if not current_user or current_user.state != "awaiting_reminder_time":
            return messages.ERROR_ADD_GOAL_FIRST

        temp = json.loads(current_user.state_data or "{}")
        goal_id = temp.get("goal_id")

        db.goals.update(goal_id, reminder_time=normalized_time)
        db.users.set_state(user_id, None)

        # Convert 24-hour format to 12-hour AM/PM format
        time_obj = datetime.strptime(normalized_time, "%H:%M:%S").time()  # noqa: DTZ007
        display_time = time_obj.strftime("%I:%M %p")

        # Get the goal to display in confirmation
        goal: Goal | None = db.goals.get(goal_id)
        if not goal:
            return messages.ERROR_GOAL_NOT_FOUND

        goal_desc = goal.goal_description
        goal_emoji = goal.goal_emoji
        return messages.SUCCESS_REMINDER_SET.format(
            display_time=display_time,
            goal_emoji=goal_emoji,
            goal_desc=goal_desc,
        )


class GoalsListHandler(TextCommandHandler):
    """Handle 'goals' command."""

    COMMAND = "goals"

    def matches(self, message: str) -> bool:
        """Check if message is 'goals'."""
        return message == self.COMMAND

    def handle(self, user: User, _message: str) -> str | None:
        """Process goals list command."""
        user_id = user.id
        user_goals: list[Goal] = db.goals.get_by_user(user_id)

        if not user_goals:
            return messages.ERROR_NO_GOALS_SET

        # Format each goal with its description
        goal_lines: list[str] = []
        for i, goal in enumerate(user_goals, 1):
            time_display = ""
            if goal.reminder_time:
                time_obj = datetime.strptime(  # noqa: DTZ007
                    # Ensure reminder_time is string
                    str(goal.reminder_time),
                    "%H:%M:%S",
                ).time()
                time_display = f" ⏰ {time_obj.strftime('%I:%M %p')}"
            goal_desc = goal.goal_description
            goal_emoji = goal.goal_emoji
            boost = goal.boost_level
            goal_lines.append(f"{i}. {goal_emoji} {goal_desc} (boost {boost}) {time_display}")

        response = "```" + "\n".join(goal_lines) + "```"
        response += messages.GOALS_LIST_TIPS
        return response


class UpdateReminderHandler(TextCommandHandler):
    """Handle 'update' command."""

    PREFIX = "update"

    def matches(self, message: str) -> bool:
        """Check if message starts with 'update'."""
        return message.startswith(self.PREFIX)

    def handle(self, user: User, message: str) -> str | None:
        """Process update reminder command."""
        user_id = user.id
        parts = message.replace(self.PREFIX, "").strip().split(" ")
        if len(parts) != MIN_PARTS_EXPECTED:
            return messages.ERROR_INVALID_UPDATE_FORMAT
        goal_num: int = int(parts[0])
        time_input: str = parts[1]

        # Validate and get normalized time
        normalized_time = parse_time_string(time_input)
        if not normalized_time:
            return messages.ERROR_INVALID_TIME_FORMAT

        user_goals: list[Goal] = db.goals.get_by_user(user_id)
        if not user_goals or goal_num > len(user_goals) or goal_num < 1:
            return messages.ERROR_INVALID_GOAL_NUMBER

        goal: Goal = user_goals[goal_num - 1]

        db.goals.update(goal.id, reminder_time=normalized_time)

        time_obj = datetime.strptime(normalized_time, "%H:%M:%S").time()  # noqa: DTZ007
        display_time = time_obj.strftime("%I:%M %p")

        goal_emoji = goal.goal_emoji
        goal_desc = goal.goal_description
        return messages.SUCCESS_REMINDER_UPDATED.format(
            display_time=display_time,
            goal_emoji=goal_emoji,
            goal_desc=goal_desc,
        )


class TranscriptToggleHandler(TextCommandHandler):
    """Handle 'transcript' command."""

    KEYWORD = "transcript"

    def matches(self, message: str) -> bool:
        """Check if message contains 'transcript'."""
        return self.KEYWORD in message

    def handle(self, user: User, message: str) -> str | None:
        """Process transcript toggle command."""
        user_id = user.id
        if "on" in message:
            db.users.update(user_id, send_transcript_file=1)
            return messages.SUCCESS_TRANSCRIPT_ENABLED
        if "off" in message:
            db.users.update(user_id, send_transcript_file=0)
            return messages.SUCCESS_TRANSCRIPT_DISABLED
        return messages.ERROR_INVALID_TRANSCRIPT_CMD


class WeekSummaryHandler(TextCommandHandler):
    """Handle 'week' command."""

    COMMAND = "week"

    def matches(self, message: str) -> bool:
        """Check if message is 'week'."""
        return message == self.COMMAND

    def handle(self, user: User, _message: str) -> str | None:
        """Process week summary command."""
        user_id = user.id
        start: datetime = get_monday_before()

        # Create Week Summary Header (E.g. Week 26: Jun 30 - Jul 06)
        week_num: str = start.strftime("%W")
        week_start: str = start.strftime("%b %d")
        week_end: str = (start + timedelta(days=6)).strftime("%b %d")
        if week_end.startswith(week_start[:3]):
            week_end = week_end[4:]

        summary: str = f"```Week {week_num}: {week_start} - {week_end}\n"

        # Add Goals Header
        user_goals: list[Goal] = db.goals.get_by_user(user_id)
        if not user_goals:
            return messages.ERROR_NO_GOALS_SET

        goal_emojis: list[str] = [goal.goal_emoji for goal in user_goals]
        summary += "    " + " ".join(goal_emojis) + "\n```"

        # Add Day-by-Day Summary
        summary += look_back_summary(user_id, 7, start)
        return summary


class LookbackHandler(TextCommandHandler):
    """Handle 'lookback' command."""

    PREFIX = "lookback"

    def matches(self, message: str) -> bool:
        """Check if message starts with 'lookback'."""
        return message.startswith(self.PREFIX)

    def handle(self, user: User, message: str) -> str | None:
        """Process lookback command."""
        user_id = user.id
        # Check if user has any goals first
        user_goals: list[Goal] = db.goals.get_by_user(user_id)
        if not user_goals:
            return messages.ERROR_NO_GOALS_SET

        # Extract number of days
        parts: list[str] = message.split()
        if len(parts) == MIN_PARTS_EXPECTED and parts[1].isdigit():
            days: int = int(parts[1])
        else:
            days = 7  # Default to 7 days
        start = datetime.now(tz=UTC) - timedelta(days=days - 1)
        end = datetime.now(tz=UTC)

        # Create date range header
        start_date: str = start.strftime("%b %d")
        end_date: str = end.strftime("%b %d")
        if end_date.startswith(start_date[:3]):  # Same month
            end_date = end_date[4:]

        summary: str = f"```{days} Days: {start_date} - {end_date}\n"

        # Add Goals Header
        goal_emojis: list[str] = [goal.goal_emoji for goal in user_goals]
        summary += "    " + " ".join(goal_emojis) + "\n```"

        # Add Day-by-Day Summary
        summary += look_back_summary(user_id, days, start)
        return summary


class RateSingleHandler(TextCommandHandler):
    """Handle 'rate' command for single goal."""

    PREFIX = "rate"

    def matches(self, message: str) -> bool:
        """Check if message starts with 'rate'."""
        return message.startswith(self.PREFIX)

    def handle(self, user: User, message: str) -> str | None:
        """Process single rating command."""
        user_id = user.id
        parse_rating: list[str] = message.replace(self.PREFIX, "").strip().split(" ")

        if len(parse_rating) != MIN_PARTS_EXPECTED:
            return messages.USAGE_RATE

        try:
            goal_num: int = int(parse_rating[0])
            rating_value: int = int(parse_rating[1])
        except ValueError:
            return messages.USAGE_RATE

        max_rating = 3
        if goal_num <= 0 or not (1 <= rating_value <= max_rating):
            return messages.USAGE_RATE

        user_goals: list[Goal] = db.goals.get_by_user(user_id)

        if not user_goals:
            return messages.ERROR_NO_GOALS_SET

        if goal_num > len(user_goals):
            return messages.USAGE_RATE

        goal: Goal = user_goals[goal_num - 1]

        today_str = datetime.now(tz=UTC).strftime("%Y-%m-%d")
        rating: Rating | None = db.ratings.get_by_goal_and_date(goal.id, today_str)

        if not rating:
            db.ratings.create(goal.id, rating_value)
        else:
            db.ratings.update(rating.id, user_goal_id=goal.id, rating=rating_value)

        today_display: str = datetime.now(tz=UTC).strftime("%a (%b %d)")
        status_symbol: str = STYLE[rating_value]

        return (
            messages.SUCCESS_INDIVIDUAL_RATING.replace("<today_display>", today_display)
            .replace("<goal_emoji>", goal.goal_emoji)
            .replace("<goal_description>", goal.goal_description)
            .replace("<status_symbol>", status_symbol)
        )


class RateAllHandler(TextCommandHandler):
    """Handle rating all goals at once."""

    def matches(self, message: str) -> bool:
        """Check if message consists of rating digits."""
        return message.isdigit() and all(m in "123" for m in message)

    def handle(self, user: User, message: str) -> str | None:
        """Process rate all command."""
        user_id = user.id
        user_goals: list[Goal] = db.goals.get_by_user(user_id)
        if not user_goals:
            return messages.ERROR_NO_GOALS_SET

        # Validate input length
        if len(message) != len(user_goals):
            return messages.ERROR_INVALID_INPUT_LENGTH.replace(
                "<num_goals>",
                str(len(user_goals)),
            )

        ratings: list[int] = [int(c) for c in message]

        today_str = datetime.now(tz=UTC).strftime("%Y-%m-%d")
        for i, goal in enumerate(user_goals):
            rating: Rating | None = db.ratings.get_by_goal_and_date(goal.id, today_str)
            if not rating:
                db.ratings.create(goal.id, ratings[i])
            else:
                db.ratings.update(rating.id, user_goal_id=goal.id, rating=ratings[i])

        today_display: str = datetime.now(tz=UTC).strftime("%a (%b %d)")
        goal_emojis: list[str] = [goal.goal_emoji for goal in user_goals]
        status: list[str] = [STYLE[r] for r in ratings]
        # Use the last goal description for the message (matches original logic,
        # though maybe unexpected if it refers to 'goal_description' singular)
        last_goal_desc = user_goals[-1].goal_description

        return (
            messages.SUCCESS_RATINGS_SUBMITTED.replace("<today_display>", today_display)
            .replace("<goal_emojis>", " ".join(goal_emojis))
            .replace("<goal_description>", last_goal_desc)
            .replace("<status>", " ".join(status))
        )


class HelpHandler(TextCommandHandler):
    """Return help message."""

    COMMAND = "help"

    def matches(self, message: str) -> bool:
        """Check if message is 'help'."""
        return message == self.COMMAND

    def handle(self, _user: User, _message: str) -> str | None:
        """Process help command."""
        return messages.HELP_MESSAGE


class ListHandler(TextCommandHandler):
    """Return interactive menu with list buttons."""

    COMMAND = "list"

    def matches(self, message: str) -> bool:
        """Check if message is 'list'."""
        return message == self.COMMAND

    def handle(self, user: User, _message: str) -> str | None:
        """Process list command by sending interactive list message."""
        # Create list sections with common commands
        sections = [
            ListSection(
                title="Goals",
                rows=[
                    ListRow(id="goals", title="Goals"),
                    ListRow(id="add goal", title="Add Goal"),
                    ListRow(id="enable journaling", title="Enable Journaling"),
                ],
            ),
            ListSection(
                title="Viewing",
                rows=[
                    ListRow(id="week", title="Week Summary"),
                    ListRow(id="lookback 7", title="Lookback 7 Days"),
                ],
            ),
            ListSection(
                title="More Commands",
                rows=[
                    ListRow(id="help", title="Full Help"),
                ],
            ),
        ]

        # Send list message
        send_whatsapp_list_message(
            number=user.phone_number,
            button_text="Commands",
            body="❓ *LogLife Commands*\n\nSelect a command from the list below:",
            sections=sections,
            options={"footer": "Tap a command to use it"},
        )

        # Return None since we've already sent the message
        return None


class MenuHandler(TextCommandHandler):
    """Return interactive menu with reply buttons."""

    COMMAND = "menu"

    def matches(self, message: str) -> bool:
        """Check if message is 'menu'."""
        return message == self.COMMAND

    def handle(self, user: User, _message: str) -> str | None:
        """Process menu command by sending interactive reply buttons."""
        # Create reply buttons
        buttons = [
            ReplyButton(id="checkin", title="Check in"),
            ReplyButton(id="goals", title="Goals"),
            ReplyButton(id="habits", title="Habits"),
        ]

        # Send button message
        send_whatsapp_reply_buttons(
            number=user.phone_number,
            text="❓ *LogLife Menu*\n\nSelect an option:",
            buttons=buttons,
        )

        # Return None since we've already sent the message
        return None


class CheckinHandler(TextCommandHandler):
    """Handle 'checkin' command - show check-in options."""

    COMMAND = "checkin"

    def matches(self, message: str) -> bool:
        """Check if message is 'checkin'."""
        return message == self.COMMAND

    def handle(self, user: User, _message: str) -> str | None:
        """Process checkin command - send reply buttons."""
        # Create reply buttons for check-in
        buttons = [
            ReplyButton(id="checkin now", title="Check in now!"),
            ReplyButton(id="edit time", title="Edit Time"),
        ]

        # Send button message
        send_whatsapp_reply_buttons(
            number=user.phone_number,
            text="*Check in*",
            buttons=buttons,
        )

        # Return None since we've already sent the message
        return None


class CallHandler(TextCommandHandler):
    """Handle 'call' command - send 4 URL button messages."""

    COMMAND = "call"

    def matches(self, message: str) -> bool:
        """Check if message is 'call'."""
        return message == self.COMMAND

    def handle(self, user: User, _message: str) -> str | None:
        """Process call command - send 4 CTA URL button messages.

        Args:
            user: The user record
            _message: The text message (unused)
        """
        logger.info("Call command requested for user %s", user.phone_number)

        # Normalize phone number by removing @c.us suffix if present
        phone_number_normalized = user.phone_number.replace("@c.us", "")

        # Generate token from normalized phone number
        token = generate_short_token(phone_number_normalized, SECRET_KEY)

        # Button configurations: (number, display_text, body)
        button_configs = [
            (1, "Check in", "*Check in*"),
            (2, "Goal Setup", "*Goal Setup*"),
            (3, "Temptation Support", "*Temptation Support*"),
            (4, "Onboarding", "*Onboarding*"),
        ]

        client_type = WHATSAPP_CLIENT_TYPE.lower()

        # For web client type, send all links in one message
        if client_type == "web":
            # Build a single message with all 4 links
            message_parts = []
            for number, _display_text, body in button_configs:
                url = f"{LOGLIFE_DOMAIN}/call/{number}/{token}"
                # Format each link with title and URL
                message_parts.append(f"{body}\n🔗 {url}")
            # Join all parts with double newline for spacing
            combined_message = "\n\n".join(message_parts)
            send_whatsapp_message(user.phone_number, combined_message)
        else:
            # For business_api, send CTA URL button messages
            for number, display_text, body in button_configs:
                url = f"{LOGLIFE_DOMAIN}/call/{number}/{token}"
                url_button = URLButton(
                    display_text=display_text,
                    url=url,
                )
                send_whatsapp_cta_url(
                    number=user.phone_number,
                    body=body,
                    button=url_button,
                )

        # Return None since we've already sent the messages
        return None


class CheckinNowHandler(TextCommandHandler):
    """Handle 'checkin now' command - initiate WhatsApp call."""

    COMMAND = "checkin now"

    def matches(self, message: str) -> bool:
        """Check if message is 'checkin now'."""
        return message == self.COMMAND

    def handle(self, user: User, _message: str) -> str | None:
        """Process checkin now command - send CTA URL button.

        Args:
            user: The user record
            _message: The text message (unused)
        """
        logger.info("Check-in call requested for user %s", user.phone_number)

        # Normalize phone number by removing @c.us suffix if present
        phone_number_normalized = user.phone_number.replace("@c.us", "")

        # Generate token from normalized phone number
        token = generate_short_token(phone_number_normalized, SECRET_KEY)

        client_type = WHATSAPP_CLIENT_TYPE.lower()

        # Create URL for check-in with token as path parameter
        url = f"{LOGLIFE_DOMAIN}/call/{token}"

        # For web client type, send plain text message with link
        if client_type == "web":
            # Format message with URL on its own line with proper spacing for detection
            message_with_url = f"*Check in*\n\n🔗 {url}"
            send_whatsapp_message(user.phone_number, message_with_url)
        else:
            # For business_api, send CTA URL button message
            url_button = URLButton(
                display_text="Call",
                url=url,
            )
            send_whatsapp_cta_url(
                number=user.phone_number,
                body="*Check in*",
                button=url_button,
            )

        # Return None since we've already sent the message
        return None


class EditTimeHandler(TextCommandHandler):
    """Handle 'edit time' command - echo for testing."""

    COMMAND = "edit time"

    def matches(self, message: str) -> bool:
        """Check if message is 'edit time'."""
        return message == self.COMMAND

    def handle(self, _user: User, _message: str) -> str | None:
        """Process edit time command - echo for testing."""
        return "Edit Time"


class HabitsHandler(TextCommandHandler):
    """Handle 'habits' command - show week summary."""

    COMMAND = "habits"

    def matches(self, message: str) -> bool:
        """Check if message is 'habits'."""
        return message == self.COMMAND

    def handle(self, user: User, _message: str) -> str | None:
        """Process habits command - delegate to WeekSummaryHandler."""
        week_handler = WeekSummaryHandler()
        return week_handler.handle(user, "week")
