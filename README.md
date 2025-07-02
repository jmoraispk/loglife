# WhatsApp Goal Bot

A bot that tracks personal goal check-ins via WhatsApp messages.

## 📋 Goals

Defined in `config.py`:
- 😴 Bed and lights out at 10 pm
- 🥗 Eat clean (70% veggies, 30% protein)
- 🏃 Exercise >=50 min
- 📵 No mindless entertainment
- 🙏 Pray and reflect

## ✅ Daily Check-in

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

## 📊 Weekly Summary

Send:
```
bot: show week
```

Bot responds with a summary of Mon–Sun with ✅/⚠️/❌ or 🔲 if missing.

## 🛠 Dev

- Run Python backend:
  ```
  pip install -e .
  cd backend && flask run
  ```
- JS listener (in another terminal):
  ```
  cd whatsapp-client && npm install && node index.js
  ```


## ⚙️ First-Time Setup (Linux)

> Windows may differ slightly (use `set` instead of `export`, different path syntax, etc.)

### 1. ✅ Python Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
export FLASK_APP=app.py
flask run
```

### 2. ✅ Node.js Client

#### a. Install `nvm` (Node Version Manager)
If `nvm` is not installed:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# then restart your terminal or run:
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
```

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
Then message the bot from your main account:
```
bot: 31232
```


### 1. Python Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e .
export FLASK_APP=app.py    # Windows: set FLASK_APP=app.py
flask run
```

### 2. WhatsApp Client
Open a new terminal:
```bash
cd whatsapp-client
npm install
node index.js
```

Scan the QR code with your **secondary WhatsApp account**.

Now, from your main WhatsApp, send a message like:
```
bot: 31232
```

Expect a reply with feedback for each goal.
You can also try:
```
bot: show week
```

## ❓ FAQ

### Why doesn't the client need my number?

The bot uses `whatsapp-web.js`, which logs in using a QR code — just like WhatsApp Web.

- It acts as if you're logged into WhatsApp Web.
- Once scanned, the bot listens for all messages *received by that account*.
- No need to hardcode or configure your phone number — the session is handled automatically.

You just scan the QR once, and it remembers the session.
