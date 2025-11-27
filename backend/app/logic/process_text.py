"""Message processing logic for inbound WhatsApp text commands."""

import json
from datetime import datetime, timedelta

from app.config import (
    COMMAND_ALIASES,
    ERROR_INVALID_INPUT_LENGTH,
    ERROR_NO_GOALS_SET,
    HELP_MESSAGE,
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
    extract_emoji,
    get_monday_before,
    is_valid_rating_digits,
    look_back_summary,
    parse_time_string,
)


def process_text(user: dict, message: str) -> str:
    """Routes incoming text commands to the appropriate goal or rating handler.

    Handles commands such as adding goals, submitting ratings, configuring
    reminder times, and generating look-back summaries. Maintains temporary
    state for multi-step flows (e.g., goal reminder setup).

    Arguments:
    user -- The user record dict for the message sender
    message -- The incoming text message content

    Returns the WhatsApp response text to send back to the user.

    """
    message: str = message.strip().lower()

    # Add aliases
    for alias, command in COMMAND_ALIASES.items():
        message = message.replace(alias, command)

    user_id: int = user["id"]

    if "add goal" in message:
        raw_goal: str = message.replace("add goal", "")
        if raw_goal:
            goal_emoji: str = extract_emoji(raw_goal)
            goal_description: str = raw_goal.replace(goal_emoji, "").strip()
            goal: dict | None = create_goal(user_id, goal_emoji, goal_description)
            if goal:
                create_user_state(
                    user_id,
                    state="awaiting_reminder_time",
                    temp_data=json.dumps({"goal_id": goal["id"]}),
                )
                return "Goal Added successfully! When you would like to be reminded?"

    elif message == "enable journaling":
        # Check if user already has a journaling goal
        user_goals: list[dict] = get_user_goals(user_id)
        for goal in user_goals:
            if goal["goal_emoji"] == "📓" and "journaling" in goal["goal_description"]:
                return "✅ You already have a journaling goal! Check 'goals' to see it."

        return process_text(user, "add goal 📓 journaling")

    elif message.startswith("delete"):
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

    elif parse_time_string(message) is not None:
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
        time_obj = datetime.strptime(normalized_time, "%H:%M:%S")
        display_time = time_obj.strftime("%I:%M %p")

        # Get the goal to display in confirmation
        goal: dict = get_goal(goal_id)

        return f"Got it! I'll remind you daily at {display_time} for {goal['goal_emoji']} {goal['goal_description']}."

    elif message == "goals":
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
                time_obj = datetime.strptime(reminder["reminder_time"], "%H:%M:%S")
                time_display = f" ⏰ {time_obj.strftime('%I:%M %p')}"
            goal_lines.append(
                f"{i}. {goal['goal_emoji']} {goal['goal_description']} (boost {goal['boost_level']}) {time_display}",
            )

        response = "```" + "\n".join(goal_lines) + "```"
        response += "\n\n💡 _Tips:_\n_Update reminders with `update [goal#] [time]`_\n_Delete goals with `delete [goal#]`_"
        return response

    elif message.startswith("update"):
        parts = message.replace("update", "").strip().split(" ")
        if len(parts) != 2:
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

        time_obj = datetime.strptime(normalized_time, "%H:%M:%S")
        display_time = time_obj.strftime("%I:%M %p")

        return f"✅ Reminder updated! I'll remind you at {display_time} for {goal['goal_emoji']} {goal['goal_description']}"

    elif "transcript" in message:
        if "on" in message:
            update_user(user_id, send_transcript_file=1)
            return "✅ Transcript files enabled! You'll now receive transcript file with your audio journaling."
        if "off" in message:
            update_user(user_id, send_transcript_file=0)
            return "✅ Transcript files disabled! You'll only receive the summary message with your audio journaling."
        return "Invalid command. Usage: transcript [on|off]"

    elif message == "week":
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

    elif message.startswith("lookback"):
        # Check if user has any goals first
        user_goals: list[dict] = get_user_goals(user_id)
        if not user_goals:
            return ERROR_NO_GOALS_SET

        # Extract number of days from message (e.g., "lookback 5" or "lookback")
        parts: list[str] = message.split()
        if len(parts) == 2 and parts[1].isdigit():
            days: int = int(parts[1])
        else:
            days = 7  # Default to 7 days
        start = datetime.now() - timedelta(days=days - 1)  # Include today
        end = datetime.now()

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

    # rate a single goal
    elif message.startswith("rate"):
        parse_rating: list[str] = message.replace("rate", "").strip().split(" ")
        if len(parse_rating) != 2:
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

        rating: dict | None = get_rating_by_goal_and_date(
            goal["id"],
            datetime.now().strftime("%Y-%m-%d"),
        )

        if not rating:
            create_rating(goal["id"], rating_value)
        else:
            update_rating(rating["id"], user_goal_id=goal["id"], rating=rating_value)

        today_display: str = datetime.now().strftime("%a (%b %d)")  # For display

        status_symbol: str = STYLE[rating_value]

        return (
            SUCCESS_INDIVIDUAL_RATING.replace("<today_display>", today_display)
            .replace("<goal_emoji>", goal["goal_emoji"])
            .replace("<goal_description>", goal["goal_description"])
            .replace("<status_symbol>", status_symbol)
        )

    # rate all goals at once
    elif is_valid_rating_digits(message):
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

        for i, goal in enumerate(user_goals):
            rating: dict | None = get_rating_by_goal_and_date(
                goal["id"],
                datetime.now().strftime("%Y-%m-%d"),
            )
            if not rating:
                create_rating(goal["id"], ratings[i])
            else:
                update_rating(rating["id"], user_goal_id=goal["id"], rating=ratings[i])

        today_display: str = datetime.now().strftime("%a (%b %d)")  # For display
        goal_emojis: list[str] = [goal["goal_emoji"] for goal in user_goals]
        status: list[str] = [STYLE[r] for r in ratings]

        # Return success message
        return (
            SUCCESS_RATINGS_SUBMITTED.replace("<today_display>", today_display)
            .replace("<goal_emojis>", " ".join(goal_emojis))
            .replace("<goal_description>", goal["goal_description"])
            .replace("<status>", " ".join(status))
        )

    elif message == "help":
        return HELP_MESSAGE

    return "Wrong command!"
