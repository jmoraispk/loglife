# Life Bot Backend Documentation

> **Framework:** Python, Flask
<!-- > **Docs generated for Material for MkDocs** -->

---

 



## Architecture

- **Python 3.11+**
- **Flask**
- **SQLite**

![Architecture Diagram](images/architecture.png)

_Tip: Click the image to zoom._ 

---

## Setup & Dependencies

1) From the `backend` directory, install and sync dependencies from `pyproject.toml`/`uv.lock`:
```sh
cd backend
uv sync
```

Main dependencies:

- `flask`
- `python-dotenv`
- `requests`
- `phonenumbers` - Timezone detection from phone numbers

Development dependencies (install with `uv sync --extra dev`):

- `pytest`

---

## API Endpoints

1. **POST `/process`**

    - Main webhook endpoint for processing incoming messages.
    - **Request Body:**
     ```json
     {
       "message": "<message content or VCARD data>",
       "from": "<sender phone number>"
     }
     ```
    - **Response:** Plain text string with the bot's reply.

2. **GET `/emulator`**

    - Serves a web-based testing interface.

---

## Message Commands & Logic

Commands are routed via `process_message(message, sender)` in the backend.

| Command        | Description                                    | Example                    |
|:-------------- |:-----------------------------------------------|:---------------------------|
| `help`         | Show all commands / usage help                  | help                       |
| `goals`        | List goals with **boost levels** & reminder times | goals                      |
| `add goal ...` | Add new goal (sets **boost level**, prompts for reminder) | add goal 🏃 Run daily       |
| `week`         | Show a summary for the current week             | week                       |
| `lookback [n]` | Show the last n days summary (default 7)        | lookback 5                 |
| `rate x y`     | Rate goal x with y (1=fail,2=partial,3=success) | rate 2 3                   |
| `[digits]`     | Rate all goals at once                          | 123                        |

### Multi-Step Conversation: Goal with Reminders

When adding a goal, the bot uses **conversation state** to guide setup:

1. **User:** `add goal 🏃 Run daily`
2. **Bot:** Saves goal with **default boost level (1)** → Detects timezone → Prompts for reminder time
3. **User:** `6:30 AM` (supports: 18:00, 6 PM, 6pm, 6)
4. **Bot:** Saves reminder time → Confirms setup

The background reminder service sends daily WhatsApp messages at the specified time.

### Command Routing
- All major commands are processed with clear docstrings for each
- VCARD messages are auto-detected and routed to the referral flow
- **Conversation state tracked** in `user_states` table for multi-step flows

---

## Referral System

Allows users to share LogLife Bot via WhatsApp contact sharing.

### Core Modules

| Module | Functions | Purpose |
|--------|-----------|---------|
| `contact_detector.py` | `is_vcard()`<br>`extract_waid_from_vcard()` | VCARD format detection<br>WhatsApp ID extraction |
| `referral_tracker.py` | `process_referral()`<br>`save_referral()`<br>`get_referral_count()` | Complete referral workflow<br>Database operations<br>Referral statistics |
| `whatsapp_sender.py` | `send_onboarding_msg()` | Automated onboarding messages |
| `api/whatsapp_api.py` | `send_whatsapp_message()` | WhatsApp API client |

### Configuration

**Environment Variable:**

- WhatsApp API base URL (default: `http://localhost:3000`)

**External Dependency:**

- WhatsApp client service must be running with `/send-message` endpoint

---

## Reminder System

Sends daily WhatsApp reminders for goals at user-specified times.

### Core Modules

| Module | Functions | Purpose |
|--------|-----------|---------|
| `reminder_service.py` | `start_reminder_service()`<br>`reminder_worker()`<br>`check_and_send_reminders()`<br>`calculate_next_reminder_seconds()` | Background thread service<br>Efficient sleep scheduling<br>Send due reminders<br>Calculate next wake time |
| `state_manager.py` | `set_user_state()`<br>`get_user_state()`<br>`clear_user_state()` | Track multi-step conversations<br>Check conversation context<br>Reset to normal state |
| `time_parser.py` | `parse_reminder_time()`<br>`format_time_for_display()` | Parse flexible time formats<br>Format time for users |
| `timezone_helper.py` | `get_timezone_from_number()` | Detect timezone from phone |
| `user_timezone.py` | `detect_user_timezone()`<br>`save_user_timezone()` | Timezone detection workflow<br>Database operations |

### How It Works

1. **Goal Creation:** User adds goal → System detects timezone from phone number
2. **Time Setup:** Bot prompts for reminder time → Accepts multiple formats (24h/12h/AM/PM)
3. **Background Service:** Daemon thread started at app initialization
4. **Efficient Scheduling:** Calculates next reminder time → Sleeps until due (not constant polling)
5. **Reminder Delivery:** At reminder time → Sends WhatsApp message in user's timezone
6. **Deduplication:** Caches sent reminders to prevent duplicates

