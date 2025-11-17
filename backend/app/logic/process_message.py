from app.config import ERROR_NO_GOALS_SET, HELP_MESSAGE, ERROR_INVALID_INPUT_LENGTH, SUCCESS_RATINGS_SUBMITTED, USAGE_RATE, SUCCESS_INDIVIDUAL_RATING, STYLE
from app.db import create_goal, get_user_goals, create_rating, get_rating_by_goal_and_date, update_rating
from app.helpers import extract_emoji, is_valid_rating_digits
from datetime import datetime

def process_message(user: dict, message: str) -> str:

    message: str = message.lower()

    user_id = user["id"]

    if 'add goal' in message:
        raw_goal = message.replace('add goal', '')
        if raw_goal:
            goal_emoji = extract_emoji(raw_goal)
            create_goal(user_id, goal_emoji, raw_goal.replace(goal_emoji, ''))
            return 'Goal Added successfully! When you would like to be reminded?'
        return 'Wrong command for adding goal!'
    
    if 'remove goal' in message:
        pass

    if message == 'goals':
        user_goals: list[dict] = get_user_goals(user_id)
        
        # Format each goal with its description
        goal_lines: list[str] = []
        for goal in user_goals:
            goal_lines.append(
                f"{goal['goal_emoji']} {goal['goal_description']} (boost {goal['boost_level']})"
            )
        
        return "```" + "\n".join(goal_lines) + "```"
    
    if message == "week":
        pass

    if message.startswith("lookback"):
        pass

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

        rating: dict | None = get_rating_by_goal_and_date(goal['id'], datetime.now().strftime('%Y-%m-%d'))

        if not rating:
            create_rating(goal['id'], rating_value)
        else:
            update_rating(rating["id"], user_goal_id=goal['id'], rating=rating_value)
        
        today_display: str = datetime.now().strftime('%a (%b %d)')  # For display

        status_symbol: str = STYLE[rating_value]
        
        return (SUCCESS_INDIVIDUAL_RATING
            .replace('<today_display>', today_display)
            .replace('<goal_emoji>', goal["goal_emoji"])
            .replace('<goal_description>', goal["goal_description"])
            .replace('<status_symbol>', status_symbol))


    # rate all goals at once
    if is_valid_rating_digits(message):
        user_goals: list[dict] = get_user_goals(user_id)
        if not user_goals:
            return ERROR_NO_GOALS_SET

        # Validate input length
        if len(message) != len(user_goals):
            return ERROR_INVALID_INPUT_LENGTH.replace('<num_goals>', str(len(user_goals)))
        
        ratings: list[int] = [int(c) for c in message] # convert message to list of ratings

        for i, goal in enumerate(user_goals):
            rating: dict | None = get_rating_by_goal_and_date(goal['id'], datetime.now().strftime('%Y-%m-%d'))
            if not rating:
                create_rating(goal['id'], ratings[i])
            else:
                update_rating(rating["id"], user_goal_id=goal['id'], rating=ratings[i])

        today_display: str = datetime.now().strftime('%a (%b %d)')  # For display
        goal_emojis: list[str] = [goal['goal_emoji'] for goal in user_goals]
        status: list[str] = [STYLE[r] for r in ratings]

        # Return success message
        return (SUCCESS_RATINGS_SUBMITTED
            .replace('<today_display>', today_display)
            .replace('<goal_emojis>', ' '.join(goal_emojis))
            .replace('<goal_description>', goal["goal_description"])
            .replace('<status>', ' '.join(status)))

    
    if message == 'help':
        return HELP_MESSAGE
    
    return "Wrong command!"