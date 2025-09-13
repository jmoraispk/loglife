"""Simple HMAC-based signer for export links (24h TTL by default)."""

from __future__ import annotations

import hmac
import os
import time
from hashlib import sha256


def sign_path(path: str, ttl_seconds: int = 86400) -> str:
    """Return a signed link string for a local file path.

    This does not serve files; it produces a token that could be verified by a
    future HTTP layer. For now, we return a pseudo-URL that can be sent to the
    user for reference.
    """
    secret = os.environ.get("HABITS_SIGNING_SECRET", "dev-secret")
    exp = int(time.time()) + ttl_seconds
    msg = f"{path}:{exp}".encode()
    token = hmac.new(secret.encode(), msg, sha256).hexdigest()[:24]
    return f"file://{path}?exp={exp}&sig={token}"
