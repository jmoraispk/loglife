import logging
from flask import Flask, request
from app.logic.process_message import process_message
from app.db.sqlite import close_db, init_db
from app.routes.web import web_bp

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = Flask(__name__, template_folder='app/templates')

@app.teardown_appcontext
def close_db_connection(exception):
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

@app.route("/process", methods=["POST"])
def process():
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
    message = data.get("message", "")
    sender = data.get("from", "")
    
    # Log incoming request for debugging
    logging.debug(f"[BACKEND] Received data: {data}")
    logging.debug(f"[BACKEND] Processing message: '{message}' from: {sender}")
    
    response = process_message(message, sender)
    
    # Log response for debugging
    logging.debug(f"[BACKEND] Sending response: '{response}'")
    
    return response

if __name__ == "__main__":
    app.run(port=5000, debug=True)