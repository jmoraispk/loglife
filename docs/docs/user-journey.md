# Life Bot User Journey

> **Scope:** From WhatsApp message to backend response

---

## Diagram

![User Flow](images/user_flow.png)

---

## High-level Flow

### Regular Message Flow

- **User sends a WhatsApp message** to the bot.
- **WhatsApp client** (`whatsapp-client/index.js`) receives the message and forwards it to the backend `/process` endpoint.
- **Flask backend** (`backend/main.py`) checks the message type:
  - **If VCARD format** (contact sharing): Routes to referral system
  - **If regular text**: Routes to `process_message(message, sender)`
- **Message router** (`backend/app/logic/process_message.py`) detects the intended command and dispatches to the appropriate helper.
- **Helpers & DB** perform reads/writes in SQLite (via `app/db/sqlite.py` and CRUD modules).
- **Backend returns a formatted reply**, and the WhatsApp client relays it back to the user.
- **Conversation continues** with the next incoming message.

### Contact Sharing Flow (Referral System)

- **User shares a contact** via WhatsApp (VCARD format).
- **WhatsApp client** forwards the VCARD data to the backend `/process` endpoint.
- **Flask backend** (`backend/main.py`) detects VCARD format and routes to contact/referral handlers:
  - `contact_detector.py`: Detects VCARD and extracts WhatsApp ID (WAID)
  - `referral_tracker.py`: Saves referral record to database
  - `whatsapp_sender.py`: Sends automated onboarding message to referred contact
- **Backend returns a confirmation message** to the referrer.
- **Referred contact receives** an automated welcome message with instructions.

---

## Decision Points and Steps

- **Is message VCARD format?** *(NEW)*
  - First check: determines if message is contact sharing vs. regular text
  - VCARD format: `BEGIN:VCARD\nVERSION:3.0\n...TEL;type=CELL;waid=...END:VCARD`
  - Files:
    - `app/helpers/contact_detector.py` - `is_contact_shared()`
  - If YES: Route to contact sharing flow
  - If NO: Route to regular command processing

- **Contact Sharing Flow** *(NEW)*
  - **Extract WhatsApp ID (WAID)**:
    - Pattern matching: `waid=(\d+)` from VCARD data
    - File: `app/helpers/contact_detector.py` - `extract_waid_from_contact()`
  - **Save referral record**:
    - Database: `referrals` table
    - Fields: `referrer_phone`, `referred_phone`, `referred_waid`, `status`
    - Duplicate prevention: checks existing referrals
    - File: `app/helpers/referral_tracker.py` - `save_referral()`
  - **Send onboarding message**:
    - Automated welcome message with quick start guide
    - Sent via WhatsApp API (external service on port 3000)
    - Files:
      - `app/helpers/whatsapp_sender.py` - `send_hi_message_to_contact()`
      - `app/helpers/api/whatsapp_api.py` - `send_whatsapp_message()`
  - **Return confirmation**:
    - Thank you message to referrer
    - Confirms referral was processed

- **Is user already in database?**
  - Checked when accessing goals or storing ratings.
  - If not found, a user record is created using the WhatsApp number or chat ID.
  - Files:
    - `app/db/CRUD/user_goals/get_user_goals.py`
    - `app/db/sqlite.py`

- **Detect command** (message parsing and routing)
  - Supported triggers in `process_message.py`:
    - `help`
    - `goals`
    - `add goal <emoji> <description>`
    - `rate <goal-number> <rating-1-3>`
    - `[digits like 123]` (rate all goals for today)
    - `week`
    - `lookback [n]`
  - File: `app/logic/process_message.py`

- **Is command valid?**
  - Invalid or unknown commands result in a help message or a usage hint.
  - Example responses:
    - "❌ Unrecognized message. Type 'help' to see available commands."
    - "❌ Usage: add goal 😴 Sleep by 9pm"

