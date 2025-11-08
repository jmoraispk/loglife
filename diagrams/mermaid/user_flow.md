# User Flow Diagram

## Overview
This diagram illustrates the complete user interaction flow for the Life Bot application, including **audio journaling**, **regular message processing**, **contact sharing/referral system**, and **goal reminder setup flow**.

## Key Updates
- ✅ **Added audio journaling feature (NEW)** - Record voice notes, get transcripts and AI summaries
- ✅ **Added audio message processing flow (NEW)** - AssemblyAI transcription + OpenAI summarization
- ✅ **Added real-time status updates (NEW)** - Users notified during transcription and summarization
- ✅ Added contact sharing detection (VCARD format)
- ✅ Added referral tracking flow
- ✅ Added automated onboarding message flow
- ✅ Added multi-step goal reminder setup flow
- ✅ Added conversation state management
- ✅ Added timezone detection and time parsing
- ✅ Updated command list to reflect current features

## User Journey

### Audio Journaling Flow (NEW)
1. User sends audio message (voice note) via WhatsApp
2. WhatsApp client detects audio message type ('ptt' or 'audio')
3. Client downloads audio media and encodes as base64
4. System receives audio payload with messageType and audio data
5. Backend immediately sends: "Audio received. Transcribing..."
6. Audio uploaded to AssemblyAI for transcription
7. System polls AssemblyAI until transcription completes
8. Backend sends: "Audio transcribed. Summarizing..."
9. Transcript sent to OpenAI API (GPT model) for summarization
10. Backend sends: "Summary stored in Database."
11. Both transcript and summary saved to database
12. Backend returns AI-generated summary to user

### Regular Message Flow
1. User sends text command via WhatsApp
2. System checks if user exists (creates if new, detects timezone)
3. Checks user conversation state (for multi-step flows)
4. Detects and validates command
5. Executes command logic against database
6. Returns formatted response

### Goal Reminder Setup Flow (NEW)
1. User sends "add goal 🏃 Morning run"
2. System creates goal in database
3. Detects user timezone from phone number
4. Sets user state to 'waiting_for_reminder_time'
5. Prompts user for reminder time
6. User sends time (e.g., "6 PM", "18:00")
7. System parses time and updates goal
8. Clears user state
9. Background service sends daily reminders at specified time

### Contact Sharing Flow
1. User shares a contact via WhatsApp
2. System detects VCARD format
3. Extracts WhatsApp ID (WAID) from contact data
4. Saves referral record to database
5. Sends automated onboarding message to referred contact
6. Returns confirmation to referrer

## Diagram

