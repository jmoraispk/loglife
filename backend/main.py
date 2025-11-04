"""Main application entry point for Life Bot.

This Flask application handles incoming webhook requests from messaging platforms,
processes user messages, and manages goal tracking functionality.
"""
import os
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()

import logging
from flask import Flask
from app.db.sqlite import close_db, init_db
from app.routes.web import web_bp
from app.routes.webhook import webhook_bp
from flasgger import Swagger

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = Flask(__name__, template_folder='app/templates')

swagger = Swagger(app)

@app.teardown_appcontext
def close_db_connection(exception: Exception | None) -> None:
    """Flask teardown handler for database connection cleanup.
    
    Automatically called by Flask when the application context is torn down.
    Ensures database connections are properly closed.

    Args:
        exception: Exception that triggered the teardown (if any)
    """
    close_db(exception)

with app.app_context():
    init_db()

# Register the web blueprint
app.register_blueprint(web_bp)

<<<<<<< HEAD
# Register the webhook blueprint
app.register_blueprint(webhook_bp)
=======
@app.route("/process", methods=["POST"])
def process() -> str:
    """Process incoming webhook requests from messaging platform.
    
    Handles POST requests containing message data from external messaging
    platforms (like WhatsApp, Telegram, etc.). Extracts the message content
    and sender information, processes it through the bot's message handling
    logic, and returns the appropriate response.
    
    Expected JSON payload:
        - message (str): The text message from the user
        - from (str): The sender identifier (phone number, user ID, etc.)
    
    Returns:
        str: Bot response message to send back to the user
        
    Raises:
        KeyError: If required fields are missing from the request data
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
>>>>>>> 53ae9b0 (Refactor backend, add Twilio number docs, update docs, and remove @c.us handling from WhatsApp numbers)

if __name__ == "__main__":
    app.run(port=5000, debug=True)