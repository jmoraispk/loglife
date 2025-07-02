from datetime import datetime
from storage import load_user_data, save_user_data
from config import GOALS, STYLE

def process_message(message: str, sender: str) -> str:
    user_id = sender  # could be phone or group ID
    message = message.strip().lower()

    if message.startswith("bot: show week"):
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
    summary = f"Week {start.strftime('%W')}: {start.strftime('%b %d')} - {(start + timedelta(days=6)).strftime('%b %d')}\n  {' '.join(GOALS)}"

    for i in range(7):
        day = (start + timedelta(days=i)).strftime('%Y-%m-%d')
        ratings = data['entries'].get(day, None)
        if ratings:
            status = ' '.join(STYLE[r] for r in ratings)
        else:
            status = ' '.join(['🔲'] * len(GOALS))
        summary += f"\n{(start + timedelta(days=i)).strftime('%a')} {status}"
    return summary