```mermaid
flowchart TB
    Start([User Sends WhatsApp Message])
    
    %% Message Type Detection
    Start --> CheckMessageType{Message Type?}
    
    %% Audio Journaling Flow (NEW)
    CheckMessageType -->|Audio/Voice Note| ReceiveAudio[Receive Audio Message<br/>messageType: ptt/audio]
    ReceiveAudio --> DownloadAudio[WhatsApp Client<br/>Downloads Audio Media<br/>Base64 Encode]
    DownloadAudio --> SendStatus1[Send Status:<br/>'Audio received. Transcribing...']
    SendStatus1 --> UploadAudio[Upload Audio to<br/>AssemblyAI API<br/>/v2/upload]
    UploadAudio --> TranscribeAudio[Create Transcription Job<br/>/v2/transcript<br/>Poll for Completion]
    TranscribeAudio --> CheckTranscript{Transcription<br/>Completed?}
    CheckTranscript -->|Error| AudioError[Send Error Message<br/>'Failed to transcribe']
    AudioError --> WaitNext
    CheckTranscript -->|Success| SendStatus2[Send Status:<br/>'Audio transcribed. Summarizing...']
    SendStatus2 --> SummarizeText[Send Transcript to<br/>OpenAI API<br/>GPT Model]
    SummarizeText --> CheckSummary{Summary<br/>Generated?}
    CheckSummary -->|Error| SummaryError[Send Error Message<br/>'Failed to summarize']
    SummaryError --> WaitNext
    CheckSummary -->|Success| SaveJournal[Save to Database<br/>audio_journal_entries<br/>transcript + summary]
    SaveJournal --> SendStatus3[Send Status:<br/>'Summary stored in Database.']
    SendStatus3 --> SendSummary[Send AI-Generated<br/>Summary to User]
    SendSummary --> WaitNext
    
    %% VCARD/Contact Sharing Flow
    CheckMessageType -->|VCARD Contact| DetectVCard[Detect VCARD Format]
    DetectVCard --> ExtractWAID[Extract WhatsApp ID<br/>from Contact Data]
    ExtractWAID --> CheckWAID{WAID<br/>Extracted?}
    CheckWAID -->|Yes| SaveReferral[Save Referral to Database<br/>referrer_phone → referred_phone]
    CheckWAID -->|No| ErrorMsg[Send Error Message<br/>Could not process contact]
    SaveReferral --> SendOnboarding[Send Automated<br/>Onboarding Message<br/>via WhatsApp API]
    SendOnboarding --> CheckSendSuccess{Message<br/>Sent?}
    CheckSendSuccess -->|Yes| ConfirmReferral[Send Confirmation Message<br/>Thank you for referral!]
    CheckSendSuccess -->|No| ConfirmReferral
    ConfirmReferral --> WaitNext
    ErrorMsg --> WaitNext
    
    %% Regular Message Flow - Check User State First
    CheckMessageType -->|Text Message| CheckUserState{Is User in<br/>Reminder Setup<br/>State?}
    
    %% Reminder Time Input Flow (NEW)
    CheckUserState -->|Yes| ParseTime[Parse Time Input<br/>Supports: 18:00, 6 PM, 6pm, 6]
    ParseTime --> ValidateTime{Valid Time<br/>Format?}
    ValidateTime -->|No| TimeError[Send Error Message<br/>Invalid time format<br/>Show examples]
    TimeError --> WaitNext
    ValidateTime -->|Yes| SaveTime[Update Goal with<br/>Reminder Time<br/>Clear User State]
    SaveTime --> ConfirmReminder[Send Confirmation<br/>Reminder set for TIME<br/>Goal is now active!]
    ConfirmReminder --> WaitNext
    
    %% Normal Command Flow
    CheckUserState -->|No| CheckUser{Is User Already<br/>in Database?}
    CheckUser -->|No| CreateUser[Create User in DB<br/>Using WhatsApp Number<br/>Detect & Save Timezone]
    CheckUser -->|Yes| DetectCommand
    CreateUser --> DetectCommand[Detect Command<br/>help / goals / add goal<br/>rate / week / lookback]
    
    DetectCommand --> ValidateCommand{Is Command<br/>Valid?}
    ValidateCommand -->|No - Invalid Command| SendHelp[Send Help Message<br/>List All Commands]
    SendHelp --> WaitNext
    
    ValidateCommand -->|Yes| RouteCommand{Command Type?}
    
    %% Command Routing
    RouteCommand -->|help| ShowHelp[Show Help Message<br/>All Commands & Examples]
    RouteCommand -->|goals| GetGoals[Fetch User Goals<br/>from Database<br/>Display with Boost Levels]
    RouteCommand -->|add goal| AddGoal[Parse Goal String<br/>Extract Emoji & Description<br/>Set Default Boost Level<br/>Save Goal to Database<br/>Detect User Timezone]
    RouteCommand -->|rate X Y| RateGoal[Rate Individual Goal<br/>Validate Rating 1-3<br/>Save to Database]
    RouteCommand -->|digits only| BulkRate[Rate All Goals at Once<br/>Parse Digit String<br/>Save to Database]
    RouteCommand -->|week| WeekSummary[Generate Week Summary<br/>Fetch Ratings for Current Week<br/>Calculate Success Rate]
    RouteCommand -->|lookback N| LookbackSummary[Generate Lookback Report<br/>Fetch Last N Days<br/>Show Performance Trends]
    
    %% Add Goal Flow - Now with Reminder Setup (NEW)
    AddGoal --> SetState[Set User State to<br/>waiting_for_reminder_time<br/>Store Goal ID]
    SetState --> PromptTime[Send Prompt<br/>What time for daily reminder?<br/>e.g., 18:00, 6 PM, 6pm]
    PromptTime --> WaitNext
    
    %% Execute Other Commands
    ShowHelp --> FormatResponse[Format Response Message]
    GetGoals --> FormatResponse
    RateGoal --> FormatResponse
    BulkRate --> FormatResponse
    WeekSummary --> FormatResponse
    LookbackSummary --> FormatResponse
    
    FormatResponse --> SendResponse[Send Formatted Reply<br/>to User via WhatsApp]
    SendResponse --> WaitNext([Wait for Next Message])
    
    WaitNext -.-> Start
    
    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:3px
    classDef decision fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef process fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef referral fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef command fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef reminder fill:#e1bee7,stroke:#6a1b9a,stroke-width:2px
    classDef audio fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px
    
    class Start,WaitNext startEnd
    class CheckMessageType,CheckUser,CheckUserState,ValidateCommand,RouteCommand,CheckWAID,CheckSendSuccess,ValidateTime,CheckTranscript,CheckSummary decision
    class CreateUser,DetectCommand,FormatResponse,SendResponse process
    class DetectVCard,ExtractWAID,SaveReferral,SendOnboarding,ConfirmReferral referral
    class ShowHelp,GetGoals,RateGoal,BulkRate,WeekSummary,LookbackSummary command
    class AddGoal,SetState,PromptTime,ParseTime,SaveTime,ConfirmReminder reminder
    class ReceiveAudio,DownloadAudio,SendStatus1,UploadAudio,TranscribeAudio,SendStatus2,SummarizeText,SaveJournal,SendStatus3,SendSummary audio
    class SendHelp,ErrorMsg,TimeError,AudioError,SummaryError error
```

