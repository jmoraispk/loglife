# Life Bot User Journey

> **Scope:** From WhatsApp message to backend response

---

## Diagram

![User Flow](images/user_flow.png)

_Tip: Click the image to zoom._ 

---

## High-level Flow

### Regular Message Flow

- **User sends a WhatsApp message** to the bot.
- **WhatsApp client** (`whatsapp-client/index.js`) receives the message and forwards it to the backend `/process` endpoint.
- **Flask backend** (`backend/main.py`) checks the message type:
  - **If VCARD format** (contact sharing): Routes to referral system
  - **If regular text**: Routes to `process_message(message, sender)`
- **Backend returns a formatted reply**, and the WhatsApp client relays it back to the user.
- **Conversation continues** with the next incoming message.

### Contact Sharing Flow (Referral System)

- **User shares a contact** via WhatsApp (VCARD format).
- **WhatsApp client** forwards the VCARD data to the backend `/process` endpoint.
- **Flask backend** (`backend/main.py`) detects VCARD format and routes to contact/referral handlers
- **Backend returns a confirmation message** to the referrer.
- **Referred contact receives** an automated welcome message with instructions.

### Reminder Setup Flow *(NEW)*

- **User adds a goal** with `add goal 🏃 Exercise daily`.
- **Backend** (`helpers/add_goal.py`) processes the request:
  - Creates new goal in `user_goals` table
  - Detects/saves user timezone to `user` table (if new user)
  - Sets user state to `waiting_for_reminder_time` in `user_states` table
  - Stores goal ID in `temp_data` field
- **Backend asks for reminder time**: "⏰ What time should I remind you daily? (e.g., 18:00, 6 PM, 6pm)"
- **User responds with time** (e.g., "6 PM", "18:00", "6pm", or "6").
- **State check** in `process_message.py` detects user is in `waiting_for_reminder_time` state.
- **Time parser** (`helpers/time_parser.py`) parses and validates the time:
  - Supports multiple formats: 24-hour, 12-hour, short formats
  - Normalizes to HH:MM (24-hour format)
  - Returns error if invalid format
