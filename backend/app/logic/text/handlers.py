"""Handlers for WhatsApp text commands using the Command Pattern."""

import json
import re
from abc import ABC, abstractmethod
from datetime import UTC, datetime, timedelta

from app.config import (
    DEFAULT_GOAL_EMOJI,
    STYLE,
)
from app.config.messages import (
    ERROR_ADD_GOAL_FIRST,
    ERROR_INVALID_DELETE_FORMAT,
    ERROR_INVALID_GOAL_NUMBER,
    ERROR_INVALID_INPUT_LENGTH,
    ERROR_INVALID_TIME_FORMAT,
    ERROR_INVALID_UPDATE_FORMAT,
    ERROR_NO_GOALS_SET,
    HELP_MESSAGE,
    JOURNAL_REMINDER_MESSAGE,
    SUCCESS_GOAL_ADDED,
    SUCCESS_GOAL_DELETED,
    SUCCESS_INDIVIDUAL_RATING,
    SUCCESS_JOURNALING_ENABLED,
    SUCCESS_RATINGS_SUBMITTED,
    SUCCESS_REMINDER_UPDATED,
    SUCCESS_TRANSCRIPT_DISABLED,
    SUCCESS_TRANSCRIPT_ENABLED,
    USAGE_RATE,
)
from app.db import (
    create_goal,
    create_goal_reminder,
    create_rating,
    create_user_state,
    delete_goal,
    delete_user_state,
    get_goal,
    get_goal_reminder_by_goal_id,
    get_rating_by_goal_and_date,
    get_user_goals,
    get_user_state,
    update_goal_reminder,
    update_rating,
    update_user,
)
from app.helpers import get_goals_not_tracked_today
from app.logic.text.reminder_time import parse_time_string
from app.logic.text.week import get_monday_before, look_back_summary

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
    def handle(self, user: dict, message: str) -> str | None:
        """Process the message and return a response."""
        ...


class AddGoalHandler(TextCommandHandler):
    """Handle 'add goal' command."""

    PREFIX = "add goal"

    def matches(self, message: str) -> bool:
        """Check if message contains 'add goal'."""
        return self.PREFIX in message

    def handle(self, user: dict, message: str) -> str | None:
        """Process 'add goal' command."""
        user_id = user["id"]
        raw_goal: str = message.replace(self.PREFIX, "")
        if raw_goal:
            goal_emoji: str = _extract_emoji(raw_goal)
            goal_description: str = raw_goal.replace(goal_emoji, "").strip()
            goal: dict | None = create_goal(user_id, goal_emoji, goal_description)
            if goal:
                create_user_state(
                    user_id,
                    state="awaiting_reminder_time",
                    temp_data=json.dumps({"goal_id": goal["id"]}),
                )
                return SUCCESS_GOAL_ADDED
        return None


class EnableJournalingHandler(TextCommandHandler):
    """Handle 'enable journaling' command."""

    COMMAND = "enable journaling"

    def matches(self, message: str) -> bool:
        """Check if message is 'enable journaling'."""
        return message == self.COMMAND

    def handle(self, user: dict, _message: str) -> str | None:
        """Process 'enable journaling' command."""
        user_id: int = user["id"]
        user_goals: list[dict] = get_user_goals(user_id)
        for goal in user_goals:
            if goal["goal_emoji"] == "📓" and "journaling" in goal["goal_description"]:
                return SUCCESS_JOURNALING_ENABLED

        # Delegate to AddGoalHandler
        add_handler = AddGoalHandler()
        return add_handler.handle(user, "add goal 📓 journaling")


