# LogLife Backend Documentation

---

## Overview

The LogLife backend is built with Python and Flask. It handles goal tracking, audio journaling, referrals, and daily reminders.

**Technology Stack:**

- Python 3.11+
- Flask
- SQLite

![Architecture Diagram](../figures/png/backend-overview.png)

<small>_Tip: Click the image to zoom._</small>

---

## Requirements

**Basic operation:**

- Python 3.11+

**Full feature set:**

- WhatsApp Client service on port 3000
- AssemblyAI API account (audio transcription)
- OpenAI API account (AI summarization)

---

## Setup

### Running

Start the backend from the root directory:

```bash
uv run src/loglife/main.py
```

**Note:** `uv sync` runs automatically when you use `uv run`, so dependencies are installed automatically.

---

## Core Features

### Goal Management

**Technical Implementation:**

Text commands are processed through a state machine pattern:

1. WhatsApp Client sends text message to `/webhook` with `msg_type: "chat"`
2. Backend routes to `process_message()` function
3. Checks `user_states` table for ongoing multi-step flows (e.g., adding goal)
4. Parses command using regex patterns and text helpers
5. Executes database operations (create, read, update)
6. Updates conversation state if needed
7. Returns formatted response

**Command Processing:**

- **Goal operations:** `add goal`, `goals`, `rate`, `week`, `lookback`
- **State management:** Multi-step flows stored in `user_states` table
- **Text parsing:** Modular helpers for each command type
- **Validation:** Input validation before database operations

**Key files:**

- `src/loglife/app/logic/text/processor.py` — Main command routing logic
- `src/loglife/app/logic/text/handlers.py` — Text command handlers (Goal, Rate, etc.)
- `src/loglife/app/logic/text/week.py` — Week summary formatter
- `src/loglife/app/db/tables/goals.py` — Goal database operations
- `src/loglife/app/db/tables/ratings.py` — Rating database operations
- `src/loglife/app/db/tables/user_states.py` — Conversation state management

### Audio Journaling

**Technical Implementation:**

1. WhatsApp Client receives audio message, downloads media, encodes as base64
2. Backend receives base64 audio via `/webhook` endpoint
3. Backend calls AssemblyAI API for transcription
4. Backend calls OpenAI GPT API for summarization
5. Stores transcript + summary in `audio_journal_entries` table
6. Returns summary to user via WhatsApp Client API

**Supported formats:** OGG, MP3, WAV, M4A

**Key files:**

- `app/logic/audio/processor.py` — Audio processing logic
- `app/logic/audio/transcribe_audio.py` — AssemblyAI integration
- `app/logic/audio/journaling/summarize_transcript.py` — OpenAI integration

### Goal Reminders

**Technical Implementation:**

- Custom threading-based scheduler (no APScheduler dependency)
- Daemon thread runs continuously, checks reminders in user timezones
- Calculates next reminder window dynamically
- Sends reminders via WhatsApp Client `/send-message` API

**Timezone handling:**

- Detects user timezone from phone number using `phonenumbers` library
- Converts UTC time to user's local timezone using `zoneinfo`
- Supports all IANA timezone identifiers

**Key files:**

- `app/services/reminder/worker.py` — Reminder scheduling service
- `src/loglife/core/routes/webhook/utils.py` — Timezone detection
- `app/logic/text/reminder_time.py` — Time format parsing

### Referrals

**Technical Implementation:**

1. WhatsApp Client detects VCARD message type, sends to `/webhook`
2. Backend parses VCARD format, extracts phone number
3. Checks for duplicate referrals in `referrals` table
4. Creates new user record if doesn't exist
5. Calls WhatsApp Client API to send onboarding message
6. Returns confirmation to referrer

**VCARD parsing:**

- Uses `vobject` library for parsing
- Extracts phone numbers from TEL fields
- Validates and formats phone numbers

**Key files:**

- `src/loglife/app/logic/vcard/processor.py` — VCARD processing logic
- `src/loglife/app/db/tables/referrals.py` — Referral database operations

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

**Database file:** `src/loglife/app/db/loglife.db`

**Schema file:** `src/loglife/app/db/schema.sql`

---

## Key Components

**Main directories:**

- `src/loglife/app/db/` - Database layer and data access
- `src/loglife/app/logic/` - Message processing and command routing
- `src/loglife/core/routes/` - Flask API endpoints
- `src/loglife/app/services/` - Background services (Sender, Reminder)
- `src/loglife/app/db/` - SQLite database file and schema

---