- **Backend updates goal** with reminder time in `user_goals` table.
- **Backend clears user state** back to `normal`.
- **Backend confirms**: "✅ Reminder set for 6:00 PM daily!"
- **Background cron job** (`cron/reminder.py`) continuously monitors database:
  - Polls every 15 seconds for active goals with reminder times
  - Compares current time (in user's timezone) with goal reminder times
  - Sends WhatsApp reminder message when time matches
  - Tracks sent reminders to prevent duplicates

---

## Decision Points and Steps

- **Is message VCARD format?**
  - First check: determines if message is contact sharing vs. regular text
  - VCARD format: `BEGIN:VCARD\nVERSION:3.0\n...TEL;type=CELL;waid=...END:VCARD`
  - Files:
    - `app/helpers/contact_detector.py` - `is_contact_shared()`
  - If YES: Route to contact sharing flow
  - If NO: Route to regular command processing

**Is message VCARD format?**

- **Check:** VCARD pattern (`BEGIN:VCARD...END:VCARD`)
- **Module:** `contact_detector.py` → `is_vcard()`
- **YES:** Route to Contact Sharing Flow
- **NO:** Route to Command Processing

### Contact Sharing Flow

**1. Extract WhatsApp ID**

- Pattern: `waid=(\d+)` from VCARD data
- Module: `contact_detector.py` → `extract_waid_from_vcard()`

**2. Process Referral**

- Convert WAID to local phone format
- Save to `referrals` table (with duplicate check)
- Module: `referral_tracker.py` → `process_referral()`

**3. Automated Onboarding**

- Send welcome message to referred contact
- Module: `whatsapp_sender.py` → `send_onboarding_msg()`
- Integration: `api/whatsapp_api.py` → `send_whatsapp_message()`

**4. Confirmation**

- Return success message to referrer

### Command Processing Flow

**1. User Verification**

- Check if user exists in database
- Create user record if needed (using phone number)
- Module: `db/CRUD/user_goals/get_user_goals.py`

**2. Command Detection**

- Parse message text for known commands
- Supported: `help`, `goals`, `add goal`, `rate`, `[digits]`, `week`, `lookback`
- Module: `logic/process_message.py`

**3. Command Validation**

- Validate command format and parameters
- Return error/usage hint if invalid
- Example: "❌ Usage: add goal 😴 Sleep by 9pm"

**4. Execute Command**

| Command | Module | Action |
|---------|--------|--------|
| `goals` | `format_goals.py` | Display user's goals |
| `add goal` | `add_goal.py` | Create new goal |
| `rate X Y` | `rate_individual_goal.py` | Rate specific goal |
| `123...` | `handle_goal_ratings.py` | Rate all goals |
| `week` | `format_week_summary.py` | Show week summary |
| `lookback N` | `look_back_summary.py` | Show N days history |

**5. Return Response**

- Format reply message
- Send back to WhatsApp client
- Client relays to user

---

## WhatsApp Client Integration

The WhatsApp client bridges WhatsApp Web and the backend. See [WhatsApp Client](whatsapp-client.md) for complete documentation.

**Key Responsibilities:**

- Listen for incoming WhatsApp messages
- Forward messages to backend `/process` endpoint
- Relay backend responses to users
- Expose `/send-message` API for automated messages
- Manage WhatsApp session persistence

**Message Format:**
```json
{
  "message": "<text or VCARD data>",
  "from": "<phone number>"
}
```

## Backend Components (Reference)

### Core Application
- `backend/main.py`: Flask entrypoint and routes (`/process`, `/emulator`)
- `app/logic/process_message.py`: Command routing *(UPDATED - now includes state checking)*
- `app/logic/helpers/*`: Command implementations
- `app/db/sqlite.py`: DB connection/init
- `backend/db/schema.sql`: Schema definition *(UPDATED - new tables and fields)*

### Reminder System *(NEW)*
- `app/helpers/state_manager.py`: Conversation state management
- `app/helpers/time_parser.py`: Flexible time format parsing
- `app/helpers/timezone_helper.py`: Timezone utilities
- `app/helpers/user_timezone.py`: User timezone detection and storage
- `app/logic/helpers/add_goal.py`: Goal creation with reminder setup *(UPDATED)*
- `cron/reminder.py`: Background cron job for sending reminders

### Referral System
- `app/helpers/contact_detector.py`: VCARD detection and WAID extraction
- `app/helpers/referral_tracker.py`: Referral database operations
- `app/helpers/whatsapp_sender.py`: Automated onboarding messages
- `app/helpers/api/whatsapp_api.py`: WhatsApp API client integration

### Database Tables
- `user`: User information (with `timezone` field) *(UPDATED)*
- `user_goals`: Goal definitions (with `reminder_time` field) *(UPDATED)*
- `goal_ratings`: Daily ratings
- `referrals`: Referral tracking
- `user_states`: Conversation state management *(NEW)*

---

## Typical User Scenarios

### Goal Management

- **New user says "goals"**
  - User record is created (if absent)
  - Timezone is automatically detected and saved
  - Empty goals list is returned or initial guidance is shown

- **User adds a goal** *(UPDATED - now multi-step)*
  - User: `add goal 🏃 Exercise daily`
  - Bot creates goal and asks: "⏰ What time should I remind you daily?"
  - System sets state to `waiting_for_reminder_time`
  - User: `6 PM` (or `18:00`, `6pm`, `6:00 PM`, `6`)
  - Bot parses time, saves reminder, and confirms: "✅ Reminder set for 6:00 PM daily!"
  - System clears state back to `normal`
  - Goal is now active with daily reminders

**Scenario 3: Rating Goals**
```
User → "312" (rate all goals)
Bot  → Stores ratings for today: goal 1=3, goal 2=1, goal 3=2

User → "rate 2 3" (rate specific goal)
Bot  → Updates goal #2 rating to 3
```

### Reminder Scenarios *(NEW)*

- **User receives daily reminder**
  - Background cron job (`reminder.py`) checks database every 15 seconds
  - When current time (in user's timezone) matches goal's reminder time:
    - Bot sends: "⏰ Reminder: 🏃 Exercise daily"
    - Reminder is tracked to prevent duplicates
  - User can then rate their goal or take action

- **Invalid time format**
  - If user enters invalid time (e.g., "invalid"), system responds:
    - "❌ Invalid time format. Please use formats like: 18:00, 6 PM, 6pm, or 6"
  - User remains in `waiting_for_reminder_time` state to retry

- **Timezone handling**
  - System automatically detects user timezone on first interaction
  - Reminders sent based on user's local time, not server time
  - Supports all IANA timezones

### Referral Scenarios *(NEW)*

User → "lookback 5"
Bot  → Shows last 5 days history
```

### Referral System

**Scenario 5: Sharing a Contact**
```
User shares contact → VCARD data sent to bot
Bot detects VCARD → Extracts WAID (e.g., 923325727426)
Bot saves referral → referrer_phone → referred_phone
Bot sends welcome → Automated onboarding to referred contact
Bot confirms → "🎉 Thank you for the referral!"
```

**Scenario 6: Referred User Onboarding**
```
New contact receives → "🎯 Welcome to Life Bot! ..."
Message includes → All commands and quick start guide
User can start → "goals", "add goal", etc.
```

**Scenario 7: Duplicate Referral**
```
User shares same contact again → System detects duplicate
Bot skips duplicate save → Referral count stays accurate
Bot still confirms → Success message to referrer
```

---

## Technical Notes

**Data Persistence:**

- SQLite database stores all data
- Deleting `life_bot.db` resets all state

**VCARD Format:**

- WhatsApp-specific contact sharing format
- Contains: `TEL;type=CELL;waid=<number>`
- System extracts WAID and converts to local format