## Flow Details

### 1. Entry Point
- **Start**: User sends any type of message via WhatsApp
- Message is delivered to Flask `/process` endpoint as JSON payload
- Payload includes: `from`, `message`, `messageType`, `audio` (if applicable)

### 2. Message Type Detection
- **Three-way Detection**: Determines message type (Audio, VCARD, or Text)
  - **Audio/Voice Note**: `messageType` is 'ptt' (push-to-talk) or 'audio'
  - **VCARD Format**: `BEGIN:VCARD\n...TEL;type=CELL;waid=...END:VCARD`
  - **Text Message**: Plain text command

### 3. Audio Journaling Flow (NEW - Teal Nodes)
When audio message is detected:

1. **Receive Audio**: WhatsApp client detects audio message type
   - Message types: 'ptt' (voice note) or 'audio' (audio file)
   - Triggers audio processing workflow

2. **Download Audio**: WhatsApp client downloads media
   - Downloads audio from WhatsApp servers
   - Encodes audio data as base64
   - Includes metadata: mimetype, filename, filesize, duration

3. **Status Update 1**: "Audio received. Transcribing..."
   - Immediate feedback to user
   - Sent via WhatsApp API

4. **Upload to AssemblyAI**: Upload audio for transcription
   - Base64 decode audio data
   - POST to `https://api.assemblyai.com/v2/upload`
   - Returns upload URL

5. **Create Transcription Job**: Start transcription
   - POST to `https://api.assemblyai.com/v2/transcript`
   - Submits uploaded audio URL
   - Returns transcript ID

6. **Poll for Completion**: Wait for transcription
   - GET `https://api.assemblyai.com/v2/transcript/{id}`
   - Poll every 3 seconds
   - Status: queued → processing → completed/error
   - Extract transcript text on completion

7. **Status Update 2**: "Audio transcribed. Summarizing..."
   - Notifies user of progress
   - Sent via WhatsApp API

8. **Summarize with OpenAI**: Generate AI summary
   - Send transcript to OpenAI API
   - Model: GPT-5-nano
   - Prompt: "You are a helpful assistant that summarizes audio transcripts."
   - Returns concise summary text

9. **Save to Database**: Persist journal entry
   - Insert into `audio_journal_entries` table
   - Fields: user_id, transcription_text, summary_text, created_at
   - Links to user via phone number

10. **Status Update 3**: "Summary stored in Database."
    - Confirms successful storage
    - Sent via WhatsApp API

11. **Send Summary**: Deliver final result
    - Format: "Summary:\n{summary_text}"
    - Sent to user via WhatsApp

12. **Error Handling**:
    - Transcription errors: "Sorry, something went wrong while processing your audio."
    - Summary errors: Same error message
    - Database errors: Logged, error message sent to user

### 4. User State Check (Purple Decision)
- **Before processing commands**: System checks if user is in a multi-step conversation
- **Reminder Setup State**: If user is waiting to provide reminder time, prioritize that over command processing
- **State Management**: Uses `user_states` table to track conversation context
- **State Types**:
  - `waiting_for_reminder_time`: User needs to provide time for newly created goal
  - `normal`: Default state, process commands normally

### 5. Reminder Time Input Flow (Purple Nodes)
When user is in reminder setup state:
1. **Parse Time Input**: Accept various formats (18:00, 6 PM, 6pm, 6)
   - Uses regex-based parser in `time_parser.py`
   - Converts all inputs to 24-hour format (HH:MM)
