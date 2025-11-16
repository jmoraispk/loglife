import requests
import os
from app.config import WHATSAPP_API_URL


def send_whatsapp_message(number: str, message: str):
    payload = {
        "number": number,
        "message": message
    }
    headers = {
        "Content-Type": "application/json"
    }
        
    requests.post(WHATSAPP_API_URL, json=payload, headers=headers)