- **Execute command logic**
  - `goals`: `helpers/format_goals.py`
  - `add goal`: `helpers/add_goal.py`
  - `rate <n> <r>`: `helpers/rate_individual_goal.py`
  - `123...`: `helpers/handle_goal_ratings.py`
  - `week`: `helpers/format_week_summary.py`
  - `lookback [n]`: `helpers/look_back_summary.py`
  - Shared utilities: `app/utils/config.py` (icons/styles)
  - DB access: `app/db/sqlite.py`

- **Send formatted reply**
  - Helpers return plain-text responses (often wrapped with code blocks for alignment).
  - WhatsApp client posts that reply back to the originating chat.

- **Wait for next message**
  - The loop continues per user’s ongoing interaction.

---

## WhatsApp Client Responsibilities

- Subscribe to `message` events
- POST the message payload to the backend:
  - Regular messages: `{ message: msg.body, from: msg.from }`
  - Contact sharing: `{ message: <VCARD data>, from: msg.from }`
- Handle QR login on first run; persist session with `LocalAuth`
- On errors (network/backend), log and fail gracefully
- Expose `/send-message` endpoint for automated messages (referral system)

File: `whatsapp-client/index.js`

---

## Backend Components (Reference)

### Core Application
- `backend/main.py`: Flask entrypoint and routes (`/process`, `/emulator`)
- `app/logic/process_message.py`: Command routing
- `app/logic/helpers/*`: Command implementations
- `app/db/sqlite.py`: DB connection/init
- `backend/db/schema.sql`: Schema definition

### Referral System *(NEW)*
- `app/helpers/contact_detector.py`: VCARD detection and WAID extraction
- `app/helpers/referral_tracker.py`: Referral database operations
- `app/helpers/whatsapp_sender.py`: Automated onboarding messages
- `app/helpers/api/whatsapp_api.py`: WhatsApp API client integration

### Database Tables
- `user`: User information
- `user_goals`: Goal definitions
- `goal_ratings`: Daily ratings
- `referrals`: Referral tracking *(NEW)*

---

## Typical User Scenarios

### Goal Management Scenarios

- **New user says "goals"**
  - User record is created (if absent)
  - Empty goals list is returned or initial guidance is shown

- **User adds a goal**
  - `add goal 🏃 Exercise daily` creates an active goal with emoji and description

- **User rates the day**
  - `312` stores ratings for the three goals for today
  - `rate 2 3` updates a specific goal's rating

- **User requests summaries**
  - `week` returns current week header and daily statuses
  - `lookback 5` returns the last 5 days summary

### Referral Scenarios *(NEW)*

- **User shares a contact to refer someone**
  - User opens WhatsApp and shares contact with Life Bot
  - Backend detects VCARD format containing contact data
  - System extracts WAID (e.g., `923325727426`) from `TEL;type=CELL;waid=...`
  - Referral record saved: `referrer_phone` → `referred_phone`
  - Automated onboarding message sent to referred contact:
    ```
    🎯 Welcome to Life Bot!
    I'm your personal goal tracking assistant...
    [Quick start guide with commands]
    ```
  - Referrer receives confirmation:
    ```
    🎉 Thank you for the referral!
    You've successfully shared a contact with Life Bot...
    ```

- **Referred user receives welcome message**
  - New contact receives automated onboarding via WhatsApp
  - Message includes all available commands and examples
  - User can immediately start using bot (send `goals`, `add goal`, etc.)

- **Duplicate referral handling**
  - If user shares same contact twice, system detects duplicate
  - Referral count remains accurate (no double-counting)
  - Still sends confirmation to referrer

---

## Notes

- Error and validation messages guide users toward correct usage
- All data persists in SQLite; deleting `life_bot.db` resets state
- **Referral system requires**:
  - External WhatsApp API service running (default: `http://localhost:3000`)
  - Environment variable `WHATSAPP_API_URL` configured (optional, defaults to localhost)
  - WhatsApp client must expose `/send-message` endpoint for automated messages
- **VCARD format** is specific to WhatsApp contact sharing
- **Phone number format handling**: System converts WAID (e.g., `923325727426`) to local format (e.g., `03325727426`) for database storage
