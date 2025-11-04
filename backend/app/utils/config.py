"""Application configuration constants.

This module defines global configuration constants for goals, descriptions,
and rating styles used throughout the application.
"""

# Define the goals and style (✅ or 🟩)

GOALS: list[str] = ["😴", "🥗", "🏃"]#, "📵", "🙏"]

GOAL_DESCRIPTIONS: dict[str, str] = {
    "😴": "Bedroom by 9:30pm",
    "🥗": "No added sugar",
    "🏃": "Exercise"
}

STYLE: dict[int, str] = {
    1: "❌",  # Failure
    2: "⚠️",  # Partial
    3: "✅"   # Success
}

# Alternate style (for future config toggle)
COLORS: dict[int, str] = {
    0: "🟥",  # Failure
    1: "🟧",  # Partial
    2: "🟩",  # Success
    3: "🎉"   # Perfect
}
