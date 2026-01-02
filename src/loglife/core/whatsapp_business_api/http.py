"""HTTP client for WhatsApp API requests."""

import time

import requests

from .exceptions import WhatsAppHTTPError, WhatsAppRequestError

HTTP_BAD_REQUEST = 400
_MAX_RETRIES_EXCEEDED_MSG = "Max retries exceeded"


class HttpClient:
    """HTTP client with retry logic and error handling."""

    def __init__(  # noqa: PLR0913
        self,
        base_url: str,
        access_token: str,
        timeout: float = 15.0,
        max_retries: int = 3,
        backoff_factor: float = 0.5,
        session: requests.Session | None = None,
    ) -> None:
        """Initialize HTTP client.

        Args:
            base_url: Base URL for API requests.
            access_token: Bearer token for authentication.
            timeout: Request timeout in seconds. Defaults to 15.0.
            max_retries: Maximum retry attempts. Defaults to 3.
            backoff_factor: Exponential backoff factor. Defaults to 0.5.
            session: Optional requests session. Creates new if None.
        """
        self.base_url = base_url.rstrip("/")
        self.access_token = access_token
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.session = session or requests.Session()

    def request(
        self,
        method: str,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
    ) -> dict:
        """Make HTTP request with retry logic.

        Args:
            method: HTTP method (GET, POST, etc.).
            path: API endpoint path.
            json: Optional JSON payload.
            params: Optional query parameters.

        Returns:
            Response JSON data.

        Raises:
            WhatsAppHTTPError: For HTTP errors (status >= 400).
            WhatsAppRequestError: For network/timeout errors.
        """
        url = f"{self.base_url}{path}"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        for attempt in range(self.max_retries + 1):
            try:
                resp = self.session.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=json,
                    params=params,
                    timeout=self.timeout,
                )
            except (requests.Timeout, requests.ConnectionError) as e:
                if attempt < self.max_retries:
                    time.sleep(self.backoff_factor * (2**attempt))
                    continue
                error_msg = f"Network error: {e}"
                raise WhatsAppRequestError(error_msg) from e

            if resp.status_code >= HTTP_BAD_REQUEST:
                try:
                    data = resp.json()
                except (ValueError, requests.JSONDecodeError):
                    data = {"raw": resp.text}
                msg = data.get("error", {}).get("message", "Request failed")
                raise WhatsAppHTTPError(resp.status_code, msg, data)

            return resp.json()

        # This should never be reached, but satisfies RET503
        raise WhatsAppRequestError(_MAX_RETRIES_EXCEEDED_MSG)
