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