class JournalPromptsHandler(TextCommandHandler):
    """Handle 'journal prompts' or 'journal now' commands."""

    def matches(self, message: str) -> bool:
        """Check if message contains journal prompts/now."""
        return "journal prompts" in message or "journal now" in message

    def handle(self, user: dict, _message: str) -> str | None:
        """Process journal prompts command."""
        user_id = user["id"]
        goals_not_tracked_today: list = get_goals_not_tracked_today(user_id)
        if goals_not_tracked_today:
            return JOURNAL_REMINDER_MESSAGE.replace(
                "<goals_not_tracked_today>",
                "- *Did you complete the goals?*\n"
                + "\n".join(
                    [
                        f"- {goal['goal_description']}"
                        for goal in goals_not_tracked_today
                    ]
                ),
            )

        return JOURNAL_REMINDER_MESSAGE.replace("\n\n<goals_not_tracked_today>", "")


class DeleteGoalHandler(TextCommandHandler):
    """Handle 'delete' command."""

    PREFIX = "delete"

    def matches(self, message: str) -> bool:
        """Check if message starts with 'delete'."""
        return message.startswith(self.PREFIX)

    def handle(self, user: dict, message: str) -> str | None:
        """Process delete command."""
        user_id = user["id"]
        try:
            goal_num: int = int(message.replace(self.PREFIX, "").strip())
        except ValueError:
            return ERROR_INVALID_DELETE_FORMAT

        if goal_num <= 0:
            return ERROR_INVALID_GOAL_NUMBER

        user_goals: list[dict] = get_user_goals(user_id)
        if not user_goals or goal_num > len(user_goals):
            return ERROR_INVALID_GOAL_NUMBER

        goal: dict = user_goals[goal_num - 1]

        delete_goal(goal["id"])

        return SUCCESS_GOAL_DELETED.format(
            goal_emoji=goal['goal_emoji'],
            goal_description=goal['goal_description']
        )


class ReminderTimeHandler(TextCommandHandler):
    """Handle time input for goal reminders."""

    def matches(self, message: str) -> bool:
        """Check if message is a valid time string."""
        return parse_time_string(message) is not None

    def handle(self, user: dict, message: str) -> str | None:
        """Process time input."""
        user_id = user["id"]
        normalized_time: str = parse_time_string(message)
        # Note: We call parse_time_string again here. Ideally we'd cache it,
        # but for stateless handlers this is cleaner than shared state.

        user_state: dict | None = get_user_state(user_id)
        if not user_state or user_state["state"] != "awaiting_reminder_time":
            return ERROR_ADD_GOAL_FIRST

        temp = json.loads(user_state.get("temp_data") or "{}")
        goal_id = temp.get("goal_id")

        create_goal_reminder(
            user_id=user_id,
            user_goal_id=goal_id,
            reminder_time=normalized_time,
        )
        delete_user_state(user_id)

        # Convert 24-hour format to 12-hour AM/PM format
        time_obj = datetime.strptime(normalized_time, "%H:%M:%S").time()  # noqa: DTZ007
        display_time = time_obj.strftime("%I:%M %p")

        # Get the goal to display in confirmation
        goal: dict = get_goal(goal_id)

        goal_desc = goal["goal_description"]
        goal_emoji = goal["goal_emoji"]
        return (
            f"Got it! I'll remind you daily at {display_time} for "
            f"{goal_emoji} {goal_desc}."
        )


class GoalsListHandler(TextCommandHandler):
    """Handle 'goals' command."""

    COMMAND = "goals"

    def matches(self, message: str) -> bool:
        """Check if message is 'goals'."""
        return message == self.COMMAND

    def handle(self, user: dict, _message: str) -> str | None:
        """Process goals list command."""
        user_id = user["id"]
        user_goals: list[dict] = get_user_goals(user_id)

        if not user_goals:
            return ERROR_NO_GOALS_SET

        # Format each goal with its description
        goal_lines: list[str] = []
        for i, goal in enumerate(user_goals, 1):
            # Get reminder for this goal
            reminder = get_goal_reminder_by_goal_id(goal["id"])
            time_display = ""
            if reminder:
                time_obj = datetime.strptime(  # noqa: DTZ007
                    reminder["reminder_time"], "%H:%M:%S"
                ).time()
                time_display = f" ⏰ {time_obj.strftime('%I:%M %p')}"
            goal_desc = goal["goal_description"]
            goal_emoji = goal["goal_emoji"]
            boost = goal["boost_level"]
            goal_lines.append(
                f"{i}. {goal_emoji} {goal_desc} (boost {boost}) {time_display}"
            )

        response = "```" + "\n".join(goal_lines) + "```"
        response += (
            "\n\n💡 _Tips:_\n"
            "_Update reminders with `update [goal#] [time]`_\n"
            "_Delete goals with `delete [goal#]`_"
        )
        return response