2. **Validate Time**: Check if time format is valid
   - Hours: 0-23 for 24-hour, 1-12 for AM/PM
   - Minutes: 0-59
3. **Save Time**: Update goal with reminder_time and clear user state
4. **Confirm**: Send success message with formatted time
5. **Background Service**: Reminder service will now send daily WhatsApp messages at specified time

### 6. Contact Sharing Flow (Pink Nodes)
When VCARD is detected:
1. **Extract WAID**: Parse WhatsApp ID from VCARD data using regex pattern `waid=(\d+)`
2. **Save Referral**: Store referral record in database
   - Fields: `referrer_phone`, `referred_phone`, `referred_waid`, `status`
   - Duplicate check prevents multiple referrals
3. **Send Onboarding**: Automatically send welcome message to referred contact
   - Uses external WhatsApp API (port 3000)
   - Includes quick start guide and command examples
4. **Confirm**: Send thank you message to referrer
5. **Wait**: Return to listening state

### 7. Regular Message Flow (Green/Purple Nodes)

#### User Management
- **Check User**: Query database for existing user by phone number
- **Create User**: If new, insert user record with phone number
- **Timezone Detection (NEW)**: Automatically detect and save timezone from phone number using `phonenumbers` library

#### Command Detection & Validation
- **Detect Command**: Parse message text to identify command type
- **Validate Command**: Check if command matches known patterns
- **Invalid Command**: Send help message listing all available commands

#### Command Routing & Execution (Purple Nodes)
Each command type is routed to specific handler:

| Command | Handler | Database Operation | Notes |
|---------|---------|-------------------|-------|
| `help` | `show_help.py` | None (static response) | - |
| `goals` | `format_goals.py` | SELECT user_goals | Shows goals with boost levels |
| `add goal 😴 Description` | `add_goal.py` | INSERT INTO user_goals<br/>INSERT INTO user_states | Sets default boost level, sets state, prompts for reminder time |
| `6 PM` (when in reminder state) | `add_goal.py` → `set_reminder_time()` | UPDATE user_goals<br/>DELETE from user_states | **NEW**: Parses time, saves reminder, clears state |
| `rate 2 3` | `rate_individual_goal.py` | INSERT INTO goal_ratings | - |
| `123` (digits) | `handle_goal_ratings.py` | INSERT INTO goal_ratings (bulk) | - |
| `week` | `format_week_summary.py` | SELECT goal_ratings (current week) | - |
| `lookback 7` | `look_back_summary.py` | SELECT goal_ratings (last N days) | - |

#### Response
- **Format Response**: Convert database results to user-friendly message
- **Send Response**: Deliver formatted message to user via WhatsApp
- **Wait**: Return to listening state

### 8. Error Handling
- **Audio Transcription Failures (NEW)**: If AssemblyAI transcription fails, send error message to user
- **Audio Summarization Failures (NEW)**: If OpenAI summarization fails, send error message to user
- **Audio Processing Errors (NEW)**: Generic error message for any audio processing failure
- **Invalid VCARD**: If WAID cannot be extracted, send error message
- **Invalid Command**: Send help message with command list
- **Invalid Time Format**: If time parsing fails, show examples and ask again
- **API Failures**: Log error but confirm referral action to user

## Command Examples

### Audio Journaling (NEW)
```text
[User sends voice note via WhatsApp - e.g., recording about their day]

Bot: Audio received. Transcribing...
     [Processing... 10-30 seconds depending on audio length]

Bot: Audio transcribed. Summarizing...
     [Processing... 5-10 seconds]

Bot: Summary stored in Database.

Bot: Summary:
     Today was a productive day. You completed your morning workout, 
     had a successful team meeting at work, and spent quality time 
     with family in the evening. You're feeling accomplished and 
     grateful for the day's progress.
     
[Full transcript and summary are saved to database for future reference]
```

**Audio Format Support:**
- Voice notes (ptt - push-to-talk)
- Audio files
- Common formats: OGG, MP3, WAV, M4A

### Regular Commands
```text
help                    → Show all commands
goals                   → List your goals with boost levels and reminder times
rate 1 3                → Rate goal #1 as success
123                     → Rate all goals (1=fail, 2=partial, 3=success)
week                    → Show current week summary
lookback 5              → Show last 5 days performance
```

