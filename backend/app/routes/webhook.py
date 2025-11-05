"""Webhook routes for the Life Bot application.

This module provides webhook endpoints for receiving messages from messaging platforms,
processing user messages, and handling contact referrals.
"""
import logging
from flask import Blueprint, request
from app.logic.process_message import process_message
from app.helpers.contact_detector import is_vcard, extract_waid_from_vcard
from app.helpers.referral_tracker import process_referral
from app.utils.messages import REFERRAL_SUCCESS

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
          required:
            - message
            - from
    responses:
      200:
        description: Bot response message
        schema:
          type: string
    """
    data = request.get_json()
    message: str = data.get("message", "")
    sender: str = data.get("from", "")
    
    # Contact sharing detection: When users share contacts on WhatsApp, the message contains VCARD data
    # Example: BEGIN:VCARD\nVERSION:3.0\nN:;0332 5727426;;;\nFN:0332 5727426\nTEL;type=CELL;waid=923325727426:+92 332 5727426\nEND:VCARD
    
    # Log incoming request for debugging
    logging.debug(f"[BACKEND] Received data: {data}")
    logging.debug(f"[BACKEND] Processing message: '{message}' from: {sender}")
    
    # Check if the message is a shared contact (VCARD format)
    if is_vcard(message):
        # Extract WhatsApp ID from the VCARD data
        waid: str = extract_waid_from_vcard(message)
        logging.debug(f"[BACKEND] Contact shared detected, WAID: {waid}")
        
        # Process referral: save to database and send onboarding message
        if waid:
            process_referral(sender, waid)
        
        response: str = REFERRAL_SUCCESS
    else:
        # Process regular message through the bot logic
        response = process_message(message, sender)
    
    # Log response for debugging
    logging.debug(f"[BACKEND] Sending response: '{response}'")
    
    return response

