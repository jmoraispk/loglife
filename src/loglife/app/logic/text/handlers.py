"""Handlers for WhatsApp text commands using the Command Pattern."""

import json
import re
from abc import ABC, abstractmethod
from datetime import UTC, datetime, timedelta

from loglife.app.config import (
    DEFAULT_GOAL_EMOJI,
    STYLE,
    messages,
)
from loglife.app.db import db
from loglife.app.db.tables import Goal, Rating, User
from loglife.app.logic.text.reminder_time import parse_time_string
from loglife.app.logic.text.week import get_monday_before, look_back_summary
from loglife.app.services.reminder.utils import get_goals_not_tracked_today

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
                "- *Did you complete the goals?*\n"
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
            goal_emoji=goal.goal_emoji, goal_description=goal.goal_description,
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
            return "Goal not found."

        goal_desc = goal.goal_description
        goal_emoji = goal.goal_emoji
        return f"Got it! I'll remind you daily at {display_time} for {goal_emoji} {goal_desc}."


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
            display_time=display_time, goal_emoji=goal_emoji, goal_desc=goal_desc,
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
        return "Invalid command. Usage: transcript [on|off]"


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
