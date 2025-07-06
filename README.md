# WhatsApp Goal Bot

A bot that tracks personal goal check-ins via WhatsApp messages.

## 📋 Goals

Defined in `config.py`:
- 😴 Bed and lights out at 10 pm
- 🥗 Eat clean (70% veggies, 30% protein)
- 🏃 Exercise >=50 min
- 📵 No mindless entertainment
- 🙏 Pray and reflect


## Features

### ✅ Daily Check-in

Send a message like:
```
bot: 31232
```

It will reply with:
```
📅 2025-06-30
> 😴 🥗 🏃 📵 🙏
> ✅ ❌ ⚠️ ✅ ⚠️
```

### 📊 Weekly Summary

Send:
```
bot: show week
```

Bot responds with a summary of Mon–Sun with ✅/⚠️/❌ or 🔲 if missing.

```
Week 25: Jun 23 - 29
    😴 🥗 🏃 📵 🙏
Mon 🔲 🔲 🔲 🔲 🔲
Tue 🔲 🔲 🔲 🔲 🔲
Wed ✅ ✅ ✅ ✅ ✅
Thu 🔲 🔲 🔲 🔲 🔲
Fri 🔲 🔲 🔲 🔲 🔲
Sat 🔲 🔲 🔲 🔲 🔲
Sun ❌ ❌ ❌ ❌ ❌
```

## 🛠 Dev

- Run Python message processor:
  ```
  pip install -e .
  cd backend && python app.py
  ```
- JS WhatsApp Client interface listener (in another terminal):
  ```
  cd whatsapp-client && node index.js
  ```

## ⚙️ First-Time Setup

<details>
<summary>Click to Expand</summary>

### 1. Python Backend
```bash
cd backend
mamba create -n goal_bot python=3.11
mamba activate goal_bot
pip install -e .
python app.py
```

### 2. Node.js Client

#### a. Install `nvm` (Node Version Manager)
If `nvm` is not installed, run:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```
(Note, may be different in Windows. )

Then restart terminal.

#### b. Install Node 18
```bash
nvm install 18
nvm use 18
```

#### c. Install dependencies and run the bot
```bash
cd whatsapp-client
npm install
node index.js
```

A QR code will appear — scan it using your bot WhatsApp account.

The bot will remember this account. If you need to reset it, restart the node server like this:

`node index.js --reset-session`

</details>


## ❓ FAQ

### 1- Why doesn't the client need my number?

The bot uses `whatsapp-web.js`, which logs in using a QR code — just like WhatsApp Web.

- It acts as if you're logged into WhatsApp Web.
- Once scanned, the bot listens for all messages *received by that account*.
- No need to hardcode or configure your phone number — the session is handled automatically.

You just scan the QR once, and it remembers the session.
