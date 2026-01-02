"""Tests for token generation and validation."""

import time
from unittest.mock import patch

from loglife.core.tokens import (
    TOKEN_WINDOW,
    generate_short_token,
    get_phone_from_token,
    validate_short_token,
)

# Test secret key constant (not a real secret)
TEST_SECRET = "test_secret_key"  # noqa: S105


def test_generate_short_token() -> None:
    """Test token generation."""
    phone = "+1234567890"
    token = generate_short_token(phone, TEST_SECRET)

    assert isinstance(token, str)
    assert len(token) == 8
    # Token should be URL-safe
    assert all(c.isalnum() or c in "-_" for c in token)

    # Same phone and secret in same time window should generate same token
    token2 = generate_short_token(phone, TEST_SECRET)
    assert token == token2


def test_generate_short_token_different_phones() -> None:
    """Test that different phones generate different tokens."""
    token1 = generate_short_token("+1234567890", TEST_SECRET)
    token2 = generate_short_token("+9876543210", TEST_SECRET)

    assert token1 != token2


def test_generate_short_token_different_secrets() -> None:
    """Test that different secrets generate different tokens."""
    phone = "+1234567890"
    token1 = generate_short_token(phone, TEST_SECRET)
    token2 = generate_short_token(phone, "secret2")

    assert token1 != token2


def test_generate_short_token_custom_length() -> None:
    """Test token generation with custom length."""
    phone = "+1234567890"
    token = generate_short_token(phone, TEST_SECRET, length=16)

    assert len(token) == 16


def test_generate_short_token_stores_in_cache() -> None:
    """Test that token generation stores phone in cache."""
    phone = "+1234567890"
    token = generate_short_token(phone, TEST_SECRET)

    # Should be able to retrieve phone from token
    retrieved_phone = get_phone_from_token(token)
    assert retrieved_phone == phone


def test_validate_short_token_valid() -> None:
    """Test token validation with valid token."""
    phone = "+1234567890"
    token = generate_short_token(phone, TEST_SECRET)

    assert validate_short_token(token, phone, TEST_SECRET) is True


def test_validate_short_token_invalid_phone() -> None:
    """Test token validation with wrong phone."""
    phone = "+1234567890"
    token = generate_short_token(phone, TEST_SECRET)

    assert validate_short_token(token, "+9999999999", TEST_SECRET) is False


def test_validate_short_token_invalid_secret() -> None:
    """Test token validation with wrong secret."""
    phone = "+1234567890"
    token = generate_short_token(phone, TEST_SECRET)

    assert validate_short_token(token, phone, "wrong_secret") is False


def test_validate_short_token_previous_window() -> None:
    """Test that token validation accepts previous time window."""
    phone = "+1234567890"

    # Generate token in a specific time bucket
    with patch("loglife.core.tokens.time.time") as mock_time:
        # Set time to a specific bucket
        base_time = int(time.time() / TOKEN_WINDOW) * TOKEN_WINDOW
        mock_time.return_value = base_time
        token = generate_short_token(phone, TEST_SECRET)

        # Validate in the same bucket (should work)
        assert validate_short_token(token, phone, TEST_SECRET) is True

        # Validate in the next bucket (should still work due to previous window check)
        mock_time.return_value = base_time + TOKEN_WINDOW
        assert validate_short_token(token, phone, TEST_SECRET) is True

        # Validate in the bucket after that (should fail - token is too old)
        mock_time.return_value = base_time + (2 * TOKEN_WINDOW)
        assert validate_short_token(token, phone, TEST_SECRET) is False


def test_validate_short_token_expired() -> None:
    """Test that tokens expire after time window."""
    phone = "+1234567890"

    # Generate token in an old time window (2 windows ago)
    with patch("loglife.core.tokens.time.time") as mock_time:
        old_bucket_time = (int(time.time() / TOKEN_WINDOW) - 2) * TOKEN_WINDOW
        mock_time.return_value = old_bucket_time
        token = generate_short_token(phone, TEST_SECRET)

    # Validate with current time (should fail as token is too old)
    assert validate_short_token(token, phone, TEST_SECRET) is False


def test_get_phone_from_token() -> None:
    """Test retrieving phone from token cache."""
    phone = "+1234567890"
    token = generate_short_token(phone, TEST_SECRET)

    retrieved_phone = get_phone_from_token(token)
    assert retrieved_phone == phone


def test_get_phone_from_token_not_found() -> None:
    """Test retrieving phone for non-existent token."""
    retrieved_phone = get_phone_from_token("nonexistent_token")
    assert retrieved_phone is None


def test_get_phone_from_token_expired() -> None:
    """Test that expired tokens are removed from cache."""
    phone = "+1234567890"
    token = generate_short_token(phone, TEST_SECRET)

    # Manually expire the token by setting expiry time in the past
    from loglife.core.tokens import _cache_lock, _token_cache  # noqa: PLC0415

    with _cache_lock:
        # Set expiry to past
        _token_cache[token] = (phone, time.time() - 1)

    # Clean expired tokens should be called on next get
    retrieved_phone = get_phone_from_token(token)
    assert retrieved_phone is None

    # Token should be removed from cache
    with _cache_lock:
        assert token not in _token_cache


def test_token_cache_cleanup() -> None:
    """Test that expired tokens are cleaned from cache."""
    phone1 = "+1234567890"
    phone2 = "+9876543210"

    # Generate two tokens
    token1 = generate_short_token(phone1, TEST_SECRET)
    token2 = generate_short_token(phone2, TEST_SECRET)

    from loglife.core.tokens import _cache_lock, _token_cache  # noqa: PLC0415

    # Manually expire token1
    with _cache_lock:
        _token_cache[token1] = (phone1, time.time() - 1)
        # Keep token2 valid
        _token_cache[token2] = (phone2, time.time() + TOKEN_WINDOW)

    # Getting phone from token2 should clean expired tokens
    retrieved_phone = get_phone_from_token(token2)
    assert retrieved_phone == phone2

    # Token1 should be removed, token2 should remain
    with _cache_lock:
        assert token1 not in _token_cache
        assert token2 in _token_cache


def test_generate_short_token_normalizes_phone() -> None:
    """Test that phone numbers with @c.us suffix are handled."""
    phone_with_suffix = "+1234567890@c.us"
    phone_normalized = "+1234567890"

    token1 = generate_short_token(phone_with_suffix, TEST_SECRET)
    generate_short_token(phone_normalized, TEST_SECRET)  # Generate but don't use

    # They should generate different tokens since we don't normalize in generate
    # But the cache lookup should work with the exact phone used
    retrieved_phone = get_phone_from_token(token1)
    assert retrieved_phone == phone_with_suffix
