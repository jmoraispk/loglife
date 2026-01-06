"""Web-based emulator for testing chat flows.

Serves the emulator UI and provides an SSE stream for realtime logs.
"""

import os
from collections.abc import Generator

import requests
from flask import Blueprint, Response, jsonify, render_template, request

from loglife.app.config.settings import EMULATOR_SQLITE_WEB_URL
from loglife.core.transports import log_broadcaster

emulator_bp = Blueprint(
    "emulator",
    __name__,
    template_folder="templates",
    static_folder="static",
)


@emulator_bp.route("/")
def emulator() -> str:
    """Render the emulator HTML interface."""
    return render_template("emulator.html", db_url=EMULATOR_SQLITE_WEB_URL)


@emulator_bp.route("/vapi-admin")
def vapi_admin() -> str:
    """Render the VAPI assistant admin panel."""
    # Get assistant IDs from environment
    assistant_ids = {
        "1": os.getenv("NEXT_PUBLIC_VAPI_ASSISTANT_ID_1", ""),
        "2": os.getenv("NEXT_PUBLIC_VAPI_ASSISTANT_ID_2", ""),
        "3": os.getenv("NEXT_PUBLIC_VAPI_ASSISTANT_ID_3", ""),
        "4": os.getenv("NEXT_PUBLIC_VAPI_ASSISTANT_ID_4", ""),
    }
    return render_template("vapi-admin.html", assistant_ids=assistant_ids)


@emulator_bp.route("/vapi-admin/api/assistant/<assistant_id>", methods=["GET", "PATCH"])
def vapi_assistant(assistant_id: str) -> Response:
    """Fetch or update assistant configuration from VAPI API."""
    vapi_private_key = os.getenv("VAPI_PRIVATE_KEY")

    if not vapi_private_key:
        return jsonify({"error": "VAPI_PRIVATE_KEY is not configured"}), 500

    if request.method == "GET":
        return _fetch_assistant(assistant_id, vapi_private_key)

    if request.method == "PATCH":
        return _update_assistant(assistant_id, vapi_private_key)

    return jsonify({"error": "Method not allowed"}), 405


def _fetch_assistant(assistant_id: str, vapi_private_key: str) -> Response:
    """Fetch assistant configuration from VAPI API."""
    try:
        response = requests.get(
            f"https://api.vapi.ai/assistant/{assistant_id}",
            headers={
                "Authorization": f"Bearer {vapi_private_key}",
                "Accept": "application/json",
            },
            timeout=10,
        )

        if not response.ok:
            return jsonify({
                "error": f"Failed to fetch assistant: {response.status_code}",
                "details": response.text
            }), response.status_code

        # Return raw JSON response from VAPI
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({
            "error": "Failed to fetch assistant",
            "details": str(e)
        }), 500


def _update_assistant(assistant_id: str, vapi_private_key: str) -> Response:
    """Update assistant configuration via VAPI API using PATCH."""
    try:
        config_data = request.get_json()

        if not config_data:
            return jsonify({"error": "No configuration data provided"}), 400

        # Filter out read-only fields before sending to VAPI
        read_only_fields = [
            "id",
            "orgId",
            "createdAt",
            "updatedAt",
            "isServerUrlSecretSet",
            "backgroundDenoisingEnabled",
            "compliancePlan",
            "hipaaEnabled",
        ]
        editable_data = {
            k: v for k, v in config_data.items() if k not in read_only_fields
        }

        response = requests.patch(
            f"https://api.vapi.ai/assistant/{assistant_id}",
            headers={
                "Authorization": f"Bearer {vapi_private_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json=editable_data,
            timeout=30,
        )

        if not response.ok:
            return jsonify({
                "error": f"Failed to update assistant: {response.status_code}",
                "details": response.text
            }), response.status_code

        # Return updated assistant configuration from VAPI
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({
            "error": "Failed to update assistant",
            "details": str(e)
        }), 500


@emulator_bp.route("/events")
def events() -> Response:
    """Stream realtime log events to the browser via SSE."""

    def stream() -> Generator[str, None, None]:
        # Listen yields messages from the broadcaster
        for msg in log_broadcaster.listen():
            # Handle multiline messages for SSE
            formatted_msg = msg.replace("\n", "\ndata: ")
            yield f"data: {formatted_msg}\n\n"

    response = Response(stream(), mimetype="text/event-stream")
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"
    return response