### Supported Time Formats

| Input | Output | Notes |
|-------|--------|-------|
| `18:00` | 6:00 PM | 24-hour format |
| `6 PM` | 6:00 PM | 12-hour with space |
| `6:30 PM` | 6:30 PM | With minutes |
| `6pm` | 6:00 PM | Lowercase |
| `6` | 6:00 AM | Single digit |

---

## Database Schema

### Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user` | User profiles | `phone` (unique), `name`, **`timezone`**, `created_at` |
| `user_goals` | Goal definitions | `user_id`, `goal_emoji`, `goal_description`, `is_active`, **`reminder_time`**, **`boost_level`** |
| `goal_ratings` | Daily ratings | `user_goal_id`, `rating` (1-3), `date` |
| `referrals` | Referral tracking | `referrer_phone`, `referred_phone`, `referred_waid`, `status` |
| `user_states` | **Conversation state** | **`user_phone`, `state`, `temp_data`** |

<details>
<summary>Full Schema SQL</summary>

```sql
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NULL,
    phone TEXT UNIQUE NOT NULL,
    timezone TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    goal_emoji TEXT NOT NULL,
    goal_description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    reminder_time TEXT,
    boost_level INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user (id)
);

CREATE TABLE IF NOT EXISTS goal_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_goal_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 3),
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_goal_id) REFERENCES user_goals (id)
);

CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_phone TEXT NOT NULL,
    referred_phone TEXT NOT NULL,
    referred_waid TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_states (
    user_phone TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    temp_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

</details>

---

## Directory Structure

```text
backend/
  ├── app/
  │   ├── db/                # Database layer
  │   │   ├── data_access/   # Data access modules with unified imports
  │   │   │   ├── __init__.py        # Unified interface
  │   │   │   └── user_goals/        # User goals domain
  │   │   │       ├── __init__.py
  │   │   │       └── get_user_goals.py
  │   │   └── sqlite.py      # Connection manager
  │   ├── helpers/           # Utility functions
  │   │   ├── api/           # External API integrations
  │   │   │   └── whatsapp_api.py    # WhatsApp messaging API
  │   │   ├── contact_detector.py    # VCARD detection & parsing
  │   │   ├── referral_tracker.py    # Referral database operations
  │   │   ├── whatsapp_sender.py     # Automated message sending
  │   │   ├── reminder_service.py    # Background reminder service
  │   │   ├── state_manager.py       # Conversation state tracking
  │   │   ├── time_parser.py         # Time format parsing
  │   │   ├── timezone_helper.py     # Timezone detection from phone
  │   │   └── user_timezone.py       # User timezone management
  │   ├── logic/             # Main bot logic & helpers
  │   │   ├── helpers/       # Command-specific logic
  │   │   └── process_message.py     # Message routing & state checking
  │   ├── routes/            # Flask blueprints and routes
  │   │   ├── web.py         # Emulator route (/emulator)
  │   │   └── webhook.py     # Webhook route (/process) - clean request handler
  │   ├── templates/         # Web UI (emulator)
  │   │   └── index.html     # Emulator interface
  │   └── utils/             # Config, constants, messages
  │       ├── config.py       # Goals config (DEFAULT_BOOST_LEVEL)
  │       └── messages.py     # Centralized user-facing messages
  ├── db/                    # SQLite file and schema
  │   ├── life_bot.db        # Database file
  │   └── schema.sql         # Database schema (includes user_states)
  ├── main.py                # Flask entrypoint + reminder service starter
  └── tests/                 # Pytest-based unit/integration tests
```

---

## Running

### Environment Variables

Create `.env` in `backend/` directory:

```ini
WHATSAPP_API_URL=http://localhost:3000
```

| Variable             | Default                  | Purpose                                         |
|----------------------|-------------------------|-------------------------------------------------|
| `WHATSAPP_API_URL`   | `http://localhost:3000` | WhatsApp client endpoint for referral messages   |

### Development

Start the backend:
```bash
cd backend
uv run main.py
```

Access points:

- API: `http://localhost:5000/process`
- Emulator: `http://localhost:5000/emulator`

Stop: Press `Ctrl+C`

### System Requirements

For Basic Operation:

- Python 3.11+
- SQLite (included with Python)

For Full Feature Set:

- WhatsApp Client service running on port 3000 (for referrals & reminders)
- See [WhatsApp Client](whatsapp-client.md) documentation

### Background Services

The backend automatically starts:

- **Reminder Service:** Daemon thread for sending daily goal reminders
  - Starts at app initialization via `main.py`
  - Runs continuously in background
  - Timezone-aware scheduling
  - Efficient sleep-based scheduling (not constant polling)

### Production Deployment

Run under process manager (e.g., `systemd`):

```bash
cd backend
uv run main.py
```

Note: The reminder service thread will start automatically and run as long as the Flask app is running.