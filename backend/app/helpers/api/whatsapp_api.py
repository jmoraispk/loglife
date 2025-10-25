import requests
import logging
import os


def send_whatsapp_message(number, message):
    """
    Sends a WhatsApp message using the external API.
    
    Args:
        number (str): The WhatsApp number to send message to (e.g., "923090052353")
        message (str): The message content to send
        
    Returns:
        dict: API response containing success status and details
        
    Example:
        response = send_whatsapp_message("923090052353", "Hi there!")
        if response.get("success"):
            print("Message sent successfully")
    """
    # Get WhatsApp API URL from environment variable
    api_base_url = os.getenv("WHATSAPP_API_URL", "http://localhost:3000")
    api_url = f"{api_base_url}/send-message"
    
    payload = {
        "number": number,
        "message": message
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        logging.debug(f"[WHATSAPP_API] Sending message to {number}: '{message}'")
        
        response = requests.post(api_url, json=payload, headers=headers, timeout=10)
        response_data = response.json()
        
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
