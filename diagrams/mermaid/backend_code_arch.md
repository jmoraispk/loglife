# Backend Code Architecture

## Overview
This diagram shows the complete backend architecture for the Life Bot application, including the recent additions of **Contact Sharing** and **Referral Tracking** features.

**Recent Refactoring (Code Quality):**
- Route modularization: Endpoints moved to Blueprint modules (`app/routes/web.py`, `app/routes/webhook.py`)
- VCARD processing moved: Logic migrated from `webhook.py` to `process_message.py` for cleaner separation of concerns
- Data access module structure: Added `__init__.py` files for unified import interface (`app/db/data_access/`)
- Function naming improvements (VCARD-related functions)
- Message centralization in `app/utils/messages.py`
- Type hints modernization (dict/list instead of Dict/List)
- Directory rename: CRUD → data_access

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
5. Returns formatted response

## Diagram

```mermaid
graph TB
    subgraph external["External Interfaces"]
        whatsapp["WhatsApp/Telegram<br/>Messaging Platform"]
        browser["Web Browser<br/>Emulator UI"]
        whatsapp_api_ext["External WhatsApp API<br/>(Port 3000)"]
    end

    subgraph flask["Flask Application"]
        main["main.py<br/>Application Entry Point<br/>• Blueprint Registration<br/>• DB Initialization"]
        
        subgraph routes["Route Modules (app/routes/)"]
            web_routes["web.py<br/>/emulator<br/>GET Endpoint"]
            webhook_routes["webhook.py<br/>/process<br/>POST Endpoint<br/>• Clean Request Handler"]
        end
    end

    subgraph contact_referral["Contact & Referral System (app/helpers/)"]
        contact_detector["contact_detector.py<br/>• VCARD Detection<br/>• WAID Extraction"]
        referral_tracker["referral_tracker.py<br/>• Save Referrals<br/>• Get Referral Count"]
        whatsapp_sender["whatsapp_sender.py<br/>• Send Onboarding Message"]
        whatsapp_api["api/whatsapp_api.py<br/>• send_whatsapp_message()"]
    end

    subgraph logic["Message Processing (app/logic/)"]
        process_msg["process_message.py<br/>Command Router<br/>• VCARD Detection & Processing<br/>• goals, add goal<br/>• rate, week, lookback<br/>• help"]
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

    subgraph crud["Data Access<br/>(app/db/data_access/)"]
        data_access_init["__init__.py<br/>Unified Interface"]
        get_goals["user_goals/<br/>__init__.py<br/>get_user_goals.py"]
    end

    subgraph schema["Database Schema (db/)"]
        schema_sql["schema.sql<br/>• user<br/>• user_goals<br/>• goal_ratings<br/>• referrals"]
        life_bot_db["life_bot.db<br/>SQLite Database"]
    end

    subgraph templates["Templates (app/templates/)"]
        index["index.html<br/>Emulator Interface"]
    end

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
    contact_detector -->|"extract WAID"| referral_tracker
    referral_tracker -->|"save referral"| sqlite
    referral_tracker -->|"trigger onboarding"| whatsapp_sender
    whatsapp_sender -->|"uses"| whatsapp_api
    whatsapp_api -->|"HTTP POST"| whatsapp_api_ext
    
    %% Message processing flow
    process_msg -->|"calls"| helpers
    
    %% Goal helpers flow
    helpers -->|"queries"| data_access_init
    data_access_init -->|"imports from"| get_goals
    helpers -->|"reads config"| config_py
    helpers -->|"uses messages"| messages_py
    webhook_routes -->|"uses messages"| messages_py
    
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
    style utils fill:#f1f8e9,stroke:#33691e,stroke-width:2px
```

## Component Details

### Contact & Referral System (Yellow Box - NEW)
| Component | Description | Key Functions |
|-----------|-------------|---------------|
| `contact_detector.py` | Detects VCARD format and extracts WhatsApp IDs | `is_vcard()`, `extract_waid_from_vcard()` |
| `referral_tracker.py` | Manages referral database operations and workflow | `process_referral()`, `save_referral()`, `get_referral_count()` |
| `whatsapp_sender.py` | Sends onboarding messages to new referrals | `send_onboarding_msg()` |
| `api/whatsapp_api.py` | External WhatsApp API client | `send_whatsapp_message()` |

### Flask Application (Purple Box)
| Component | Description |
|-----------|-------------|
| `main.py` | Application entry point that initializes the Flask app, registers blueprints (web_bp, webhook_bp), and handles database initialization |
| `app/routes/web.py` | Web routes blueprint containing `/emulator` GET endpoint for the emulator interface |
| `app/routes/webhook.py` | Webhook routes blueprint containing `/process` POST endpoint - clean request handler that routes all messages to process_message.py |

### Message Processing (Green Box)
| Component | Description |
|-----------|-------------|
| `process_message.py` | Main message processor that detects VCARD contacts and routes commands to appropriate handlers (goals, rate, week, lookback, help, add goal) |

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
| Data Access | Unified module interface with `__init__.py` files for clean imports. Contains user goals queries and operations organized by domain |

### Utilities (Light Green Box)
| Component | Description |
|-----------|-------------|
| `config.py` | Goals configuration and styling constants |
| `messages.py` | **Centralized user-facing messages** (welcome, help, errors, success messages). Improves maintainability and simplifies future translation/localization. |

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