class UpdateReminderHandler(TextCommandHandler):
    """Handle 'update' command."""

    PREFIX = "update"

    def matches(self, message: str) -> bool:
        """Check if message starts with 'update'."""
        return message.startswith(self.PREFIX)

    def handle(self, user: dict, message: str) -> str | None:
        """Process update reminder command."""
        user_id = user["id"]
        parts = message.replace(self.PREFIX, "").strip().split(" ")
        if len(parts) != MIN_PARTS_EXPECTED:
            return ERROR_INVALID_UPDATE_FORMAT
        goal_num: int = int(parts[0])
        time_input: str = parts[1]

        # Validate and get normalized time
        normalized_time = parse_time_string(time_input)
        if not normalized_time:
            return ERROR_INVALID_TIME_FORMAT

        user_goals: list[dict] = get_user_goals(user_id)
        if not user_goals or goal_num > len(user_goals) or goal_num < 1:
            return ERROR_INVALID_GOAL_NUMBER

        goal: dict = user_goals[goal_num - 1]

        reminder: dict | None = get_goal_reminder_by_goal_id(goal["id"])

        # Create reminder if it doesn't exist, otherwise update it
        if reminder is None:
            create_goal_reminder(
                user_id=user_id,
                user_goal_id=goal["id"],
                reminder_time=normalized_time,
            )
        else:
            update_goal_reminder(reminder["id"], reminder_time=normalized_time)

        time_obj = datetime.strptime(normalized_time, "%H:%M:%S").time()  # noqa: DTZ007
        display_time = time_obj.strftime("%I:%M %p")

        goal_emoji = goal["goal_emoji"]
        goal_desc = goal["goal_description"]
        return SUCCESS_REMINDER_UPDATED.format(
            display_time=display_time,
            goal_emoji=goal_emoji,
            goal_desc=goal_desc
        )


class TranscriptToggleHandler(TextCommandHandler):
    """Handle 'transcript' command."""

    KEYWORD = "transcript"

    def matches(self, message: str) -> bool:
        """Check if message contains 'transcript'."""
        return self.KEYWORD in message

    def handle(self, user: dict, message: str) -> str | None:
        """Process transcript toggle command."""
        user_id = user["id"]
        if "on" in message:
            update_user(user_id, send_transcript_file=1)
            return SUCCESS_TRANSCRIPT_ENABLED
        if "off" in message:
            update_user(user_id, send_transcript_file=0)
            return SUCCESS_TRANSCRIPT_DISABLED
        return "Invalid command. Usage: transcript [on|off]"


