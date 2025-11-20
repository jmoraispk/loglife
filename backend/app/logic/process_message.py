"""Message processing logic for inbound WhatsApp text commands."""

from app.config import (
    ERROR_NO_GOALS_SET,
    HELP_MESSAGE,
    ERROR_INVALID_INPUT_LENGTH,
    SUCCESS_RATINGS_SUBMITTED,
    USAGE_RATE,
    SUCCESS_INDIVIDUAL_RATING,
    STYLE,
)
from app.db import (
    create_goal,
    get_user_goals,
    create_rating,
    get_rating_by_goal_and_date,
    update_rating,
    create_user_state,
    get_user_state,
    create_goal_reminder,
    delete_user_state,
)
from app.helpers import (
    extract_emoji,
    is_valid_rating_digits,
    get_monday_before,
    look_back_summary,
    is_valid_time_string,
    parse_time_string,
)
from datetime import datetime, timedelta
import json


def process_message(user: dict, message: str) -> str:
    """Routes incoming text commands to the appropriate goal or rating handler.

    Handles commands such as adding goals, submitting ratings, configuring
    reminder times, and generating look-back summaries. Maintains temporary
    state for multi-step flows (e.g., goal reminder setup).

    Arguments:
    user -- The user record dict for the message sender
    message -- The incoming text message content

    Returns the WhatsApp response text to send back to the user.
    """
    message: str = message.lower()

    user_id: int = user["id"]

    if "add goal" in message:
        raw_goal: str = message.replace("add goal", "")
        if raw_goal:
            goal_emoji: str = extract_emoji(raw_goal)
            goal_description: str = raw_goal.replace(goal_emoji, "")
            goal: dict | None = create_goal(user_id, goal_emoji, goal_description)
            if goal:
                create_user_state(
                    user_id,
                    state="awaiting_reminder_time",
                    temp_data=json.dumps({"goal_id": goal["id"]}),
                )
                return "Goal Added successfully! When you would like to be reminded?"

    if is_valid_time_string(message):
        normalized_time: str | None = parse_time_string(message)
        if normalized_time is not None:
            user_state: dict | None = get_user_state(user_id)
            if not user_state or user_state["state"] != "awaiting_reminder_time":
                return "Please add a goal first."

            temp = json.loads(user_state.get("temp_data") or "{}")
            goal_id = temp.get("goal_id")

            create_goal_reminder(
                user_id=user_id, user_goal_id=goal_id, reminder_time=normalized_time
            )
            delete_user_state(user_id)
            return f"Got it! I'll remind you daily at {normalized_time[:-3]}."

    if "remove goal" in message:
        pass

    if message == "goals":
        user_goals: list[dict] = get_user_goals(user_id)

        # Format each goal with its description
        goal_lines: list[str] = []
        for goal in user_goals:
            goal_lines.append(
                f"{goal['goal_emoji']} {goal['goal_description']} (boost {goal['boost_level']})"
            )

        return "```" + "\n".join(goal_lines) + "```"

    if message == "week":
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
        goal_emojis: list[str] = [goal["goal_emoji"] for goal in user_goals]
        summary += "    " + " ".join(goal_emojis) + "\n```"

        # Add Day-by-Day Summary
        summary += look_back_summary(user_id, 7, start)
        return summary

    if message.startswith("lookback"):
        # Extract number of days from message (e.g., "lookback 5" or "lookback")
        parts: list[str] = message.split()
        if len(parts) == 2 and parts[1].isdigit():
            days: int = int(parts[1])
        else:
            days = 7  # Default to 7 days
        start = datetime.now() - timedelta(days=days - 1)  # Include today
        return look_back_summary(user_id, days, start)

    # rate a single goal
    if message.startswith("rate"):
        parse_rating: list[str] = message.replace("rate", "").strip().split(" ")
        if len(parse_rating) != 2:
            return USAGE_RATE

        goal_num: int = int(parse_rating[0])
        if goal_num <= 0:
            return USAGE_RATE
        rating_value: int = int(parse_rating[1])

        user_goals: list[dict] = get_user_goals(user_id)

        if not (goal_num <= len(user_goals)):
            return USAGE_RATE

        goal: dict = user_goals[goal_num - 1]

        rating: dict | None = get_rating_by_goal_and_date(
            goal["id"], datetime.now().strftime("%Y-%m-%d")
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
    if is_valid_rating_digits(message):
        user_goals: list[dict] = get_user_goals(user_id)
        if not user_goals:
            return ERROR_NO_GOALS_SET

        # Validate input length
        if len(message) != len(user_goals):
            return ERROR_INVALID_INPUT_LENGTH.replace(
                "<num_goals>", str(len(user_goals))
            )

        ratings: list[int] = [
            int(c) for c in message
        ]  # convert message to list of ratings

        for i, goal in enumerate(user_goals):
            rating: dict | None = get_rating_by_goal_and_date(
                goal["id"], datetime.now().strftime("%Y-%m-%d")
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

    if message == "help":
        return HELP_MESSAGE

    return "Wrong command!"