### Goal Creation with Reminder (Multi-Step)
```text
User: add goal 🏃 Morning run
Bot:  ✅ Goal added: 🏃 Morning run
      🔥 Boost level set to 1 (default).
      
      ⏰ What time should I remind you daily? (e.g., 18:00, 6 PM, 6pm)
      
User: 6:30 AM
Bot:  ✅ Reminder set for 6:30 AM daily!
      Your goal is now active with daily reminders.

[Background service will send daily WhatsApp reminder at 6:30 AM in user's timezone]
Bot (at 6:30 AM): ⏰ Reminder: 🏃 Morning run
```

### Supported Time Formats (NEW)
```text
18:00      → 6:00 PM (24-hour format)
6 PM       → 6:00 PM (12-hour with AM/PM)
6:30 PM    → 6:30 PM (12-hour with minutes)
6pm        → 6:00 PM (lowercase)
6          → 6:00 AM (single digit, assumes AM)
18         → 6:00 PM (military time)
```

### Contact Sharing
```text
[User shares contact via WhatsApp]
→ Bot detects VCARD format
→ Extracts WAID and saves referral
→ Sends onboarding message to referred contact
→ Confirms action with referrer
```

## Database Interactions

### Tables Used
1. **user** - User registration with timezone
2. **user_goals** - Goal definitions with reminder_time and boost_level
3. **goal_ratings** - Daily goal ratings
4. **referrals** - Referral tracking
5. **user_states** - Conversation state tracking
6. **audio_journal_entries (NEW)** - Audio journal transcripts and summaries

### CRUD Operations
- **CREATE**: New users (with timezone), goals (with reminder_time and boost_level), ratings, referrals, user states, **audio journal entries (NEW)**
- **READ**: Fetch goals (with reminder times and boost levels), ratings for summaries, user states, **audio journal entries (NEW)**
- **UPDATE**: Goal reminder times, user timezones
- **DELETE**: Soft delete for goals (is_active flag), clear user states after completion

## External Dependencies
- **WhatsApp Messaging Platform**: Message delivery and audio media download
- **Flask Backend**: Command processing (port 5000)
- **SQLite Database**: Data persistence
- **WhatsApp API Service**: Automated message sending (port 3000)
- **AssemblyAI API (NEW)**: Audio transcription service
- **OpenAI API (NEW)**: Text summarization using GPT models
- **Background Reminder Service**: Daemon thread for sending daily reminders
- **phonenumbers Library**: Timezone detection from phone numbers

## Key Decision Points
1. **Message Type Detection (NEW)**: Determines if message is Audio, VCARD, or Text
2. **Audio Processing (NEW)**: Routes audio messages to transcription and summarization pipeline
3. **VCARD Detection**: Enables referral vs. command processing
4. **User State Check**: Determines if user is in multi-step conversation (e.g., reminder setup)
5. **User Existence**: Determines if user creation needed (with timezone detection)
6. **Command Validation**: Routes to appropriate handler or help message
7. **Command Type**: Routes to specific execution logic
8. **Time Validation**: Ensures valid time format before saving reminder
9. **Transcription Status (NEW)**: Determines if transcription succeeded or failed
10. **Summarization Status (NEW)**: Determines if AI summary generation succeeded or failed

## Notes
- All message processing is synchronous (no async/queue)
- **Audio processing (NEW)**: Synchronous transcription and summarization with real-time status updates
- **Audio polling (NEW)**: Polls AssemblyAI every 3 seconds until transcription completes
- **Audio encoding (NEW)**: Base64 encoding used for audio data transfer between client and backend
- **AI Summarization (NEW)**: Uses OpenAI GPT-5-nano model for generating concise summaries
- **Audio storage (NEW)**: Both full transcript and AI summary are persisted to database
- **Reminder service runs in background daemon thread**, started at application initialization
- **Reminder service is timezone-aware**: Uses user's detected timezone for accurate scheduling
- **Efficient reminder scheduling**: Calculates next reminder time and sleeps until due (not constant polling)
- **Multi-step conversations**: State management tracks conversation context across messages
- Database operations use connection pooling via Flask teardown
- Referral system requires external WhatsApp API service
- VCARD format is specific to WhatsApp contact sharing
- Rating scale: 1 (fail), 2 (partial success), 3 (full success)
- **Time formats accepted**: 24-hour (18:00), 12-hour with AM/PM (6 PM), lowercase (6pm), single digit (6)

