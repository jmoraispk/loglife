"""Processing logic for referral VCARD payloads."""

import json
import re

from app.config import REFERRAL_SUCCESS, WELCOME_MESSAGE
from app.db import create_referral, create_user, get_user_by_phone_number
from app.services import send_message


def _extract_phone_number(vcard_str: str) -> str:
    """Extract phone_number from a vcard string."""
    match: re.Match[str] = re.search(r"waid=([0-9]+)", vcard_str)
    return match.group(1)


def process_vcard(referrer_user: dict, raw_vcards: str) -> str:
    """Create referral users from VCARD attachments.

    Parse the incoming VCARD JSON payload, ensure each contact exists as a
    user, link referrals, and send a welcome message to each referred number.

    Args:
        referrer_user: The user dict of the person sharing the VCARDs
        raw_vcards: JSON string containing the VCARD data list

    Returns:
        The referral success message constant.

    """
    vcards: list[str] = json.loads(raw_vcards)
    referrer_user_id: int = referrer_user["id"]

    for vcard in vcards:
        referred_phone_number = _extract_phone_number(vcard)
        referred_user: dict | None = get_user_by_phone_number(referred_phone_number)
        if not referred_user:
            referred_user: dict = create_user(referred_phone_number, "Asia/Karachi")
        create_referral(referrer_user_id, referred_user["id"])
        send_message(referred_phone_number, WELCOME_MESSAGE)

    return REFERRAL_SUCCESS
