from flask import Blueprint, request
from app.logic import process_vard
from app.logic import process_audio
from app.logic import process_message
from app.db import get_user_by_phone_number, create_user

webhook_bp = Blueprint('webhook', __name__)

@webhook_bp.route("/webhook", methods=["POST"])
def webhook() -> str:
    data = request.get_json()

    sender: str = data['sender']
    msg_type: str = data['msg_type']
    raw_msg: str = data['raw_msg']

    user: dict | None = get_user_by_phone_number(sender)

    if not user:
        user: dict = create_user(sender, 'Asia/Karachi')

    if msg_type == "chat":
        return process_message(user, raw_msg)

    if msg_type in ("audio", "ptt"):
        return process_audio(sender, raw_msg)

    if msg_type == "vcard":
        return process_vard(sender, raw_msg)
    
    return 'Received!'