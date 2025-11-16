from app.helpers import parse_raw_vcards, extract_phone_number
from app.config import WELCOME_MESSAGE, REFERRAL_SUCCESS
from app.helpers import send_whatsapp_message

def process_vard(sender: str, raw_vcards: str) -> str:
    vcards = parse_raw_vcards(raw_vcards)

    for vcard in vcards:
        referral_phone_number = extract_phone_number(vcard)
        send_whatsapp_message(referral_phone_number, WELCOME_MESSAGE)
    
    return REFERRAL_SUCCESS