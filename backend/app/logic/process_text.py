"""Message processing logic for inbound WhatsApp text commands."""

import json
import re
from datetime import UTC, datetime, timedelta

from app.config import (
    COMMAND_ALIASES,
    DEFAULT_GOAL_EMOJI,
    ERROR_INVALID_INPUT_LENGTH,
    ERROR_NO_GOALS_SET,
    HELP_MESSAGE,
    JOURNAL_REMINDER_MESSAGE,
    STYLE,
    SUCCESS_INDIVIDUAL_RATING,
    SUCCESS_RATINGS_SUBMITTED,
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
from app.helpers import (
    get_goals_not_tracked_today,
    get_monday_before,
    look_back_summary,
    parse_time_string,
)

MIN_PARTS_EXPECTED = 2

# internal variable (not intended for import)
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


def _is_valid_rating(message: str) -> bool:
    """Check whether the message contains only valid rating digits."""
    return message.isdigit() and all(m in "123" for m in message)


def _add_goal(user_id: int, message: str) -> str:
    """Handle 'add goal' command."""
    raw_goal: str = message.replace("add goal", "")
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
            return "Goal Added successfully! When you would like to be reminded?"
    return None


def _enable_journaling(user: dict) -> str:
    """Handle 'enable journaling' command."""
    user_id: int = user["id"]
    # Check if user already has a journaling goal
    user_goals: list[dict] = get_user_goals(user_id)
    for goal in user_goals:
        if goal["goal_emoji"] == "📓" and "journaling" in goal["goal_description"]:
            return "✅ You already have a journaling goal! Check 'goals' to see it."

    return process_text(user, "add goal 📓 journaling")


def _journal_prompts(user_id: int) -> str:
    """Handle 'journal prompts' or 'journal now' commands."""
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


def _delete_goal(user_id: int, message: str) -> str:
    """Handle 'delete' command."""
    try:
        goal_num: int = int(message.replace("delete", "").strip())
    except ValueError:
        return "Invalid format. Usage: delete [goal number]\nExample: delete 1"

    user_goals: list[dict] = get_user_goals(user_id)
    if not user_goals or goal_num > len(user_goals) or goal_num < 1:
        return "Invalid goal number. Type 'goals' to see your goals."

    goal: dict = user_goals[goal_num - 1]

    delete_goal(goal["id"])

    return f"✅ Goal deleted: {goal['goal_emoji']} {goal['goal_description']}"


def _reminder_time(user_id: int, message: str) -> str:
    """Handle time input for goal reminders."""
    normalized_time: str = parse_time_string(message)
    user_state: dict | None = get_user_state(user_id)
    if not user_state or user_state["state"] != "awaiting_reminder_time":
        return "Please add a goal first."

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


def _goals_list(user_id: int) -> str:
    """Handle 'goals' command."""
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


def _update_reminder(user_id: int, message: str) -> str:
    """Handle 'update' command."""
    parts = message.replace("update", "").strip().split(" ")
    if len(parts) != MIN_PARTS_EXPECTED:
        return "Usage: update [goal number] [time]\nExample: update 1 8pm"
    goal_num: int = int(parts[0])
    time_input: str = parts[1]

    # Validate and get normalized time
    normalized_time = parse_time_string(time_input)
    if not normalized_time:
        return "Invalid time format. Try: 8pm, 9:30am, 20:00"

    user_goals: list[dict] = get_user_goals(user_id)
    if not user_goals or goal_num > len(user_goals) or goal_num < 1:
        return "Invalid goal number. Type 'goals' to see your goals."

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
    return (
        f"✅ Reminder updated! I'll remind you at {display_time} for "
        f"{goal_emoji} {goal_desc}"
    )


def _transcript_toggle(user_id: int, message: str) -> str:
    """Handle 'transcript' command."""
    if "on" in message:
        update_user(user_id, send_transcript_file=1)
        return (
            "✅ Transcript files enabled! You'll now receive transcript "
            "file with your audio journaling."
        )
    if "off" in message:
        update_user(user_id, send_transcript_file=0)
        return (
            "✅ Transcript files disabled! You'll only receive the summary "
            "message with your audio journaling."
        )
    return "Invalid command. Usage: transcript [on|off]"


def _week_summary(user_id: int) -> str:
    """Handle 'week' command."""
    start: datetime = get_monday_before()

    # Create Week Summary Header (E.g. Week 26: Jun 30 - Jul 06)
    week_num: str = start.strftime("%W")
    week_start: str = start.strftime("%b %d")
    week_end: str = (start + timedelta(days=6)).strftime("%b %d")
    if week_end.startswith(week_start[:3]):
        week_end = week_end[4:]

    summary: str = f"```Week {week_num}: {week_start} - {week_end}\n"

    # Add Goals Header - we'll need to get user goals dynamically
    user_goals: list[dict] = get_user_goals(user_id)
    if not user_goals:
        return ERROR_NO_GOALS_SET

    goal_emojis: list[str] = [goal["goal_emoji"] for goal in user_goals]
    summary += "    " + " ".join(goal_emojis) + "\n```"

    # Add Day-by-Day Summary
    summary += look_back_summary(user_id, 7, start)
    return summary


def _lookback(user_id: int, message: str) -> str:
    """Handle 'lookback' command."""
    # Check if user has any goals first
    user_goals: list[dict] = get_user_goals(user_id)
    if not user_goals:
        return ERROR_NO_GOALS_SET

    # Extract number of days from message (e.g., "lookback 5" or "lookback")
    parts: list[str] = message.split()
    if len(parts) == MIN_PARTS_EXPECTED and parts[1].isdigit():
        days: int = int(parts[1])
    else:
        days = 7  # Default to 7 days
    start = datetime.now(tz=UTC) - timedelta(days=days - 1)  # Include today
    end = datetime.now(tz=UTC)

    # Create date range header similar to week command
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


def _rate_single(user_id: int, message: str) -> str:
    """Handle 'rate' command for single goal."""
    parse_rating: list[str] = message.replace("rate", "").strip().split(" ")
    if len(parse_rating) != MIN_PARTS_EXPECTED:
        return USAGE_RATE

    goal_num: int = int(parse_rating[0])
    if goal_num <= 0:
        return USAGE_RATE
    rating_value: int = int(parse_rating[1])

    user_goals: list[dict] = get_user_goals(user_id)

    # Check if user has any goals first
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

    today_display: str = datetime.now(tz=UTC).strftime("%a (%b %d)")  # For display

    status_symbol: str = STYLE[rating_value]

    return (
        SUCCESS_INDIVIDUAL_RATING.replace("<today_display>", today_display)
        .replace("<goal_emoji>", goal["goal_emoji"])
        .replace("<goal_description>", goal["goal_description"])
        .replace("<status_symbol>", status_symbol)
    )


def _rate_all(user_id: int, message: str) -> str:
    """Handle rating all goals at once with a string of digits."""
    user_goals: list[dict] = get_user_goals(user_id)
    if not user_goals:
        return ERROR_NO_GOALS_SET

    # Validate input length
    if len(message) != len(user_goals):
        return ERROR_INVALID_INPUT_LENGTH.replace(
            "<num_goals>",
            str(len(user_goals)),
        )

    ratings: list[int] = [int(c) for c in message]  # convert message to list of ratings

    today_str = datetime.now(tz=UTC).strftime("%Y-%m-%d")
    for i, goal in enumerate(user_goals):
        rating: dict | None = get_rating_by_goal_and_date(goal["id"], today_str)
        if not rating:
            create_rating(goal["id"], ratings[i])
        else:
            update_rating(rating["id"], user_goal_id=goal["id"], rating=ratings[i])

    today_display: str = datetime.now(tz=UTC).strftime("%a (%b %d)")  # For display
    goal_emojis: list[str] = [goal["goal_emoji"] for goal in user_goals]
    status: list[str] = [STYLE[r] for r in ratings]

    # Return success message
    return (
        SUCCESS_RATINGS_SUBMITTED.replace("<today_display>", today_display)
        .replace("<goal_emojis>", " ".join(goal_emojis))
        .replace("<goal_description>", goal["goal_description"])
        .replace("<status>", " ".join(status))
    )


def process_text(user: dict, message: str) -> str:
    """Route incoming text commands to the appropriate goal or rating handler.

    Handle commands such as adding goals, submitting ratings, configuring
    reminder times, and generating look-back summaries. Maintain temporary
    state for multi-step flows (e.g., goal reminder setup).

    Args:
        user: The user record dict for the message sender
        message: The incoming text message content

    Returns:
        The WhatsApp response text to send back to the user.

    """
    message: str = message.strip().lower()

    # Replace aliases
    for alias, command in COMMAND_ALIASES.items():
        message = message.replace(alias, command)

    user_id: int = user["id"]

    # Command routing table - order matters for some checks
    # Each tuple: (condition_check, handler_function)
    command_routes = [
        ("add goal" in message, lambda: _add_goal(user_id, message)),
        (message == "enable journaling", lambda: _enable_journaling(user)),
        (message == "journal prompts", lambda: _journal_prompts(user_id)),
        (message.startswith("delete"), lambda: _delete_goal(user_id, message)),
        (parse_time_string(message) is not None, lambda: _reminder_time(user_id, message)),
        (message == "goals", lambda: _goals_list(user_id)),
        (message.startswith("update"), lambda: _update_reminder(user_id, message)),
        ("transcript" in message, lambda: _transcript_toggle(user_id, message)),
        (message == "week", lambda: _week_summary(user_id)),
        (message.startswith("lookback"), lambda: _lookback(user_id, message)),
        (message.startswith("rate"), lambda: _rate_single(user_id, message)),
        (_is_valid_rating(message), lambda: _rate_all(user_id, message)),
        (message == "help", lambda: HELP_MESSAGE),
    ]

    # Execute the first matching command handler
    for condition, handler in command_routes:
        if condition:
            result = handler()
            # Special case: add_goal can return None if no goal text provided
            if result is not None:
                return result

    return "Wrong command!"
