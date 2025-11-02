"""Application configuration constants.

This module defines global configuration constants for goals, descriptions,
and rating styles used throughout the application.
"""
from typing import Dict, List

# Define the goals and style (✅ or 🟩)

GOALS: List[str] = ["😴", "🥗", "🏃"]#, "📵", "🙏"]

GOAL_DESCRIPTIONS: Dict[str, str] = {
    "😴": "Bedroom by 9:30pm",
    "🥗": "No added sugar",
    "🏃": "Exercise"
}

STYLE: Dict[int, str] = {
    1: "❌",  # Failure
    2: "⚠️",  # Partial
    3: "✅"   # Success
}

# Alternate style (for future config toggle)
COLORS: Dict[int, str] = {
    0: "🟥",  # Failure
    1: "🟧",  # Partial
    2: "🟩",  # Success
    3: "🎉"   # Perfect
}
