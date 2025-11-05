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

    ---
    tags:
      - Emulator
    produces:
      - text/html
    summary: Emulator interface for testing the bot
    description: |
      Serves a simple web interface to interact with the Life Bot without
      requiring a messaging platform. Useful for manual testing and demos.
    responses:
      200:
        description: Emulator page rendered successfully
        schema:
          type: string
    """
    return render_template('index.html')