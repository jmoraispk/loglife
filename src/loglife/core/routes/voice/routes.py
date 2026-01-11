"""Voice turn endpoint for handling voice interactions.

Receives POST requests with user text and returns appropriate replies.
"""

import logging
import re

from flask import Blueprint, current_app, jsonify, request
from flask.typing import ResponseReturnValue

from loglife.app.db import db
from loglife.app.db.tables import Goal, User
from loglife.app.logic.text import process_text
from loglife.core.messaging import Message
from loglife.core.routes.webhook.routes import webhook
from loglife.core.tokens import get_phone_from_token

voice_bp = Blueprint("voice", __name__)

logger = logging.getLogger(__name__)

# Optional API key for authentication
API_KEY = "my-super-secret-123"


def _extract_phone_number(external_user_id: str) -> tuple[str | None, str | None]:
    """Extract phone number from external_user_id (token or phone number).

    Since HMAC tokens cannot be decoded directly, we use a cache to map tokens
    to phone numbers. If external_user_id is a token, we look it up in the cache.
    Otherwise, we treat it as a phone number.

    Args:
        external_user_id: Token or phone number string

    Returns:
        Tuple of (phone_number, error_message). error_message is None on success.
    """
    # Try to get phone number from token cache (for HMAC tokens)
    phone_from_cache = get_phone_from_token(external_user_id)
    if phone_from_cache:
        logger.info("Decoded token to phone number: %s", phone_from_cache)
        return phone_from_cache, None

    # If not found in cache, check if it looks like a phone number (contains digits)
    if any(c.isdigit() for c in external_user_id):
        logger.info("Using external_user_id as phone number: %s", external_user_id)
        return external_user_id, None

    # If it doesn't look like a phone number and not in cache, token might be expired
    logger.warning("Token not found in cache or expired: %s", external_user_id)
    return None, ("Your token is expired, you need select checkin in WhatsApp again. endCall=true")


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


def _validate_api_key() -> ResponseReturnValue | None:
    """Validate API key from request headers.

    Returns:
        Error response if invalid, None if valid
    """
    if API_KEY:
        incoming = request.headers.get("x-api-key", "")
        if incoming != API_KEY:
            logger.warning("Unauthorized voice turn request: invalid API key")
            return jsonify({"error": "Unauthorized"}), 401
    return None


def _get_user_by_phone(phone_number: str | None) -> User | None:
    """Get user by phone number with fallback to @c.us suffix.

    Args:
        phone_number: Phone number to look up

    Returns:
        User object if found, None otherwise
    """
    if not phone_number:
        return None

    user = db.users.get_by_phone(phone_number)
    # If not found and phone_number doesn't have @c.us, try with suffix
    if not user and "@c.us" not in phone_number:
        user = db.users.get_by_phone(f"{phone_number}@c.us")
    return user


def _process_webhook(custom_payload: dict) -> None:
    """Process webhook to queue/send message to WhatsApp.

    Args:
        custom_payload: Payload to send to webhook
    """
    with current_app.test_request_context("/webhook", method="POST", json=custom_payload):
        webhook_response = webhook()
        # webhook_response is a tuple of (Response, status_code)
        response_obj, _ = webhook_response

        # Extract JSON data from response
        response_data = response_obj.get_json()

        # Check if webhook processing succeeded
        if not response_data or not response_data.get("success"):
            error_msg = (
                response_data.get("message", "Error processing message")
                if response_data
                else "Error processing message"
            )
            logger.warning("Webhook returned error: %s", error_msg)


