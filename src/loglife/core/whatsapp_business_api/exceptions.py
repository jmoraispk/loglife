"""Custom exceptions for WhatsApp SDK."""


class WhatsAppSDKError(Exception):
    """Base error for the SDK."""


class WhatsAppHTTPError(WhatsAppSDKError):
    """HTTP error from WhatsApp API."""

    def __init__(self, status_code: int, message: str, details: dict | None = None) -> None:
        """Initialize HTTP error.

        Args:
            status_code: HTTP status code.
            message: Error message.
            details: Optional error details dictionary.
        """
        super().__init__(f"HTTP {status_code}: {message}")
        self.status_code = status_code
        self.details = details or {}


class WhatsAppRequestError(WhatsAppSDKError):
    """Network/timeout/etc."""
