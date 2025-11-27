"""Blueprint exposing the web-based emulator.

This module defines a Flask blueprint for serving a web-based emulator interface.
The emulator allows users to interact with the LogLife in a simulated environment.
"""

from flask import render_template, Blueprint

emulator_bp = Blueprint("emulator", __name__)


@emulator_bp.route(
    "/emulator", strict_slashes=False
)  # strict_slashes=False lets the emulator route match both /emulator and /emulator/
def emulator():
    """Renders the emulator template."""
    return render_template("emulator.html")
