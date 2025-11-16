def parse_add_goal_command(message: str) -> str | None:
    parts = message.split(" ", 2)  # Split into max 3 parts
    if len(parts) >= 3:
        return parts[2]  # Everything after "add goal"
    return None