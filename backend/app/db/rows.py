from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class User:
    id: int
    phone_number: str
    timezone: str
    created_at: datetime
    send_transcript_file: int  # 0 or 1

@dataclass
class Goal:
    id: int
    user_id: int
    goal_emoji: str
    goal_description: str
    boost_level: int
    created_at: datetime

@dataclass
class Rating:
    id: int
    user_goal_id: int
    rating: int
    rating_date: datetime
    created_at: datetime
    updated_at: datetime

@dataclass
class Reminder:
    id: int
    user_id: int
    user_goal_id: int
    reminder_time: datetime
    created_at: datetime

@dataclass
class Referral:
    id: int
    referrer_user_id: int
    referred_user_id: int
    created_at: datetime

@dataclass
class UserState:
    user_id: int
    state: str
    temp_data: Optional[str]
    created_at: datetime

@dataclass
class AudioJournalEntry:
    id: int
    user_id: int
    transcription_text: Optional[str]
    summary_text: Optional[str]
    created_at: datetime

