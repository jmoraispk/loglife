"""WhatsApp API integration utilities.

This module provides functions for sending messages via the WhatsApp API,
handling requests, responses, and error management.
"""
import requests
import logging
import os
from typing import Any


def send_whatsapp_message(number: str, message: str) -> dict[str, Any]:
    """
    Sends a WhatsApp message using the external API.
    
    Args:
        number (str): The WhatsApp number to send message to (e.g., "923090052353")
        message (str): The message content to send
        
    Returns:
        dict[str, Any]: API response containing success status and details
        
    Example:
        response = send_whatsapp_message("923090052353", "Hi there!")
        if response.get("success"):
            print("Message sent successfully")
    """
    # Get WhatsApp API URL from environment variable
    api_base_url: str = os.getenv("WHATSAPP_API_URL", "http://localhost:3000")
    api_url: str = f"{api_base_url}/send-message"
    
    payload: dict[str, str] = {
        "number": number,
        "message": message
    }
    
    headers: dict[str, str] = {
        "Content-Type": "application/json"
    }
    
    try:
        logging.debug(f"[WHATSAPP_API] Sending message to {number}: '{message}'")
        
        response: requests.Response = requests.post(api_url, json=payload, headers=headers, timeout=10)
        response_data: Any = response.json()
        
        if response.status_code == 200 and response_data.get("success"):
            logging.debug(f"[WHATSAPP_API] Message sent successfully to {response_data.get('to')}")
            return {
                "success": True,
                "data": response_data,
                "message": "Message sent successfully"
            }
        else:
            logging.error(f"[WHATSAPP_API] Failed to send message: {response_data}")
            return {
                "success": False,
                "error": response_data.get("error", "Unknown error"),
                "status_code": response.status_code
            }
            
    except requests.exceptions.RequestException as e:
        logging.error(f"[WHATSAPP_API] Request failed: {str(e)}")
        return {
            "success": False,
            "error": f"Request failed: {str(e)}"
        }
    except Exception as e:
        logging.error(f"[WHATSAPP_API] Unexpected error: {str(e)}")
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}"
        }
