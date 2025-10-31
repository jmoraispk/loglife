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

| Command        | Description                                    | Example                    | Multi-Step? |
|:-------------- |:-----------------------------------------------|:---------------------------|:------------|
| `help`         | Show all commands / usage help                  | help                       | No |
| `goals`        | List your personal goals                        | goals                      | No |
| `add goal ...` | Add a new goal (with emoji/desc) and set reminder time | add goal 🏃 Run daily       | **Yes** ⏰ |
| `week`         | Show a summary for the current week             | week                       | No |
| `lookback [n]` | Show the last n days summary (default 7)        | lookback 5                 | No |
| `rate x y`     | Rate goal x with y (1=fail,2=partial,3=success) | rate 2 3                   | No |
| `[digits]`     | Rate all goals at once                          | 123                        | No |

### Command Routing
- All major commands are processed with clear docstrings for each
- VCARD messages are auto-detected and routed to the referral flow

---

## Reminder System

Life Bot includes an automated reminder system that sends daily WhatsApp reminders to users at their scheduled times for each goal.

### How It Works

1. **Goal Creation with Reminder**
   - User adds a goal with `add goal 🏃 Run daily`
   - System saves the goal and sets user state to `waiting_for_reminder_time`
   - Bot asks: "What time should I remind you daily?"

2. **Time Input & Parsing**
   - User responds with flexible time format: `18:00`, `6 PM`, `6pm`, `6:00 PM`, or just `6`
   - System parses time using `time_parser.py` and normalizes to HH:MM (24-hour format)
   - Validates the time format and provides error message if invalid

3. **Reminder Storage**
   - Saves `reminder_time` field in the `user_goals` table
   - Stores user's timezone in the `user` table for timezone-aware reminders
   - Clears user state back to `normal`

4. **Background Reminder Job**
   - Separate cron script (`reminder.py`) runs continuously
   - Polls database every 15 seconds for active goals with reminder times
   - Compares current time (in user's timezone) with goal's reminder time
   - Sends WhatsApp reminder when time matches
   - Prevents duplicate reminders for the same day/minute

### Technical Implementation

**Helper Modules:**
- `state_manager.py` - Manages conversation state for multi-step flows
- `time_parser.py` - Parses flexible time formats and normalizes to HH:MM
- `timezone_helper.py` & `user_timezone.py` - Timezone detection and storage
- `add_goal.py` - Extended with `set_reminder_time()` function
- `process_message.py` - Updated to check user state before command routing

**Background Job:**
- `cron/reminder.py` - Standalone script that continuously monitors and sends reminders
- Must be run separately: `uv run .\cron\reminder.py` (from backend directory)
- Uses `whatsapp_api.py` to send reminder messages via WhatsApp API

**Time Formats Supported:**
- 24-hour format: `18:00`, `18:30`
- 12-hour format: `6 PM`, `6:30 PM`, `6 AM`
- Short format: `6pm`, `6am`
- Simple hour: `6`, `18`

**Example Reminder Message:**
```text
⏰ Reminder: 🏃 Run daily
```

**Database Fields:**
- `user.timezone` - Stores user's IANA timezone (e.g., `America/New_York`)
- `user_goals.reminder_time` - Stores time in HH:MM format (e.g., `18:00`)
- `user_states.state` - Tracks conversation state (e.g., `waiting_for_reminder_time`)
- `user_states.temp_data` - Stores temporary data like goal_id

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

## Database Schema

### Tables Overview

**user_goals**
- Stores individual goals with emoji, description, and **reminder time**
- Linked to users via `user_id` foreign key
- `is_active` flag for soft deletion
- **NEW:** `reminder_time` field stores daily reminder time in HH:MM format

**goal_ratings**
- Stores daily ratings for each goal
- Rating scale: 1 (fail), 2 (partial), 3 (success)
- Linked to `user_goals` via `user_goal_id` foreign key

**referrals**
- Tracks referral relationships between users
- Stores referrer phone, referred phone, and WhatsApp ID
- Status field for tracking referral lifecycle (`pending`, etc.)

**user_states** *(new)*
- Manages conversation state for multi-step flows
- Stores user phone, current state, and temporary data
- Enables conversational interactions like reminder time setup

```sql
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NULL,
    phone TEXT UNIQUE NOT NULL,
    timezone TEXT NULL,                              -- NEW: IANA timezone
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    goal_emoji TEXT NOT NULL,
    goal_description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    reminder_time TEXT,                              -- NEW: HH:MM format
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

CREATE TABLE IF NOT EXISTS user_states (             -- NEW TABLE
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
  │   │   ├── state_manager.py       # Conversation state management (NEW)
  │   │   ├── time_parser.py         # Flexible time parsing (NEW)
  │   │   ├── timezone_helper.py     # Timezone utilities (NEW)
  │   │   └── user_timezone.py       # User timezone detection (NEW)
  │   ├── logic/             # Main bot logic & helpers
  │   │   ├── helpers/       # Command-specific logic
  │   │   └── process_message.py     # Message routing & VCARD detection
  │   ├── routes/            # Flask blueprints and routes
  │   │   ├── web.py         # Emulator route (/emulator)
  │   │   └── webhook.py     # Webhook route (/process) - clean request handler
  │   ├── templates/         # Web UI (emulator)
  │   │   └── index.html     # Emulator interface
  │   └── utils/             # Config, constants
  ├── cron/                  # Background jobs (NEW)
  │   ├── reminder.py        # Reminder cron job (NEW)
  │   └── temp/              # Temporary helper scripts
  │       └── set_reminder_for_goal.py  # Manual reminder setter
  ├── db/                    # SQLite file and schema
  │   ├── life_bot.db        # Database file
  │   └── schema.sql         # Database schema (UPDATED)
  ├── main.py                # Flask entrypoint
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
- The server runs at `http://localhost:5000`
- Emulator UI: open `http://localhost:5000/emulator`
- Handles all message processing and command routing

Access points:

- API: `http://localhost:5000/process`
- Emulator: `http://localhost:5000/emulator`

Stop: Press `Ctrl+C`

To stop the reminder job: press `Ctrl+C` in the terminal.

For Basic Operation:

- Python 3.11+
- SQLite (included with Python)

For Referral System:

- WhatsApp Client service running on port 3000
- See [WhatsApp Client](whatsapp-client.md) documentation

### Production Deployment

For production, run all three processes under a process manager like `systemd`:
- Flask backend as a service
- Reminder cron job as a service
- WhatsApp client as a service

```bash
cd backend
uv run main.py
```
