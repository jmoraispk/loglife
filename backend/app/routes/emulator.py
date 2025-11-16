from flask import render_template, Blueprint
from app.config import TEMPLATES

emulator_bp = Blueprint('emulator', __name__)

@emulator_bp.route('/emulator')
def emulator():
    return render_template('index.html')