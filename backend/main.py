"""Main application entry point for Life Bot.

This Flask application handles incoming webhook requests from messaging platforms,
processes user messages, and manages goal tracking functionality.
"""
import logging
from flask import Flask
from flasgger import Swagger
from dotenv import load_dotenv
from app.db.sqlite import close_db, init_db
from app.routes.web import web_bp
from app.routes.webhook import webhook_bp
from app.helpers.reminder_service import start_reminder_service

# Load environment variables from .env file
load_dotenv()

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
    start_reminder_service(app)

# Register the web blueprint
app.register_blueprint(web_bp)

# Register the webhook blueprint
app.register_blueprint(webhook_bp)

if __name__ == "__main__":
    app.run(port=5000, debug=False)