from datetime import datetime
from storage import load_user_data, save_user_data
from config import GOALS, STYLE


# TODO: if things break, return a better message to the user

def process_message(message: str, sender: str) -> str:
    user_id = sender  # could be phone or group ID
    message = message.strip().lower()

    if message.startswith("bot: week"):
        return format_week_summary(user_id)

    if message.startswith("bot:"):
        payload = message[4:].strip()
        if not all(c in "123" for c in payload) or len(payload) != len(GOALS):
            return f"❌ Invalid input. Please send {len(GOALS)} digits like: 31232"
        ratings = [int(c) for c in payload]
        today = datetime.now().strftime('%Y-%m-%d')
        data = load_user_data(user_id)
        data['goals'] = GOALS
        data['entries'][today] = ratings
        save_user_data(user_id, data)
        status = [STYLE[r] for r in ratings]
        return f"📅 {today}\n> {' '.join(GOALS)}\n> {' '.join(status)}"

    return "❌ Unrecognized message. Use 'bot: 31232' or 'bot: show week'"

def format_week_summary(user_id: str) -> str:
    from datetime import timedelta

    today = datetime.now()
    start = today - timedelta(days=today.weekday())  # Monday
    data = load_user_data(user_id)

    # Create Week Summary Header (E.g. Week 26: Jun 30 - Jul 06)    
    week_num = start.strftime('%W')
    week_start = start.strftime('%b %d')
    week_end = (start + timedelta(days=6)).strftime('%b %d')
    if week_end.startswith(week_start[:3]):
        week_end = week_end[4:]
    summary = f"```Week {week_num}: {week_start} - {week_end}\n"
    
    # Add Goals Header
    summary += '    ' + ' '.join(GOALS)

    # Add Day-by-Day Summary
    for i in range(7): # 7 days in a week
        day = (start + timedelta(days=i)).strftime('%Y-%m-%d')
        ratings = data['entries'].get(day, None)
        if ratings:
            status = ' '.join(STYLE[r] for r in ratings)
        else:
            status = ' '.join(['🔲'] * len(GOALS))
        summary += f"\n{(start + timedelta(days=i)).strftime('%a')} {status}"
    return summary + "```"

