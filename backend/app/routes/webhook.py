from flask import Blueprint, request
from app.logic.process_message import process_message
from app.logic.process_audio import process_audio

# Create a blueprint for webhook routes
webhook_bp = Blueprint('webhook', __name__)

@webhook_bp.route("/process", methods=["POST"])
def process() -> str:
    data = request.get_json()
    message: str = data.get("message") or ""
    sender: str = data.get("from", "")
    message_type: str = data.get("messageType", "chat")
    audio_data: dict = data.get("audio")
    
    # Handle audio messages
    if message_type in ['ptt', 'audio'] and audio_data:
        return process_audio(sender, audio_data)
    
    # Process message through the bot logic
    response = process_message(message, sender)
    
    return response

