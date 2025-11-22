# Life Bot Backend Documentation

---

## Overview

The Life Bot backend is built with Python and Flask. It handles goal tracking, audio journaling, referrals, and daily reminders.

**Technology Stack:**

- Python 3.11+
- Flask
- SQLite

![Architecture Diagram](diagrams/pngs/backend-overview.png)

<small>_Tip: Click the image to zoom._</small>

---

## Setup

### Running

Start the backend from the root directory:

```bash
uv run backend/main.py
```

**Note:** `uv sync` runs automatically when you use `uv run`, so dependencies are installed automatically.

---

## Features

### User Commands

| Command        | Description                                    | Example                    |
|:-------------- |:-----------------------------------------------|:---------------------------|
| `help`         | Show all commands                              | help                       |
| `goals`        | List goals with boost levels & reminder times  | goals                      |
| `add goal ...` | Add new goal with boost level & reminder       | add goal 🏃 Run daily       |
| `week`         | Show current week summary                      | week                       |
| `lookback [n]` | Show last n days summary (default 7)           | lookback 5                 |
| `rate x y`     | Rate goal x with y (1-3)                       | rate 2 3                   |
| `[digits]`     | Rate all goals at once                         | 123                        |

### Audio Journaling

Users can send voice notes to journal their day.

**Flow:**

1. User sends voice note via WhatsApp
2. Bot transcribes using AssemblyAI
3. Bot summarizes using OpenAI GPT
4. Saves transcript + summary to database
5. Returns AI-generated summary to user

**Supported formats:** Voice notes, audio files (OGG, MP3, WAV, M4A)

### Goal Reminders

Users receive daily WhatsApp reminders for their goals at specified times.

**Setup:**

1. User adds a goal
2. Bot detects user's timezone from phone number
3. Bot prompts for reminder time
4. User enters time (supports: 18:00, 6 PM, 6:30 PM, 6pm, 6)
5. Bot schedules daily reminder

**Background service:** Runs automatically when backend starts, sends reminders at scheduled times in user's timezone.

### Referrals

Users can refer others by sharing their WhatsApp contact with the bot.

**How it works:**

1. User shares a contact with Life Bot
2. Bot detects the VCARD format
3. Extracts WhatsApp ID and phone number
4. Saves referral to database (prevents duplicates)
5. Sends automated onboarding message to new user
6. Confirms with the referrer

**Requirements:** WhatsApp client service running on port 3000

---

## Database

The backend uses SQLite with the following main tables:

| Table | Purpose |
|-------|---------|
| `user` | User profiles with phone and timezone |
| `user_goals` | Goals with boost levels and reminder times |
| `goal_ratings` | Daily goal ratings (1-3) |
| `referrals` | Referral tracking |
| `user_states` | Conversation state for multi-step flows |
| `audio_journal_entries` | Audio transcripts and summaries |

**Database file:** `backend/db/life_bot.db`

**Schema file:** `backend/db/schema.sql`

---

## Key Components

**Main directories:**

- `app/db/` - Database layer and data access
- `app/helpers/` - Utility functions (referrals, reminders, timezone)
- `app/logic/` - Message processing and command routing
- `app/routes/` - Flask API endpoints
- `db/` - SQLite database file and schema

---

## Requirements

**Basic operation:**

- Python 3.11+

**Full feature set:**

- WhatsApp Client service on port 3000
- AssemblyAI API account (audio transcription)
- OpenAI API account (AI summarization)

---

## API Endpoints

**POST `/webhook`**

Main endpoint for processing incoming messages.

Accepts: text messages, audio messages, VCARD contacts

**GET `/emulator`**

Web-based testing interface for the bot.

---

---
