"""Helper functions for building webhook response bodies."""

from typing import Any

from flask import Response, jsonify


def error_response(
    message: str,
    data: dict[str, Any] | None = None,
    status_code: int = 400,
) -> tuple[Response, int]:
    """Build an error response body.

    Args:
        message: The error message
        data: Optional error data
        status_code: HTTP status code (default: 400)

    Returns:
        A tuple of (Response, status_code)

    """
    return (
        jsonify(
            {
                "success": False,
                "message": message,
                "data": data,
            }
        ),
        status_code,
    )


def success_response(
    message: str | None = None,
    status_code: int = 200,
    **kwargs: Any,  # noqa: ANN401
) -> tuple[Response, int]:
    """Build a success response body.

    Args:
        message: The success message
        status_code: HTTP status code (default: 200)
        **kwargs: Additional data to include in the response

    Returns:
        A tuple of (Response, status_code)

    """
    return (
        jsonify(
            {
                "success": True,
                "message": message,
                "data": kwargs,
            }
        ),
        status_code,
    )
