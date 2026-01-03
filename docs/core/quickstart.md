# ⚡ Quickstart

Build your own WhatsApp chatbot in pure Python using the `loglife.core` framework.

!!! info "Framework vs. App"
    This guide teaches you how to use the **Core Framework** to build *any* bot. If you are looking for the LogLife Journaling App documentation, check the [App Implementation](../app/overview.md) section.

---

## 📦 Installation

The core framework is included in the `loglife` package.

```bash
pip install loglife
# or
uv pip install loglife
```

---

## 🤖 Your First Bot

Create a file named `my_bot.py`. This example creates an "Echo Bot" that replies with whatever you send it.

```python
import loglife.core as core

def run():
    # 1. Initialize the Core System 🚀
    # This sets up the DB, Logging, and starts the Background Sender Worker.
    print("Starting Bot System...")
    core.init()

    print("✅ System Online. Waiting for messages...")

    # 2. Main Consumer Loop 🔄
    while True:
        # block=True means this line waits until a message arrives.
        # It's efficient and won't eat your CPU.
        msg = core.recv_msg(block=True)

        print(f"📩 Received from {msg.sender}: {msg.raw_payload}")

        # 3. Process Your Logic 🧠
        response_text = f"You said: {msg.raw_payload}"

        # 4. Send Reply 📤
        # This queues the message for the background worker to deliver.
        core.send_msg(response_text, to=msg.sender)

if __name__ == "__main__":
    run()
```

---

## 🏃 Running It

Start your bot:

```bash
python my_bot.py
```

You will see:
```
Starting Bot System...
✅ System Online. Waiting for messages...
```

Now, send a message to your WhatsApp sandbox number. You should see the log appear and receive a reply instantly!

---

## 🧩 The Message Object

The `core.recv_msg()` function returns a `Message` dataclass with everything you need.

| Field | Type | Description |
| :--- | :--- | :--- |
| `sender` | `str` | The sender's phone number (e.g., `+15550199`). |
| `msg_type` | `str` | Type of message: `chat`, `audio`, `vcard`, `image`. |
| `raw_payload` | `str` | The text content (or file path/ID for media). |
| `client_type` | `str` | `whatsapp` or `emulator`. |
| `metadata` | `dict` | Extra transport info (timestamps, IDs). |

---

## ⏭️ Next Steps

*   [Understand the Architecture](architecture.md) - How threads and queues work under the hood.
*   [WhatsApp Flow](whatsapp-flow.md) - Connect your bot to the real world.

