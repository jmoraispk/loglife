from flask import render_template, Blueprint

# Create a blueprint for web routes
web_bp = Blueprint('web', __name__)

@web_bp.route('/emulator')
def emulator():
    """Dedicated route for the emulator UI"""
    return render_template('index.html')