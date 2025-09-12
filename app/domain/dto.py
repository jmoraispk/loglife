from dataclasses import dataclass
from typing import Optional, Dict, Any


@dataclass
class InboundMessage:
    user_phone: str
    message_id: Optional[str]
    text: str
    timestamp_iso: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None


@dataclass
class OutboundMessage:
    user_phone: str
    text: str
    attachment_path: Optional[str] = None