@voice_bp.post("/voice-turn")
def voice_turn() -> ResponseReturnValue:
    """Handle voice turn requests.

    Returns:
        JSON response with reply_text.
    """
    try:
        # Optional: basic auth using your header
        auth_error = _validate_api_key()
        if auth_error:
            return auth_error

        data = request.get_json(silent=True) or {}
        logger.info("Voice turn request JSON data: %s", data)

        external_user_id = data.get("external_user_id")
        user_text = (data.get("user_text") or "").strip()

        if not external_user_id or not user_text:
            logger.warning("Voice turn request missing external_user_id or user_text")
            return jsonify({"reply_text": "I didn't catch that. Can you repeat?"}), 200

        # Extract phone number from external_user_id
        phone_number, error_msg = _extract_phone_number(external_user_id)
        if error_msg:
            return jsonify({"reply_text": error_msg}), 200

        logger.info(
            "Voice turn request: external_user_id=%s, phone_number=%s, user_text=%s",
            external_user_id,
            phone_number,
            user_text,
        )

        # Get user from database using phone number
        user = _get_user_by_phone(phone_number)
        if not user:
            logger.warning("User not found for phone number: %s", phone_number)
            return jsonify(
                {"reply_text": "I couldn't find your account. Please try again. endCall=true"}
            ), 200

        # Create custom payload for webhook
        custom_payload = {
            "sender": phone_number,
            "raw_msg": user_text,
            "msg_type": "chat",
            "client_type": "whatsapp",
        }

        # Process message synchronously to get the reply text
        message = Message.from_payload(custom_payload)
        reply_text = process_text(user, message)

        # If process_text returns None, it means the handler sent the message directly
        # In that case, use a default message
        if reply_text is None:
            reply_text = "Message processed successfully."

        # Still call webhook to queue/send the message to WhatsApp
        _process_webhook(custom_payload)

        logger.info("Voice turn response: reply_length=%d", len(reply_text))
        return jsonify({"reply_text": reply_text}), 200
    except Exception as e:
        error = f"Error processing voice turn > {e}"
        logger.exception(error)
        return jsonify({"error": "Internal server error"}), 500


def _format_habits_for_prompt(goals: list[Goal]) -> str:
    """Format user habits/goals for prepending to system prompt.

    Args:
        goals: List of Goal objects

    Returns:
        Formatted habits string to prepend to system prompt
    """
    if not goals:
        return ""

    habits_list = "\n".join(f"- {goal.goal_emoji} {goal.goal_description}" for goal in goals)
    instruction = (
        "If the user asks about their habits, goals, or what they're tracking, "
        "tell them about these habits."
    )
    return f"User's current habits:\n{habits_list}\n\n{instruction}\n\n"


@voice_bp.get("/validate-token")
def validate_token() -> ResponseReturnValue:
    """Validate if a token is valid (not expired).

    Takes a token as a query parameter and checks if it's valid and not expired.

    Query Parameters:
        token: The user's token (from URL path)

    Returns:
        JSON response with validation status
    """
    try:
        token = request.args.get("token")

        if not token:
            logger.warning("validate_token: Missing token parameter")
            return jsonify({"error": "Token is required"}), 400

        # Extract phone number from token
        phone_number, error_msg = _extract_phone_number(token)
        if error_msg:
            logger.warning("validate_token: Token is expired or invalid: %s", error_msg)
            return jsonify({"valid": False, "error": "Token is expired or invalid"}), 200

        # If we got a phone number, the token is valid
        logger.info("validate_token: Token is valid for phone number: %s", phone_number)
        return jsonify({"valid": True, "phone_number": phone_number}), 200

    except Exception as e:
        error = f"Error validating token > {e}"
        logger.exception(error)
        return jsonify({"error": "Internal server error"}), 500


@voice_bp.get("/user-habits")
def get_user_habits() -> ResponseReturnValue:
    """Get user's habits/goals from token.

    Takes a token as a query parameter, decodes it to get phone number,
    retrieves user's habits from database, and returns formatted habits.

    Query Parameters:
        token: The user's token (from URL path)

    Returns:
        JSON response with formatted habits string
    """
    try:
        token = request.args.get("token")

        if not token:
            logger.warning("get_user_habits: Missing token parameter")
            return jsonify({"error": "Token is required"}), 400

        # Extract phone number from token
        phone_number, error_msg = _extract_phone_number(token)
        if error_msg:
            logger.warning("get_user_habits: Failed to extract phone number: %s", error_msg)
            return jsonify({"error": "Invalid or expired token"}), 401

        # Get user from database
        user = _get_user_by_phone(phone_number)
        if not user:
            logger.warning("get_user_habits: User not found for phone number: %s", phone_number)
            return jsonify({"habits": ""}), 200  # Return empty string if user not found

        # Get user's goals/habits
        goals = db.goals.get_by_user(user.id)

        # Format habits for prompt
        habits_text = _format_habits_for_prompt(goals)

        logger.info("get_user_habits: Found %d habits for user %s", len(goals), phone_number)
        return jsonify({"habits": habits_text}), 200

    except Exception as e:
        error = f"Error getting user habits > {e}"
        logger.exception(error)
        return jsonify({"error": "Internal server error"}), 500
