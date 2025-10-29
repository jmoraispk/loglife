# Backend Code Architecture

## Overview
This diagram shows the complete backend architecture for the Life Bot application, including the recent additions of **Contact Sharing** and **Referral Tracking** features.

## Key Features

### 1. Contact Sharing & Referral System (NEW)
- **VCARD Detection**: Automatically detects when users share contacts via WhatsApp
- **WAID Extraction**: Extracts WhatsApp ID from contact data
- **Referral Tracking**: Saves referral relationships in database
- **Auto-Onboarding**: Automatically sends welcome message to referred contacts

### 2. Goal Management
- Track personal goals with emojis and descriptions
- Rate goals individually or in bulk (1-3 scale)
- View weekly summaries and lookback reports

### 3. Database Schema
- `user`: User information
- `user_goals`: Goal definitions
- `goal_ratings`: Daily goal ratings
- `referrals`: Referral tracking (NEW)

## Architecture Flow

### Contact Sharing Flow (NEW)
1. User shares contact via WhatsApp → VCARD format received
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
5. Returns formatted response

## Diagram

```mermaid
graph TB
    subgraph external["External Interfaces"]
        whatsapp["WhatsApp/Telegram<br/>Messaging Platform"]
        browser["Web Browser<br/>Emulator UI"]
        whatsapp_api_ext["External WhatsApp API<br/>(Port 3000)"]
    end

    subgraph flask["Flask Application (main.py)"]
        emulator["/emulator<br/>GET Endpoint"]
        process["/process<br/>POST Endpoint<br/>• Message Router<br/>• Contact Detector"]
    end

    subgraph contact_referral["Contact & Referral System (app/helpers/)"]
        contact_detector["contact_detector.py<br/>• VCARD Detection<br/>• WAID Extraction"]
        referral_tracker["referral_tracker.py<br/>• Save Referrals<br/>• Get Referral Count"]
        whatsapp_sender["whatsapp_sender.py<br/>• Send Onboarding Message"]
        whatsapp_api["api/whatsapp_api.py<br/>• send_whatsapp_message()"]
    end

    subgraph logic["Message Processing (app/logic/)"]
        process_msg["process_message.py<br/>Command Router<br/>• goals, add goal<br/>• rate, week, lookback<br/>• help"]
    end

    subgraph helpers["Goal Management Helpers<br/>(app/logic/helpers/)"]
        format_goals["format_goals.py"]
        add_goal["add_goal.py"]
        handle_ratings["handle_goal_ratings.py"]
        rate_goal["rate_individual_goal.py"]
        week_summary["format_week_summary.py"]
        lookback["look_back_summary.py"]
        show_help["show_help.py"]
    end

    subgraph db_layer["Database Layer (app/db/)"]
        sqlite["sqlite.py<br/>DB Connection Manager<br/>• init_db()<br/>• get_db()<br/>• close_db()"]
    end

    subgraph crud["CRUD Operations<br/>(app/db/CRUD/)"]
        get_goals["user_goals/<br/>get_user_goals.py"]
    end

    subgraph schema["Database Schema (db/)"]
        schema_sql["schema.sql<br/>• user<br/>• user_goals<br/>• goal_ratings<br/>• referrals"]
        life_bot_db["life_bot.db<br/>SQLite Database"]
    end

    subgraph templates["Templates (app/templates/)"]
        index["index.html<br/>Emulator Interface"]
    end

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
    contact_detector -->|"extract WAID"| referral_tracker
    referral_tracker -->|"save referral"| sqlite
    referral_tracker -->|"trigger onboarding"| whatsapp_sender
    whatsapp_sender -->|"uses"| whatsapp_api
    whatsapp_api -->|"HTTP POST"| whatsapp_api_ext
    
    %% Message processing flow
    process_msg -->|"calls"| helpers
    
    %% Goal helpers flow
    helpers -->|"queries"| get_goals
    helpers -->|"reads config"| config_py
    
    %% Database flow
    get_goals -->|"queries"| sqlite
    helpers -->|"saves ratings"| sqlite
    sqlite -->|"connects to"| life_bot_db
    life_bot_db -.->|"schema defined by"| schema_sql

    %% Styling
    style external fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style flask fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    style contact_referral fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    style logic fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    style helpers fill:#f0f8f0,stroke:#1b5e20,stroke-width:1px
    style db_layer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style crud fill:#fff8f0,stroke:#e65100,stroke-width:1px
    style schema fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style templates fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    style config fill:#f1f8e9,stroke:#33691e,stroke-width:2px
```

## Component Details

### Contact & Referral System (Yellow Box - NEW)
| Component | Description | Key Functions |
|-----------|-------------|---------------|
| `contact_detector.py` | Detects VCARD format and extracts WhatsApp IDs | `is_contact_shared()`, `extract_waid_from_contact()` |
| `referral_tracker.py` | Manages referral database operations | `save_referral()`, `get_referral_count()` |
| `whatsapp_sender.py` | Sends onboarding messages to new referrals | `send_hi_message_to_contact()` |
| `api/whatsapp_api.py` | External WhatsApp API client | `send_whatsapp_message()` |

### Flask Application (Purple Box)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/emulator` | GET | Serves web-based emulator interface |
| `/process` | POST | Main webhook endpoint for message processing and contact detection |

### Message Processing (Green Box)
| Component | Description |
|-----------|-------------|
| `process_message.py` | Routes commands to appropriate handlers (goals, rate, week, lookback, help, add goal) |

### Goal Management Helpers (Light Green Box)
| Component | Purpose |
|-----------|---------|
| `format_goals.py` | Display user's goals in formatted list |
| `add_goal.py` | Add new goals with emoji and description |
| `handle_goal_ratings.py` | Process bulk goal ratings (e.g., "123") |
| `rate_individual_goal.py` | Rate single goal (e.g., "rate 2 3") |
| `format_week_summary.py` | Generate weekly goal summary |
| `look_back_summary.py` | Show historical goal performance |
| `show_help.py` | Display help message with commands |

### Database Layer (Orange Box)
| Component | Description |
|-----------|-------------|
| `sqlite.py` | Database connection manager with init, get, and close functions |
| CRUD Operations | User goals queries and operations |

### Database Schema
| Table | Description | New? |
|-------|-------------|------|
| `user` | User information (id, name, phone) | No |
| `user_goals` | Goal definitions with emoji and description | No |
| `goal_ratings` | Daily goal ratings (1-3 scale) | No |
| `referrals` | Referral tracking (referrer → referred) | **✓ Yes** |

## Technology Stack
- **Backend Framework**: Flask (Python)
- **Database**: SQLite
- **External API**: WhatsApp API (Node.js service on port 3000)
- **Message Format**: VCARD for contact sharing
- **Deployment**: Python with dotenv for configuration

