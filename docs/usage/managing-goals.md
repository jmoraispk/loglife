# 🎯 Managing Goals

Stay accountable by tracking your daily habits and goals.

---

## 📋 Viewing Goals

Want to see what you're tracking? Just ask.

*   Send **`goals`** to list all active goals.
    *   Shows your current streak.
    *   Shows importance level ("Boost").
    *   Shows scheduled reminder time.

---

## ➕ Adding a Goal

Creating a new habit is a conversation, not a form.

1.  **Start**: Send `add goal` (or `add goal run daily`).
2.  **Name**: If you didn't specify it, the bot will ask "What is the goal?".
3.  **Importance**: Choose a "Boost Level" (Multiplier for your score).
    *   🔥 **High (x3)**: Critical life goals.
    *   ⚡ **Medium (x2)**: Important habits.
    *   ✨ **Low (x1)**: Nice-to-haves.
4.  **Schedule**: Set a time for your daily check-in (e.g., "9pm").

---

## ⭐ Rating Your Day

Every day at your scheduled time, LogLife will ask: *"How did you do today?"*

### Single Rating
Rate a specific goal by its ID number (1-3 stars).
> `rate 1 3` -> Rates Goal #1 as 3 stars (Great!)

### Batch Rating
Rate all your goals in one go by sending a sequence of numbers.
> `321` -> Goal #1 gets 3 stars, Goal #2 gets 2 stars, Goal #3 gets 1 star.

| Rating | Meaning | Emoji |
| :--- | :--- | :--- |
| **3** | Great / Done | 🟢 |
| **2** | Okay / Partial | 🟡 |
| **1** | Missed / Bad | 🔴 |

---

## 📊 Checking Progress

See how you're performing over time.

*   📅 **`week`**: Get a summary of your performance for the current week.
*   ⏮️ **`lookback 30`**: See your stats for the last 30 days (or any number).

---

## ⏰ Smart Reminders

LogLife knows your timezone. When you say "Remind me at 8pm", it means **your** 8pm.

**Supported Formats:**
*   `18:00` (24-hour)
*   `6 PM` or `6:30 PM`
*   `6pm` (Casual)

---
