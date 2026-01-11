"""Token generation and validation for voice call URLs.

Provides HMAC-based short token generation and validation with time-based expiry.
"""

import base64
import hashlib
import hmac
import time
from threading import Lock

TOKEN_WINDOW = 300  # 5 minutes

# In-memory cache to map tokens to phone numbers (since HMAC tokens can't be decoded)
_token_cache: dict[str, tuple[str, float]] = {}
_cache_lock = Lock()


def _clean_expired_tokens() -> None:
    """Remove expired tokens from cache. Must be called while holding _cache_lock."""
    current_time = time.time()
    expired_tokens = [token for token, (_, expiry) in _token_cache.items() if expiry < current_time]
    for token in expired_tokens:
        del _token_cache[token]


def generate_short_token(phone: str, secret: str, length: int = 8) -> str:
    """Generate a short, URL-safe token bound to phone + time window.

    Args:
        phone: Phone number to bind the token to
        secret: Secret key for HMAC signing
        length: Length of the token to return (default: 8)

    Returns:
        URL-safe token string
    """
    bucket = str(int(time.time() / TOKEN_WINDOW))  # time-based expiry
    msg = f"{phone}:{bucket}"
    digest = hmac.new(secret.encode(), msg.encode(), hashlib.sha256).digest()
    token = base64.urlsafe_b64encode(digest).decode()[:length]

    # Store token -> phone mapping in cache (expires in TOKEN_WINDOW + buffer)
    expiry_time = time.time() + TOKEN_WINDOW + 60  # Add 1 minute buffer
    with _cache_lock:
        _clean_expired_tokens()
        _token_cache[token] = (phone, expiry_time)

    return token


def validate_short_token(token: str, phone: str, secret: str, length: int = 8) -> bool:
    """Validate token for current or previous time window (allows small clock drift).

    Args:
        token: Token to validate
        phone: Phone number to validate against
        secret: Secret key for HMAC verification
        length: Length of the token (default: 8)

    Returns:
        True if token is valid, False otherwise
    """
    now_bucket = int(time.time() / TOKEN_WINDOW)
    for bucket in (now_bucket, now_bucket - 1):
        msg = f"{phone}:{bucket}"
        digest = hmac.new(secret.encode(), msg.encode(), hashlib.sha256).digest()
        expected = base64.urlsafe_b64encode(digest).decode()[:length]
        if hmac.compare_digest(token, expected):
            return True
    return False


def get_phone_from_token(token: str) -> str | None:
    """Get phone number from token using cache (since HMAC tokens can't be decoded).

    Args:
        token: Token to look up

    Returns:
        Phone number if token is found and not expired, None otherwise
    """
    with _cache_lock:
        _clean_expired_tokens()
        if token in _token_cache:
            phone, _ = _token_cache[token]
            return phone
    return None
