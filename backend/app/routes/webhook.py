"""Webhook routes for the Life Bot application.

This module provides webhook endpoints for receiving messages from messaging platforms.
"""
import logging
from flask import Blueprint, request
from app.logic.process_message import process_message
from app.logic.process_audio import process_audio

# Create a blueprint for webhook routes
webhook_bp = Blueprint('webhook', __name__)

@webhook_bp.route("/process", methods=["POST"])
def process() -> str:
    """
    Process incoming webhook requests from messaging platform

    ---
    tags:
      - Webhook
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        schema:
          type: object
          properties:
            message:
              type: string
            from:
              type: string
            messageType:
              type: string
            audio:
              type: object
          required:
            - from
    responses:
      200:
        description: Bot response message
        schema:
          type: string
    """
    data = request.get_json()
    message: str = data.get("message") or ""
    sender: str = data.get("from", "")
    message_type: str = data.get("messageType", "chat")
    audio_data: dict = data.get("audio")
    
    # Handle audio messages
    if message_type in ['ptt', 'audio'] and audio_data:
        return process_audio(sender, audio_data)
    
    # Log text message processing
    logging.debug(f"[BACKEND] Processing message: '{message}' from: {sender}")
    
    # Process message through the bot logic
    response = process_message(message, sender)
    
    # Log response for debugging
    logging.debug(f"[BACKEND] Sending response: '{response}'")
    
    return response

