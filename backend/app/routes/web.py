"""Web routes for the Life Bot application.

This module provides web-based routes including the emulator interface
for testing bot functionality without a messaging platform.
"""
from flask import render_template, Blueprint

# Create a blueprint for web routes
web_bp = Blueprint('web', __name__)

@web_bp.route('/emulator')
def emulator() -> str:
    """Dedicated route for the emulator UI.
    
    Serves the emulator interface for testing the life bot functionality.
    This route provides a web-based interface to interact with the bot
    without needing a messaging platform.
    
    Returns:
        str: Rendered HTML template for the emulator interface
    """
    return render_template('index.html')