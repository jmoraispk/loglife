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

---

## Decision Points and Steps

### Message Type Detection

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

**File:** `whatsapp-client/index.js`

---

## Typical User Scenarios

### Goal Management

**Scenario 1: New User**
```
User → "goals"
Bot  → Creates user record
Bot  → Shows empty list or guidance
```

**Scenario 2: Adding Goals**
```
User → "add goal 🏃 Exercise daily"
Bot  → Creates active goal with emoji and description
Bot  → Confirms addition
```

**Scenario 3: Rating Goals**
```
User → "312" (rate all goals)
Bot  → Stores ratings for today: goal 1=3, goal 2=1, goal 3=2

User → "rate 2 3" (rate specific goal)
Bot  → Updates goal #2 rating to 3
```

**Scenario 4: View Summaries**
```
User → "week"
Bot  → Shows current week with daily status

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