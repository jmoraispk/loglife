"""Application settings and configuration constants."""

FLASK_ENV = "development"  # development or production

OPENAI_CHAT_MODEL = "gpt-5.1"

OPENAI_SUMMARIZATION_SYSTEM_PROMPT = (
    "You are a compassionate journal summarization assistant. "
    "Your task is to create concise, meaningful summaries of users' audio "
    "journal entries. Focus on key events, emotions, achievements, challenges, "
    "and any goals or action items mentioned. Keep the summary in first person "
    "perspective, maintain a supportive tone, and highlight important insights. "
    "Aim for 2-4 sentences that capture the essence of the entry."
)

DEFAULT_GOAL_EMOJI = "🎯"

STYLE = {
    1: "❌",  # Failure
    2: "⚠️",  # Partial
    3: "✅",  # Success
}

COMMAND_ALIASES = {
    "journal now": "journal prompts",
}
