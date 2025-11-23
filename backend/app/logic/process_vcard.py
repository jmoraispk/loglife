"""Processing logic for referral VCARD payloads."""

import json
from app.helpers import extract_phone_number
from app.config import WELCOME_MESSAGE, REFERRAL_SUCCESS
from app.helpers import send_whatsapp_message
from app.db import get_user_by_phone_number, create_user, create_referral


def process_vard(referrer_user: dict, raw_vcards: str) -> str:
    """Creates referral users from VCARD attachments.

    Parses the incoming VCARD JSON payload, ensures each contact exists as a
    user, links referrals, and sends a welcome message to each referred number.

    Arguments:
    referrer_user -- The user dict of the person sharing the VCARDs
    raw_vcards -- JSON string containing the VCARD data list

    Returns the referral success message constant.
    """
    vcards: list[str] = json.loads(raw_vcards)
    referrer_user_id: int = referrer_user["id"]

    for vcard in vcards:
        referred_phone_number = extract_phone_number(vcard)
        referred_user: dict | None = get_user_by_phone_number(referred_phone_number)
        if not referred_user:
            referred_user: dict = create_user(referred_phone_number, "Asia/Karachi")
        create_referral(referrer_user_id, referred_user["id"])
        send_whatsapp_message(referred_phone_number, WELCOME_MESSAGE)

    return REFERRAL_SUCCESS
