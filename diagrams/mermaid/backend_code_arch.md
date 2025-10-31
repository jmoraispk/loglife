# Backend Code Architecture

## Overview
This diagram shows the complete backend architecture for the Life Bot application, including the recent additions of **Contact Sharing**, **Referral Tracking**, and **Reminder System** features.

<<<<<<< HEAD
**Recent Refactoring (Code Quality):**
- Route modularization: Endpoints moved to Blueprint modules (`app/routes/web.py`, `app/routes/webhook.py`)
- VCARD processing moved: Logic migrated from `webhook.py` to `process_message.py` for cleaner separation of concerns
- Data access module structure: Added `__init__.py` files for unified import interface (`app/db/data_access/`)
- Function naming improvements (VCARD-related functions)
- Message centralization in `app/utils/messages.py`
- Type hints modernization (dict/list instead of Dict/List)
- Directory rename: CRUD → data_access

=======
>>>>>>> 8f0704f (updated backend code arch and replaced it's drawio diagram with mermaid diagram)
## Key Features

### 1. Reminder System (NEW)
- **Daily Reminders**: Automated WhatsApp reminders for goals at scheduled times
- **Time Parsing**: Flexible time input (18:00, 6 PM, 6pm, 6)
- **Timezone Support**: Timezone-aware reminders using user's local time
- **State Management**: Multi-step conversation flow for setting reminder times
- **Cron Job**: Background script (`reminder.py`) that continuously checks and sends reminders

### 2. Contact Sharing & Referral System
- **VCARD Detection**: Automatically detects when users share contacts via WhatsApp
- **WAID Extraction**: Extracts WhatsApp ID from contact data
- **Referral Tracking**: Saves referral relationships in database
- **Auto-Onboarding**: Automatically sends welcome message to referred contacts

### 3. Goal Management
- Track personal goals with emojis and descriptions
- Rate goals individually or in bulk (1-3 scale)
- View weekly summaries and lookback reports
- Add goals with reminder times

### 4. Database Schema
- `user`: User information with timezone
- `user_goals`: Goal definitions with reminder_time (NEW)
- `goal_ratings`: Daily goal ratings
- `referrals`: Referral tracking
- `user_states`: Conversation state management (NEW)

## Architecture Flow

### Reminder Flow (NEW)
1. **Goal Creation**: User adds goal with "add goal 😴 Sleep by 9pm"
2. **State Set**: System saves goal and sets user state to 'waiting_for_reminder_time'
3. **Time Input**: User provides time (e.g., "18:00", "6 PM")
4. **Time Parsing**: `time_parser.py` normalizes time to HH:MM format
5. **DB Update**: Goal's reminder_time field updated, state cleared
6. **Background Job**: `reminder.py` (cron) continuously polls database every 15 seconds
7. **Time Check**: Compares current time (in user's timezone) with goal's reminder_time
8. **Send Reminder**: WhatsApp message sent via API when time matches
9. **Duplicate Prevention**: Tracks sent reminders to avoid duplicates

### Contact Sharing Flow
1. User shares contact via WhatsApp → VCARD format received
<<<<<<< HEAD
2. `webhook.py` `/process` endpoint receives message
3. `process_message.py` detects VCARD format
4. Extracts WAID (WhatsApp ID) from contact data
5. Saves referral to database (referrer → referred)
6. Sends onboarding message to referred contact via WhatsApp API
7. Returns confirmation message to referrer

### Regular Message Flow
1. User sends text message → `webhook.py` `/process` endpoint
2. Routes to `process_message.py` command parser
3. Executes appropriate helper function (goals, rate, week, etc.)
4. Queries database via data access operations
=======
2. `/process` endpoint detects VCARD format
3. Extracts WAID (WhatsApp ID) from contact data
4. Saves referral to database (referrer → referred)
5. Sends onboarding message to referred contact via WhatsApp API
6. Returns confirmation message to referrer

### Regular Message Flow
1. User sends text message → `/process` endpoint
2. Routes to `process_message.py` command parser
3. Executes appropriate helper function (goals, rate, week, etc.)
4. Queries database via CRUD operations
>>>>>>> 8f0704f (updated backend code arch and replaced it's drawio diagram with mermaid diagram)
5. Returns formatted response

## Diagram

```mermaid
graph TB
    subgraph external["External Interfaces"]
        whatsapp["WhatsApp/Telegram<br/>Messaging Platform"]
        browser["Web Browser<br/>Emulator UI"]
        whatsapp_api_ext["External WhatsApp API<br/>(Port 3000)"]
    end

<<<<<<< HEAD
    subgraph flask["Flask Application"]
        main["main.py<br/>Application Entry Point<br/>• Blueprint Registration<br/>• DB Initialization"]
        
        subgraph routes["Route Modules (app/routes/)"]
            web_routes["web.py<br/>/emulator<br/>GET Endpoint"]
            webhook_routes["webhook.py<br/>/process<br/>POST Endpoint<br/>• Clean Request Handler"]
        end
=======
    subgraph flask["Flask Application (main.py)"]
        emulator["/emulator<br/>GET Endpoint"]
        process["/process<br/>POST Endpoint<br/>• Message Router<br/>• Contact Detector"]
>>>>>>> 8f0704f (updated backend code arch and replaced it's drawio diagram with mermaid diagram)
    end

    subgraph reminder_system["Reminder System (NEW)"]
        reminder_cron["cron/reminder.py<br/>• Poll Database (15s)<br/>• Timezone Aware<br/>• Send Reminders<br/>• Duplicate Prevention"]
        state_manager["helpers/state_manager.py<br/>• set_user_state()<br/>• get_user_state()<br/>• clear_user_state()"]
        time_parser["helpers/time_parser.py<br/>• parse_reminder_time()<br/>• format_time_for_display()"]
        timezone_helper["helpers/timezone_helper.py<br/>helpers/user_timezone.py<br/>• Timezone Detection<br/>• Timezone Storage"]
    end

    subgraph contact_referral["Contact & Referral System"]
        contact_detector["contact_detector.py<br/>• VCARD Detection<br/>• WAID Extraction"]
        referral_tracker["referral_tracker.py<br/>• Save Referrals<br/>• Get Referral Count"]
        whatsapp_sender["whatsapp_sender.py<br/>• Send Onboarding Message"]
        whatsapp_api["api/whatsapp_api.py<br/>• send_whatsapp_message()"]
    end

    subgraph logic["Message Processing (app/logic/)"]
<<<<<<< HEAD
        process_msg["process_message.py<br/>Command Router<br/>• VCARD Detection & Processing<br/>• goals, add goal<br/>• rate, week, lookback<br/>• help"]
=======
        process_msg["process_message.py<br/>Command Router<br/>• goals, add goal<br/>• rate, week, lookback<br/>• help"]
>>>>>>> 8f0704f (updated backend code arch and replaced it's drawio diagram with mermaid diagram)
    end

    subgraph helpers["Goal Management Helpers<br/>(app/logic/helpers/)"]
        format_goals["format_goals.py"]
        add_goal["add_goal.py<br/>• add_goal()<br/>• set_reminder_time() (NEW)"]
        handle_ratings["handle_goal_ratings.py"]
        rate_goal["rate_individual_goal.py"]
        week_summary["format_week_summary.py"]
        lookback["look_back_summary.py"]
        show_help["show_help.py"]
    end

    subgraph db_layer["Database Layer (app/db/)"]
        sqlite["sqlite.py<br/>DB Connection Manager<br/>• init_db()<br/>• get_db()<br/>• close_db()"]
    end

<<<<<<< HEAD
<<<<<<< HEAD
    subgraph crud["Data Access<br/>(app/db/data_access/)"]
        data_access_init["__init__.py<br/>Unified Interface"]
        get_goals["user_goals/<br/>__init__.py<br/>get_user_goals.py"]
=======
    subgraph crud["CRUD Operations<br/>(app/db/CRUD/)"]
=======
    subgraph crud["Data Access<br/>(app/db/data_access/)"]
>>>>>>> 53ae9b0 (Refactor backend, add Twilio number docs, update docs, and remove @c.us handling from WhatsApp numbers)
        get_goals["user_goals/<br/>get_user_goals.py"]
>>>>>>> 8f0704f (updated backend code arch and replaced it's drawio diagram with mermaid diagram)
    end

    subgraph schema["Database Schema (db/)"]
        schema_sql["schema.sql<br/>• user (+ timezone)<br/>• user_goals (+ reminder_time)<br/>• goal_ratings<br/>• referrals<br/>• user_states (NEW)"]
        life_bot_db["life_bot.db<br/>SQLite Database"]
    end

    subgraph templates["Templates (app/templates/)"]
        index["index.html<br/>Emulator Interface"]
    end

<<<<<<< HEAD
    subgraph utils["Utilities (app/utils/)"]
        config_py["config.py<br/>Goals & Styles Config"]
        messages_py["messages.py<br/>User-facing Messages<br/>& Text Constants"]
    end

    %% External connections
    browser -->|"GET Request"| web_routes
    whatsapp -->|"JSON POST<br/>{message, from}"| webhook_routes
    
    %% Flask routing
    main -->|"registers"| routes
    web_routes -->|"renders"| index
    
    %% Process endpoint flow
    webhook_routes -->|"routes to"| process_msg
    
    %% Contact/Referral flow
    process_msg -->|"if VCARD"| contact_detector
=======
    subgraph config["Configuration (app/utils/)"]
        config_py["config.py<br/>Goals & Styles Config"]
    end

    %% External connections
    browser -->|"GET Request"| emulator
    whatsapp -->|"JSON POST<br/>{message, from}"| process
    
    %% Flask routing
    emulator -->|"renders"| index
    
    %% Process endpoint flow
    process -->|"if VCARD"| contact_detector
    process -->|"else"| process_msg
    
    %% Contact/Referral flow
>>>>>>> 8f0704f (updated backend code arch and replaced it's drawio diagram with mermaid diagram)
    contact_detector -->|"extract WAID"| referral_tracker
    referral_tracker -->|"save referral"| sqlite
    referral_tracker -->|"trigger onboarding"| whatsapp_sender
    whatsapp_sender -->|"uses"| whatsapp_api
    whatsapp_api -->|"HTTP POST"| whatsapp_api_ext
    
    %% Message processing flow with state management
    process_msg -->|"check state"| state_manager
    process_msg -->|"if waiting_for_reminder_time"| add_goal
    process_msg -->|"else normal"| helpers
    
    %% Reminder flow
    add_goal -->|"set state"| state_manager
    add_goal -->|"parse time"| time_parser
    add_goal -->|"detect timezone"| timezone_helper
    add_goal -->|"save goal & reminder"| sqlite
    state_manager -->|"queries/updates"| sqlite
    
    %% Reminder cron flow
    reminder_cron -->|"polls every 15s"| sqlite
    reminder_cron -->|"uses timezone"| timezone_helper
    reminder_cron -->|"sends message"| whatsapp_api
    whatsapp_api -->|"HTTP POST"| whatsapp_api_ext
    
    %% Goal helpers flow
<<<<<<< HEAD
    helpers -->|"queries"| data_access_init
    data_access_init -->|"imports from"| get_goals
    helpers -->|"reads config"| config_py
    helpers -->|"uses messages"| messages_py
    webhook_routes -->|"uses messages"| messages_py
=======
    helpers -->|"queries"| get_goals
    helpers -->|"reads config"| config_py
>>>>>>> 8f0704f (updated backend code arch and replaced it's drawio diagram with mermaid diagram)
    
    %% Database flow
    get_goals -->|"queries"| sqlite
    helpers -->|"saves ratings"| sqlite
    sqlite -->|"connects to"| life_bot_db
    life_bot_db -.->|"schema defined by"| schema_sql

    %% Styling
    style external fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style flask fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    style reminder_system fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style contact_referral fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    style logic fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    style helpers fill:#f0f8f0,stroke:#1b5e20,stroke-width:1px
    style db_layer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style crud fill:#fff8f0,stroke:#e65100,stroke-width:1px
    style schema fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style templates fill:#fce4ec,stroke:#880e4f,stroke-width:2px
<<<<<<< HEAD
    style utils fill:#f1f8e9,stroke:#33691e,stroke-width:2px
=======
    style config fill:#f1f8e9,stroke:#33691e,stroke-width:2px
>>>>>>> 8f0704f (updated backend code arch and replaced it's drawio diagram with mermaid diagram)
```

## Component Details

### Reminder System (Green Box - NEW)
| Component | Description | Key Functions |
|-----------|-------------|---------------|
| `cron/reminder.py` | Background cron job that polls database and sends reminders | `fetch_active_goals()`, `should_send()`, `send_reminder()`, `get_current_hhmm_in_timezone()` |
| `helpers/state_manager.py` | Manages conversation state for multi-step flows | `set_user_state()`, `get_user_state()`, `clear_user_state()` |
| `helpers/time_parser.py` | Parses and formats time in multiple formats | `parse_reminder_time()`, `format_time_for_display()` |
| `helpers/timezone_helper.py`<br/>`helpers/user_timezone.py` | Handles timezone detection and storage | `detect_and_save_user_timezone()`, `update_existing_user_timezone()` |
| `logic/helpers/add_goal.py` | Extended with reminder functionality | `add_goal()`, `set_reminder_time()` |

**Running the Reminder System:**
```bash
# From backend directory
uv run .\cron\reminder.py
```

### Contact & Referral System (Yellow Box)
| Component | Description | Key Functions |
|-----------|-------------|---------------|
<<<<<<< HEAD
| `contact_detector.py` | Detects VCARD format and extracts WhatsApp IDs | `is_vcard()`, `extract_waid_from_vcard()` |
| `referral_tracker.py` | Manages referral database operations and workflow | `process_referral()`, `save_referral()`, `get_referral_count()` |
| `whatsapp_sender.py` | Sends onboarding messages to new referrals | `send_onboarding_msg()` |
<<<<<<< HEAD
| `api/whatsapp_api.py` | External WhatsApp API client | `send_whatsapp_message()` |

### Flask Application (Purple Box)
| Component | Description |
|-----------|-------------|
| `main.py` | Application entry point that initializes the Flask app, registers blueprints (web_bp, webhook_bp), and handles database initialization |
| `app/routes/web.py` | Web routes blueprint containing `/emulator` GET endpoint for the emulator interface |
| `app/routes/webhook.py` | Webhook routes blueprint containing `/process` POST endpoint - clean request handler that routes all messages to process_message.py |
=======
| `contact_detector.py` | Detects VCARD format and extracts WhatsApp IDs | `is_contact_shared()`, `extract_waid_from_contact()` |
| `referral_tracker.py` | Manages referral database operations | `save_referral()`, `get_referral_count()` |
| `whatsapp_sender.py` | Sends onboarding messages to new referrals | `send_hi_message_to_contact()` |
=======
>>>>>>> 53ae9b0 (Refactor backend, add Twilio number docs, update docs, and remove @c.us handling from WhatsApp numbers)
| `api/whatsapp_api.py` | External WhatsApp API client | `send_whatsapp_message()` |

### Flask Application (Purple Box)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/emulator` | GET | Serves web-based emulator interface |
| `/process` | POST | Main webhook endpoint for message processing and contact detection |
>>>>>>> 8f0704f (updated backend code arch and replaced it's drawio diagram with mermaid diagram)

### Message Processing (Light Green Box)
| Component | Description |
|-----------|-------------|
<<<<<<< HEAD
| `process_message.py` | Main message processor that detects VCARD contacts and routes commands to appropriate handlers (goals, rate, week, lookback, help, add goal) |
=======
| `process_message.py` | Routes commands to appropriate handlers (goals, rate, week, lookback, help, add goal) |
>>>>>>> 8f0704f (updated backend code arch and replaced it's drawio diagram with mermaid diagram)

### Goal Management Helpers (Light Green Box)
| Component | Purpose |
|-----------|---------|
| `format_goals.py` | Display user's goals in formatted list |
| `add_goal.py` | **UPDATED:** Add new goals with emoji and description, set state to wait for reminder time, and handle reminder time setting via `set_reminder_time()` |
| `handle_goal_ratings.py` | Process bulk goal ratings (e.g., "123") |
| `rate_individual_goal.py` | Rate single goal (e.g., "rate 2 3") |
| `format_week_summary.py` | Generate weekly goal summary |
| `look_back_summary.py` | Show historical goal performance |
| `show_help.py` | Display help message with commands |

### Database Layer (Orange Box)
| Component | Description |
|-----------|-------------|
| `sqlite.py` | Database connection manager with init, get, and close functions |
<<<<<<< HEAD
<<<<<<< HEAD
| Data Access | Unified module interface with `__init__.py` files for clean imports. Contains user goals queries and operations organized by domain |
=======
| Data Access | User goals queries and operations |
>>>>>>> 53ae9b0 (Refactor backend, add Twilio number docs, update docs, and remove @c.us handling from WhatsApp numbers)

### Utilities (Light Green Box)
| Component | Description |
|-----------|-------------|
| `config.py` | Goals configuration and styling constants |
| `messages.py` | **Centralized user-facing messages** (welcome, help, errors, success messages). Improves maintainability and simplifies future translation/localization. |
=======
| CRUD Operations | User goals queries and operations |
>>>>>>> 8f0704f (updated backend code arch and replaced it's drawio diagram with mermaid diagram)

### Database Schema
| Table | Description | Changes |
|-------|-------------|---------|
| `user` | User information (id, name, phone, **timezone**) | **NEW:** timezone field |
| `user_goals` | Goal definitions with emoji, description, and **reminder_time** | **NEW:** reminder_time field |
| `goal_ratings` | Daily goal ratings (1-3 scale) | No changes |
| `referrals` | Referral tracking (referrer → referred) | No changes |
| `user_states` | Conversation state management (user_phone, state, temp_data) | **✓ NEW TABLE** |

## Technology Stack
- **Backend Framework**: Flask (Python)
- **Database**: SQLite with state management
- **External API**: WhatsApp API (Node.js service on port 3000)
- **Message Format**: VCARD for contact sharing
- **Deployment**: Python with dotenv for configuration
- **Background Jobs**: Reminder cron job (runs with `uv run .\cron\reminder.py`)
- **Timezone Support**: Python zoneinfo for timezone-aware reminders
- **State Management**: Multi-step conversation flows with database-backed state

## How to Run the Complete System

### 1. Start the Flask Backend
```bash
cd backend
python main.py
```

### 2. Start the WhatsApp API Service
```bash
cd whatsapp-client
npm start
```

### 3. Start the Reminder Service (NEW)
```bash
cd backend
uv run .\cron\reminder.py
```

This will start the reminder cron job that polls the database every 15 seconds and sends reminders to users based on their configured times and timezones.

