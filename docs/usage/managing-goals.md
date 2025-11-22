# Managing Goals

---

## Overview

Track and manage your personal goals through simple text commands.

---

## View Your Goals

Send `goals` to see all your goals with boost levels and reminder times.

---

## Add a New Goal

1. Send `add goal [your goal]`
2. Choose a boost level (1-5)
3. Set a reminder time (e.g., "6 PM" or "18:00")

**Example:**

```
add goal 🏃 Run daily
```

---

## Rate Your Goals

**Rate a specific goal:**

Send `rate [goal #] [rating 1-5]`

**Example:**

```
rate 1 4
```

**Rate all goals at once:**

Send numbers like `12345` to rate multiple goals (1 for first goal, 2 for second, etc.)

**Example:**

```
12345
```

---

## View Summaries

**Weekly progress:**

Send `week` to see your weekly progress summary.

**Historical progress:**

Send `lookback [N]` to see your progress from the last N days.

**Examples:**

```
week
lookback 7
lookback 30
```

---

## Setting Reminder Times

When adding a goal, you'll be asked for a reminder time. You can use any of these formats:

- `18:00` — 24-hour format
- `6 PM` or `6:30 PM` — 12-hour format with AM/PM
- `6pm` or `6` — Casual format (assumes PM)

LogLife automatically adjusts reminders to your timezone!

---

