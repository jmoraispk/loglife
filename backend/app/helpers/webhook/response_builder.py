"""Helper functions for building webhook response bodies."""

from flask import Response, jsonify


def error_response(message: str, data=None, status_code: int = 400) -> tuple[Response, int]:
    """Build an error response body."""
    return jsonify(
        {
            "success": False,
            "message": message,
            "data": data,
        }
    ), status_code


def success_response(message: str = None, status_code: int = 200, **kwargs) -> tuple[Response, int]:
    """Build a success response body."""
    return jsonify(
        {
            "success": True,
            "message": message,
            "data": kwargs,
        }
    ), status_code
