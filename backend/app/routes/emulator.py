from flask import render_template, Blueprint
from app.config import TEMPLATES

emulator_bp = Blueprint('emulator', __name__)

@emulator_bp.route('/emulator', strict_slashes=False)
def emulator():
    return render_template('emulator.html')