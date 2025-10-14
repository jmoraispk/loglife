from app.logic.helpers.format_goals import format_goals

def process_message(message: str, sender: str) -> str:
    user_id = sender  # could be phone or group ID
    message = message.strip().lower()

    if message.startswith("goals"):
        return format_goals(user_id)

    return "❌ Unrecognized message."