from app.config import HELP_MESSAGE
from app.db import create_goal
from app.helpers import extract_emoji

def process_message(sender: str, message: str) -> str:

    if 'add goal' in message:
        raw_goal = message.replace('add goal', '')
        if raw_goal:
            goal_emoji = extract_emoji(raw_goal)
            create_goal(sender, goal_emoji, raw_goal.replace(goal_emoji, ''))
            return 'Goal Added successfully! When you would like to be reminded?'
        return 'Wrong command for adding goal!'
    
    if 'help' in message:
        return HELP_MESSAGE