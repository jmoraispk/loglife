# 💾 Database Schema

The App uses SQLite (`loglife.db`). Below are the main tables.

### 👥 `users`
Stores user profiles, settings, and conversational state.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key. |
| `phone_number` | `TEXT` | Unique international number. |
| `timezone` | `TEXT` | IANA Timezone ID (e.g., `America/New_York`). |
| `send_transcript_file` | `INTEGER` | `1` to send .txt file, `0` for summary only. |
| `state` | `TEXT` | Current conversational state (e.g., `awaiting_reminder_time`). |
| `state_data` | `TEXT` | JSON blob for temporary state data. |
| `referred_by_id` | `INTEGER` | User who referred this user (Self-reference). |

### 🎯 `user_goals`
Tracks the goals users have set for themselves, including reminder settings.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key. |
| `user_id` | `INTEGER` | Foreign Key to `users`. |
| `goal_emoji` | `TEXT` | Visual icon for the goal. |
| `goal_description` | `TEXT` | Text of the goal. |
| `boost_level` | `INTEGER` | Importance/frequency multiplier. |
| `reminder_time` | `TEXT` | Scheduled time (HH:MM:SS). |

### ⭐ `goal_ratings`
Daily performance scores for goals.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key. |
| `user_goal_id` | `INTEGER` | Foreign Key to `user_goals`. |
| `rating` | `INTEGER` | 1-3 stars (`1`: Bad, `2`: OK, `3`: Great). |
| `rating_date` | `DATETIME` | Timestamp of the rating. |

### 🎙️ `audio_journals`
Stores transcripts and AI summaries of voice notes.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key. |
| `user_id` | `INTEGER` | Foreign Key to `users`. |
| `transcription_text` | `TEXT` | Raw speech-to-text output. |
| `summary_text` | `TEXT` | AI-generated summary. |

For raw SQL definitions, see `src/loglife/app/db/schema.sql`.
