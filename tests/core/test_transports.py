"""Tests for the transport layer (WhatsApp/Emulator adapters)."""

from unittest.mock import MagicMock, patch

import pytest
import requests

from loglife.core.transports import (
    LogBroadcaster,
    send_emulator_message,
    send_whatsapp_message,
)


def test_log_broadcaster() -> None:
    """Test Pub/Sub behavior of LogBroadcaster."""
    broadcaster = LogBroadcaster()
    
    # 1. Test Publish with no listeners (safe)
    broadcaster.publish("hello")
    
    # 2. Test Listener
    messages = []
    
    def consumer() -> None:
        for msg in broadcaster.listen():
            messages.append(msg)
            if msg == "stop":
                break

    import threading
    t = threading.Thread(target=consumer)
    t.start()
    
    # Allow thread to start
    import time
    time.sleep(0.1)
    
    broadcaster.publish("msg1")
    broadcaster.publish("msg2")
    broadcaster.publish("stop")
    
    t.join(timeout=1.0)
    
    assert messages == ["msg1", "msg2", "stop"]


def test_send_whatsapp_message_success() -> None:
    """Test successful WhatsApp API call."""
    with patch("loglife.core.transports.requests.post") as mock_post:
        mock_post.return_value.status_code = 200
        
        send_whatsapp_message("+123", "Hello World")
        
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert kwargs["json"]["number"] == "+123"
        assert kwargs["json"]["message"] == "Hello World"


def test_send_whatsapp_message_with_attachments() -> None:
    """Test WhatsApp API call with attachments."""
    with patch("loglife.core.transports.requests.post") as mock_post:
        send_whatsapp_message("+123", "Pic", attachments={"url": "http://img"})
        
        args, kwargs = mock_post.call_args
        assert kwargs["json"]["attachments"] == {"url": "http://img"}


def test_send_whatsapp_message_with_empty_attachments() -> None:
    """Test WhatsApp API call with empty attachments (should not be in payload)."""
    with patch("loglife.core.transports.requests.post") as mock_post:
        send_whatsapp_message("+123", "Text", attachments={})
        
        args, kwargs = mock_post.call_args
        # Should NOT have "attachments" key if dict is empty (or handled gracefully)
        # Based on implementation: if attachments: -> {} is falsey
        assert "attachments" not in kwargs["json"]


def test_send_whatsapp_message_failure() -> None:
    """Test error handling in WhatsApp transport."""
    with patch("loglife.core.transports.requests.post") as mock_post:
        mock_post.side_effect = requests.exceptions.ConnectionError("Boom")
        
        with pytest.raises(RuntimeError, match="Error sending WhatsApp message"):
            send_whatsapp_message("+123", "Fail")


def test_send_emulator_message() -> None:
    """Test emulator message broadcasting."""
    # We need to patch the global log_broadcaster in transports
    with patch("loglife.core.transports.log_broadcaster") as mock_broadcaster:
        send_emulator_message("Hello Emulator")
        mock_broadcaster.publish.assert_called_with("Hello Emulator")


def test_send_emulator_message_with_transcript() -> None:
    """Test emulator message with special transcript attachment."""
    with patch("loglife.core.transports.log_broadcaster") as mock_broadcaster:
        send_emulator_message("Done", attachments={"transcript_file": "path/to/file"})
        
        # Should be serialized json
        mock_broadcaster.publish.assert_called_once()
        call_arg = mock_broadcaster.publish.call_args[0][0]
        assert '"text": "Done"' in call_arg
        assert '"transcript_file": "path/to/file"' in call_arg


def test_send_emulator_message_json_failure() -> None:
    """Test resilience when JSON serialization fails for emulator."""
    # Create an object that cannot be serialized
    bad_obj = object()
    
    with patch("loglife.core.transports.log_broadcaster") as mock_broadcaster:
        # Pass a bad attachment that causes json.dumps to crash
        # But wait, json.dumps is only called if "transcript_file" is in attachments
        # We can't easily force json.dumps to fail with simple strings unless we mess up the dict heavily
        # But we can mock json.dumps to raise exception
        with patch("loglife.core.transports.json.dumps", side_effect=TypeError("Fail")):
            send_emulator_message("Text", attachments={"transcript_file": "exists"})
            
            # Should fall back to publishing raw message
            mock_broadcaster.publish.assert_called_with("Text")
