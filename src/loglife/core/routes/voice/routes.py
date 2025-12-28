"""Voice turn endpoint for handling voice interactions.

Receives POST requests with user text and returns appropriate replies.
"""

import logging
import re

from flask import Blueprint, jsonify, request
from flask.typing import ResponseReturnValue
from itsdangerous import BadSignature, BadTimeSignature, SignatureExpired, URLSafeTimedSerializer

from loglife.app.config import SECRET_KEY
from loglife.app.db import db
from loglife.app.db.tables import Goal, User

voice_bp = Blueprint("voice", __name__)

logger = logging.getLogger(__name__)

# Optional API key for authentication
API_KEY = "my-super-secret-123"


def _decode_phone_number(external_user_id: str) -> tuple[str | None, str | None]:
    """Decode phone number from token or return as-is.

    Args:
        external_user_id: Token or phone number string

    Returns:
        Tuple of (phone_number, error_message). error_message is None on success.
    """
    try:
        s = URLSafeTimedSerializer(SECRET_KEY)
        phone_number = s.loads(external_user_id, max_age=300)  # 5 minutes
        logger.info("Decoded token to phone number: %s", phone_number)
    except SignatureExpired:
        logger.warning("Token expired for external_user_id: %s", external_user_id)
        return None, (
            "Your token is expired, you need select checkin in WhatsApp again. endCall=true"
        )
    except (BadSignature, BadTimeSignature) as e:
        # If decoding fails, assume external_user_id is already a phone number
        logger.debug("Token decode failed (may not be a token): %s", e)
        return external_user_id, None
    else:
        return phone_number, None


def _is_asking_about_habits(user_text: str) -> bool:
    """Check if user text is asking about habits/goals.

    Args:
        user_text: The user's text input

    Returns:
        True if asking about habits, False otherwise
    """
    user_text_lower = user_text.lower()
    return bool(
        re.search(
            r"\b(how many|how much|what are|list|show|tell me about)\s+(habits?|goals?)",
            user_text_lower,
        )
    )


def _format_habits_response(goals: list[Goal], *, is_asking: bool, user_text: str) -> str:
    """Format response about user's habits/goals.

    Args:
        goals: List of Goal objects
        is_asking: Whether user is specifically asking about habits
        user_text: Original user text

    Returns:
        Formatted reply text
    """
    num_habits = len(goals)

    if num_habits == 0:
        if is_asking:
            return (
                "You don't have any habits set yet. "
                "You can add habits through WhatsApp by typing 'goals' or 'add goal'."
            )
        return (
            f'Thanks. You said: "{user_text}". '
            "You don't have any habits set yet. "
            "You can add habits through WhatsApp."
        )

    # Format habits list
    habits_list = "\n".join(f"• {goal.goal_emoji} {goal.goal_description}" for goal in goals)

    if is_asking:
        habit_word = "habit" if num_habits == 1 else "habits"
        return f"You have {num_habits} {habit_word}:\n{habits_list}"

    return f'Thanks. You said: "{user_text}". Here are your current habits:\n{habits_list}'


def _handle_daily_checkin(user: User | None, user_text: str) -> str:
    """Handle daily checkin mode logic.

    Args:
        user: User object or None
        user_text: The user's text input

    Returns:
        Reply text for the user
    """
    if not user:
        return f'Thanks. You said: "{user_text}".'

    is_asking = _is_asking_about_habits(user_text)
    goals = db.goals.get_by_user(user.id)
    return _format_habits_response(goals, is_asking=is_asking, user_text=user_text)


@voice_bp.post("/voice-turn")
def voice_turn() -> ResponseReturnValue:
    """Handle voice turn requests.

    Returns:
        JSON response with reply_text.
    """
    try:
        # Optional: basic auth using your header
        if API_KEY:
            incoming = request.headers.get("x-api-key", "")
            if incoming != API_KEY:
                logger.warning("Unauthorized voice turn request: invalid API key")
                return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json(silent=True) or {}
        logger.info("Voice turn request JSON data: %s", data)

        mode = data.get("mode", "daily_checkin")
        external_user_id = data.get("external_user_id")
        user_text = (data.get("user_text") or "").strip()

        if not external_user_id or not user_text:
            logger.warning("Voice turn request missing external_user_id or user_text")
            return jsonify({"reply_text": "I didn't catch that. Can you repeat?"}), 200

        # Decode token from external_user_id if it's a token
        phone_number, error_msg = _decode_phone_number(external_user_id)
        if error_msg:
            return jsonify({"reply_text": error_msg}), 200

        logger.info(
            "Voice turn request: external_user_id=%s, phone_number=%s, mode=%s, user_text=%s",
            external_user_id,
            phone_number,
            mode,
            user_text,
        )

        # Get user from database using phone number
        # Try both formats: with and without @c.us suffix
        user = None
        if phone_number:
            user = db.users.get_by_phone(phone_number)
            # If not found and phone_number doesn't have @c.us, try with suffix
            if not user and "@c.us" not in phone_number:
                user = db.users.get_by_phone(f"{phone_number}@c.us")
            if not user:
                logger.warning("User not found for phone number: %s", phone_number)
                return jsonify(
                    {"reply_text": "I couldn't find your account. Please try again. endCall=true"}
                ), 200

        # Handle different modes
        if mode in ("daily_checkin", "goal_setup", "temptation_support", "onboarding"):
            reply = _handle_daily_checkin(user, user_text)
        else:
            reply = "Mode not supported yet. Please try again. endCall=true"

        logger.info("Voice turn response: reply_length=%d", len(reply))
        return jsonify({"reply_text": reply}), 200
    except Exception as e:
        error = f"Error processing voice turn > {e}"
        logger.exception(error)
        return jsonify({"error": "Internal server error"}), 500
