"""Voice turn endpoint for handling voice interactions.

Receives POST requests with user text and returns appropriate replies.
"""

import logging

from flask import Blueprint, jsonify, request
from flask.typing import ResponseReturnValue

voice_bp = Blueprint("voice", __name__)

logger = logging.getLogger(__name__)

# Optional API key for authentication
API_KEY = "my-super-secret-123"


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

        logger.info(
            "Voice turn request: external_user_id=%s, mode=%s, user_text=%s",
            external_user_id,
            mode,
            user_text,
        )

        if not external_user_id or not user_text:
            logger.warning("Voice turn request missing external_user_id or user_text")
            return jsonify({"reply_text": "I didn't catch that. Can you repeat?"}), 200

        # ---- YOUR LOGIC HERE (for now: simple demo) ----
        if mode == "daily_checkin":
            if user_text.lower() in ("hi", "hello", "hey"):
                reply = "Got it. Quick check-in: in 1-2 lines, how was your day so far?"
            else:
                # Hardcoded habits for testing
                habits = [
                    "Exercise for 30 minutes",
                    "Read for 20 minutes",
                    "Meditate for 10 minutes",
                ]
                habits_list = "\n".join(f"• {habit}" for habit in habits)
                reply = (
                    f'Thanks. You said: "{user_text}". '
                    f"Here are your current habits:\n{habits_list}"
                )
        else:
            reply = "Mode not supported yet."

        logger.info("Voice turn response: reply_length=%d", len(reply))
        return jsonify({"reply_text": reply}), 200
    except Exception as e:
        error = f"Error processing voice turn > {e}"
        logger.exception(error)
        return jsonify({"error": "Internal server error"}), 500

