"""Tests for WhatsApp sender helper."""

from unittest.mock import MagicMock, patch
import pytest
from app.helpers.sender.whatsapp_sender import send_whatsapp_message


def test_send_whatsapp_message_success():
    """Test successful WhatsApp message sending."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    
    with patch("app.helpers.sender.whatsapp_sender.requests.post") as mock_post:
        mock_post.return_value = mock_response
        
        send_whatsapp_message("1234567890", "Hello")
        
        mock_post.assert_called_once()
        args = mock_post.call_args
        assert args[1]['json']['number'] == "1234567890"
        assert args[1]['json']['message'] == "Hello"


def test_send_whatsapp_message_failure():
    """Test WhatsApp message sending failure."""
    with patch("app.helpers.sender.whatsapp_sender.requests.post") as mock_post:
        mock_post.side_effect = Exception("Connection error")
        
        with pytest.raises(RuntimeError) as exc:
            send_whatsapp_message("1234567890", "Hello")
        
        assert "Error sending WhatsApp message" in str(exc.value)

