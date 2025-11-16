import json
import re

def parse_raw_vcards(raw_vcards: str) -> list[str]:
    return json.loads(raw_vcards)

def extract_phone_number(vcard_str: str) -> str:
    """
    Extracts phone_number from a vcard string.
    """
    match = re.search(r'waid=([0-9]+)', vcard_str)
    return match.group(1)