# Life Bot User Journey

---

## Overview

![User Flow](diagrams/pngs/user_flow.png)

<small>_Tip: Click the image to zoom._</small> 

---

## What You Can Do

Life Bot helps you track and achieve your goals through simple WhatsApp messages.

### 1. Send Voice Notes for Journaling

Send a voice note to Life Bot and it will:

1. Transcribe your audio
2. Generate a summary using AI
3. Store it in your journal
4. Send you the summary

You'll see status updates like:

- "Audio received. Transcribing..."
- "Audio transcribed. Summarizing..."
- "Summary stored in Database."

### 2. Share Contacts (Referrals)

Share a contact from WhatsApp to refer someone to Life Bot.

**How to refer:**

1. Open the contact you want to refer in WhatsApp
2. Share the contact with Life Bot
3. Life Bot will process the referral

**What happens:**

- Life Bot automatically welcomes the new user with an onboarding message
- You receive a confirmation message
- The referred person can start using the bot immediately
- No duplicate referrals - if the contact is already registered, you'll be notified

### 3. Manage Your Goals

**View your goals:**

- Send `goals` to see all your goals with boost levels and reminder times

**Add a new goal:**

- Send `add goal [your goal]`
- Choose a boost level (1-5)
- Set a reminder time (e.g., "6 PM" or "18:00")

**Rate your goals:**

- Send `rate [goal #] [rating 1-5]` to rate a specific goal
- Or send numbers like `12345` to rate all goals at once (1 for first goal, 2 for second, etc.)

**View summaries:**

- Send `week` to see your weekly progress
- Send `lookback [N]` to see your progress from the last N days

**Setting reminder times:**

When adding a goal, you'll be asked for a reminder time. You can send:

- `18:00` (24-hour format)
- `6 PM` or `6:30 PM`
- `6pm` or `6` (assumes PM)

---

---
