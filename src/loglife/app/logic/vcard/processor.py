"""Processing logic for referral VCARD payloads."""

import json
import logging
import re

from loglife.app.config import REFERRAL_SUCCESS, WELCOME_MESSAGE
from loglife.app.db.client import db
from loglife.app.db.tables import User
from loglife.core.messaging import queue_async_message

logger = logging.getLogger(__name__)


def _extract_phone_number(vcard_str: str) -> str:
    """Extract phone_number from a vcard string."""
    match: re.Match[str] | None = re.search(r"waid=([0-9]+)", vcard_str)
    return match.group(1) if match else ""


def process_vcard(referrer_user: User, raw_vcards: str) -> str:
    """Create referral users from VCARD attachments.

    Parse the incoming VCARD JSON payload, ensure each contact exists as a
    user, link referrals, and send a welcome message to each referred number.

    Arguments:
        referrer_user: The user dict of the person sharing the VCARDs
        raw_vcards: JSON string containing the VCARD data list

    Returns:
        The referral success message constant.

    """
    try:
        vcards: list[str] = json.loads(raw_vcards)
        referrer_user_id: int = referrer_user.id

        for vcard in vcards:
            referred_phone_number = _extract_phone_number(vcard)
            if not referred_phone_number:
                continue

            referred_user: User | None = db.users.get_by_phone(referred_phone_number)
            if not referred_user:
                referred_user = db.users.create(referred_phone_number, "Asia/Karachi")

            db.referrals.create(referrer_user_id, referred_user.id)
            queue_async_message(referred_phone_number, WELCOME_MESSAGE, client_type="whatsapp")

    except Exception as exc:
        logger.exception("Error in vcard processor")
        return f"Error in vcard processor: {exc}"

    return REFERRAL_SUCCESS
