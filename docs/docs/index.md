# Life Bot Backend Documentation

> **Framework:** Python, Flask
<!-- > **Docs generated for Material for MkDocs** -->

---

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Setup & Dependencies](#setup--dependencies)
- [API Endpoints](#api-endpoints)
- [Message Commands & Logic](#message-commands--logic)
- [Referral System](#referral-system)
- [Database Schema](#database-schema)
- [Directory Structure](#directory-structure)
- [Running](#running)

---

## Overview

This repository contains the backend for Life Bot, a messaging-based goal and habit tracker. Users interact with Life Bot via chat commands to add goals, rate their performance, and get summaries. The backend is implemented with Flask, uses a SQLite database, and exposes a `/process` endpoint for chat platforms (e.g., WhatsApp, Telegram) plus a `/emulator` route for a web-based emulator UI.

### Key Features
- **Goal Management**: Add, track, and rate personal goals
- **Performance Summaries**: View weekly summaries and historical lookbacks
- **Referral System**: Share Life Bot with others via contact sharing
- **WhatsApp Integration**: Automated onboarding messages for new referrals

---

## Architecture

- **Python 3.11+**
- **Flask** for the web/API interface
- **SQLite** for persistent storage
- **Modular logic**: commands are routed to helpers for clarity and maintainability
- **Material for MkDocs**: used for this documentation

![Architecture Diagram](images/architecture.png)

---

## Setup & Dependencies

Use `uv` to manage the environment and dependencies. No manual virtualenv activation is required.

1) From the `backend` directory, install and sync dependencies from `pyproject.toml`/`uv.lock`:
```sh
cd backend
uv sync
```

Main dependencies:
- `flask>=3.1.2` - Web framework
- `pytest>=8.4.2` - Testing framework
- `python-dotenv>=1.1.1` - Environment variable management
- `requests>=2.32.5` - HTTP library for WhatsApp API integration

---

## API Endpoints

### POST `/process`
- Processes chat messages and contact sharing delivered as JSON payloads.
- **Request JSON Structure (Regular Message):**
  ```json
  {
    "message": "<user message>",
    "from": "+1234567890"
  }
  ```
- **Request JSON Structure (Contact Sharing/VCARD):**
  ```json
  {
    "message": "BEGIN:VCARD\nVERSION:3.0\nN:;0332 5727426;;;\nFN:0332 5727426\nTEL;type=CELL;waid=923325727426:+92 332 5727426\nEND:VCARD",
    "from": "+1234567890"
  }
  ```
- **Response:**
  - String message (bot reply)
- **Behavior:**
  - Regular messages are processed through command routing
  - Contact sharing (VCARD format) triggers the referral system:
    - Extracts WhatsApp ID (WAID) from contact data
    - Saves referral record to database
    - Sends automated onboarding message to referred contact
    - Returns confirmation message to referrer

### GET `/emulator`
- Serves a web-based emulator UI (`index.html` in `templates/`).
- Used for developer testing without real chat platforms.

---

## Message Commands & Logic

Commands are routed via `process_message(message, sender)` in the backend.

| Command        | Description                                    | Example                    |
|:-------------- |:-----------------------------------------------|:---------------------------|
| `help`         | Show all commands / usage help                  | help                       |
| `goals`        | List your personal goals                        | goals                      |
| `add goal ...` | Add a new goal (with emoji/desc)                | add goal 🏃 Run daily       |
| `week`         | Show a summary for the current week             | week                       |
| `lookback [n]` | Show the last n days summary (default 7)        | lookback 5                 |
| `rate x y`     | Rate goal x with y (1=fail,2=partial,3=success) | rate 2 3                   |
| `[digits]`     | Rate all goals at once                          | 123                        |

Examples:
```text
add goal 🏃 Exercise daily
rate 1 3   # rate first goal as success
lookback 3 # show last 3 days
```

### Command Routing
- All major commands are processed in `process_message.py` with clear docstring for each.
- Error-checking and validation included for each message branch.

---

## Referral System

Life Bot includes a built-in referral system that allows users to share the bot with others through WhatsApp contact sharing.

### How It Works

1. **Contact Sharing Detection**
   - When a user shares a contact on WhatsApp, the message contains VCARD data
   - Backend detects VCARD format: `BEGIN:VCARD ... END:VCARD`
   - Extracts WhatsApp ID (WAID) from the contact data using pattern matching

2. **Referral Tracking**
   - Referral record is saved to the `referrals` table
   - Tracks referrer phone, referred phone, WAID, and status
   - Prevents duplicate referrals automatically

3. **Automated Onboarding**
   - Sends welcome message to the referred contact via WhatsApp API
   - Welcome message includes quick start guide and command examples
   - Helps new users get started immediately

### Technical Implementation

**Helper Modules:**
- `contact_detector.py` - Detects VCARD format and extracts WAID
- `referral_tracker.py` - Manages referral database operations
- `whatsapp_sender.py` - Sends automated messages via WhatsApp API
- `whatsapp_api.py` - Integration with external WhatsApp messaging service

**Environment Variables:**
- `WHATSAPP_API_URL` - Base URL for WhatsApp API (default: `http://localhost:3000`)

**Example VCARD Data:**
```text
BEGIN:VCARD
VERSION:3.0
N:;0332 5727426;;;
FN:0332 5727426
TEL;type=CELL;waid=923325727426:+92 332 5727426
END:VCARD
```

**API Integration:**
The backend sends POST requests to `/send-message` endpoint:
```json
{
  "number": "923325727426",
  "message": "Welcome to Life Bot! ..."
}
```

---

## Database Schema

Managed by SQLite (see `backend/db/schema.sql`). Auto-setup via `init_db()`.

### Tables

**user**
- Stores user information (name, phone, registration timestamp)
- Phone number is unique identifier

**user_goals**
- Stores individual goals with emoji and description
- Linked to users via `user_id` foreign key
- `is_active` flag for soft deletion

**goal_ratings**
- Stores daily ratings for each goal
- Rating scale: 1 (fail), 2 (partial), 3 (success)
- Linked to `user_goals` via `user_goal_id` foreign key

**referrals** *(new)*
- Tracks referral relationships between users
- Stores referrer phone, referred phone, and WhatsApp ID
- Status field for tracking referral lifecycle (`pending`, etc.)

```sql
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NULL,
    phone TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    goal_emoji TEXT NOT NULL,
    goal_description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
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
```

---

## Directory Structure

```text
backend/
  ├── app/
  │   ├── db/                # Database connection/init/CRUD
  │   ├── helpers/           # Utility functions
  │   │   ├── api/           # External API integrations
  │   │   │   └── whatsapp_api.py    # WhatsApp messaging API
  │   │   ├── contact_detector.py    # VCARD detection & parsing
  │   │   ├── referral_tracker.py    # Referral database operations
  │   │   └── whatsapp_sender.py     # Automated message sending
  │   ├── logic/             # Main bot logic & helpers
  │   │   ├── helpers/       # Command-specific logic
  │   │   └── process_message.py     # Message routing
  │   ├── routes/            # Flask blueprints and routes
  │   │   └── web.py         # Emulator route
  │   ├── templates/         # Web UI (emulator)
  │   │   └── index.html     # Emulator interface
  │   └── utils/             # Config, constants
  ├── db/                    # SQLite file and schema
  │   ├── life_bot.db        # Database file
  │   └── schema.sql         # Database schema
  ├── main.py                # Flask entrypoint
  └── tests/                 # Pytest-based unit/integration tests
```

---

## Running

### Environment Variables

Create a `.env` file in the `backend` directory (optional):
```sh
WHATSAPP_API_URL=http://localhost:3000  # WhatsApp API base URL (default: http://localhost:3000)
```

### Starting the Server

Run the app directly with `uv`:
```sh
cd backend
uv run main.py
```
- The server runs at `http://localhost:5000`.
- Emulator UI: open `http://localhost:5000/emulator`.

To stop the server: press `Ctrl+C` in the terminal.

For production, run the same command under a process manager like `systemd` (we use `systemd`).

### Prerequisites for Referral System

For the referral system to work, you need:
1. **WhatsApp Client Service** running on the configured URL (default: `http://localhost:3000`)
   - See `whatsapp-client/` directory for the WhatsApp client implementation
   - The service must expose a `/send-message` endpoint
2. **Environment variable** `WHATSAPP_API_URL` pointing to your WhatsApp client service

---

## References & Useful Links
- [Flask Documentation](https://flask.palletsprojects.com/)
- [MkDocs Material](https://squidfunk.github.io/mkdocs-material/)
- [Python 3.11+](https://www.python.org/downloads/)