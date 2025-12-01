# Core Architecture

This document details the core architecture of LogLife, specifically focusing on the threading model, efficiency, and the unified messaging pipeline.

## System Overview

LogLife is built as a multi-threaded Flask application. To maintain high throughput and responsiveness for the WhatsApp webhook, extensive use of background worker threads is made to handle I/O-bound tasks (Database, WhatsApp API, OpenAI API).

### Threads & Efficiency

The application spawns **4 background threads** to handle operations without blocking the main web server.

| Thread Name | Spawned By | Role | Efficiency / Risk |
| :--- | :--- | :--- | :--- |
| **MainThread** | Flask (WSGI) | **Web Server**. Receives Webhook & pushes to Queue. | **High**. Non-blocking. Returns `200 OK` to WhatsApp instantly. |
| **router-worker** | `core.init` | **Logic Processor**. Pops Inbound -> Runs Logic -> Pushes Outbound. | **Medium**. Serial processing. If logic is slow (e.g., OpenAI), the queue builds up. |
| **sender-worker** | `core.init` | **IO Sender**. Pops Outbound -> Calls WhatsApp API. | **Low**. Synchronous `requests.post`. If WhatsApp API hangs, sending stalls. |
| **reminder-worker** | `startup.py` | **Scheduler**. Checks DB for reminders every minute. | **High**. Sleeps 99% of the time. Negligible overhead. |

!!! warning "Scalability Note"
    The **sender-worker** is currently single-threaded. If the WhatsApp API responds slowly, outbound messages may be delayed. For high-scale deployments, this should be refactored to use a `ThreadPoolExecutor` or `asyncio`.

### Messaging Pipeline

The core messaging logic has been unified into a single module `src/loglife/core/messaging.py` to reduce complexity.

#### Workflow

1.  **Inbound**: Webhook receives JSON -> Wraps in `Message` object -> Pushes to `_inbound_queue`.
2.  **Routing**: `router-worker` pops message -> Determines handler (Text/Audio) -> Runs logic.
3.  **Outbound**: Logic returns string -> Wraps in `Message` -> Pushes to `_outbound_queue`.
4.  **Sending**: `sender-worker` pops message -> Calls WhatsApp API.

## Simplified Core API

For developers building on top of LogLife, the core package exposes a simplified API pattern that handles the complexity internally.

```python
import loglife.core as core

# 1. Initialize System (DB, Logging, Sender Worker)
core.init()

# 2. Manual Main Loop (replaces the automatic router-worker)
# You can write your own consumer loop using the primitives below:
while True:
    # Blocks until message arrives (SIMPLE!)
    msg = core.recv_msg()
    
    print(f"Received: {msg.raw_payload}")
    
    # Process logic...
    response = "Got it!"
    
    # Send response
    core.send_msg(response, to=msg.sender)
```

### API Reference

::: loglife.core
    options:
        members:
            - init
            - recv_msg
            - send_msg
            - Message

