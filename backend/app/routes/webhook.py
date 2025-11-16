from flask import Blueprint, request
from app.logic import process_vard
from app.logic import process_audio

webhook_bp = Blueprint('webhook', __name__)

@webhook_bp.route("/webhook", methods=["POST"])
def webhook() -> str:
    data = request.get_json()

    sender = data['sender']
    msg_type = data['msg_type']
    raw_msg = data['raw_msg']

    if msg_type in ("audio", "ptt"):
        return process_audio(sender, raw_msg)

    if msg_type == "vcard":
        return process_vard(sender, raw_msg)
    
    return 'Received!'