class WeekSummaryHandler(TextCommandHandler):
    """Handle 'week' command."""

    COMMAND = "week"

    def matches(self, message: str) -> bool:
        """Check if message is 'week'."""
        return message == self.COMMAND

    def handle(self, user: dict, _message: str) -> str | None:
        """Process week summary command."""
        user_id = user["id"]
        start: datetime = get_monday_before()

        # Create Week Summary Header (E.g. Week 26: Jun 30 - Jul 06)
        week_num: str = start.strftime("%W")
        week_start: str = start.strftime("%b %d")
        week_end: str = (start + timedelta(days=6)).strftime("%b %d")
        if week_end.startswith(week_start[:3]):
            week_end = week_end[4:]

        summary: str = f"```Week {week_num}: {week_start} - {week_end}\n"

        # Add Goals Header
        user_goals: list[dict] = get_user_goals(user_id)
        if not user_goals:
            return ERROR_NO_GOALS_SET

        goal_emojis: list[str] = [goal["goal_emoji"] for goal in user_goals]
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

    def handle(self, user: dict, message: str) -> str | None:
        """Process lookback command."""
        user_id = user["id"]
        # Check if user has any goals first
        user_goals: list[dict] = get_user_goals(user_id)
        if not user_goals:
            return ERROR_NO_GOALS_SET

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
        goal_emojis: list[str] = [goal["goal_emoji"] for goal in user_goals]
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

    def handle(self, user: dict, message: str) -> str | None:
        """Process single rating command."""
        user_id = user["id"]
        parse_rating: list[str] = message.replace(self.PREFIX, "").strip().split(" ")
        if len(parse_rating) != MIN_PARTS_EXPECTED:
            return USAGE_RATE

        try:
            goal_num: int = int(parse_rating[0])
            rating_value: int = int(parse_rating[1])
        except ValueError:
            return USAGE_RATE

        if goal_num <= 0:
            return USAGE_RATE

        if not (1 <= rating_value <= 3):
            return USAGE_RATE

        user_goals: list[dict] = get_user_goals(user_id)

        if not user_goals:
            return ERROR_NO_GOALS_SET

        if not (goal_num <= len(user_goals)):
            return USAGE_RATE

        goal: dict = user_goals[goal_num - 1]

        today_str = datetime.now(tz=UTC).strftime("%Y-%m-%d")
        rating: dict | None = get_rating_by_goal_and_date(goal["id"], today_str)

        if not rating:
            create_rating(goal["id"], rating_value)
        else:
            update_rating(rating["id"], user_goal_id=goal["id"], rating=rating_value)

        today_display: str = datetime.now(tz=UTC).strftime("%a (%b %d)")
        status_symbol: str = STYLE[rating_value]

        return (
            SUCCESS_INDIVIDUAL_RATING.replace("<today_display>", today_display)
            .replace("<goal_emoji>", goal["goal_emoji"])
            .replace("<goal_description>", goal["goal_description"])
            .replace("<status_symbol>", status_symbol)
        )


class RateAllHandler(TextCommandHandler):
    """Handle rating all goals at once."""

    def matches(self, message: str) -> bool:
        """Check if message consists of rating digits."""
        return message.isdigit() and all(m in "123" for m in message)

    def handle(self, user: dict, message: str) -> str | None:
        """Process rate all command."""
        user_id = user["id"]
        user_goals: list[dict] = get_user_goals(user_id)
        if not user_goals:
            return ERROR_NO_GOALS_SET

        # Validate input length
        if len(message) != len(user_goals):
            return ERROR_INVALID_INPUT_LENGTH.replace(
                "<num_goals>",
                str(len(user_goals)),
            )

        ratings: list[int] = [int(c) for c in message]

        today_str = datetime.now(tz=UTC).strftime("%Y-%m-%d")
        for i, goal in enumerate(user_goals):
            rating: dict | None = get_rating_by_goal_and_date(goal["id"], today_str)
            if not rating:
                create_rating(goal["id"], ratings[i])
            else:
                update_rating(rating["id"], user_goal_id=goal["id"], rating=ratings[i])

        today_display: str = datetime.now(tz=UTC).strftime("%a (%b %d)")
        goal_emojis: list[str] = [goal["goal_emoji"] for goal in user_goals]
        status: list[str] = [STYLE[r] for r in ratings]

        return (
            SUCCESS_RATINGS_SUBMITTED.replace("<today_display>", today_display)
            .replace("<goal_emojis>", " ".join(goal_emojis))
            .replace("<goal_description>", goal["goal_description"])
            .replace("<status>", " ".join(status))
        )


class HelpHandler(TextCommandHandler):
    """Return help message."""

    COMMAND = "help"

    def matches(self, message: str) -> bool:
        """Check if message is 'help'."""
        return message == self.COMMAND

    def handle(self, _user: dict, _message: str) -> str | None:
        """Process help command."""
        return HELP_MESSAGE
