"""Blueprint exposing the web-based emulator.

This module defines a Flask blueprint for serving a web-based emulator interface.
The emulator allows users to interact with the LogLife in a simulated environment.
"""

from flask import Blueprint, render_template

emulator_bp = Blueprint("emulator", __name__)


@emulator_bp.route(
    "/",
)
def emulator() -> str:
    """Render the emulator template.

    Returns:
        The rendered emulator HTML template.

    """
    return render_template("emulator.html")
