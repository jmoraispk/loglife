# WhatsApp Habit Tracker

Python-only backend with SQLite and a simulator to test WhatsApp-like interactions.

## Dev quickstart

1) Install uv (once):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env
```

2) Sync deps and run migrations:

```bash
make sync
make migrate
```

3) Start the simulator:

```bash
make simulate
```

Simulator input format:

```text
+15551234567> start
+15551234567> add Sleep by 23:00 at 21:30
+15551234567> list
+15551234567> 3
```

## Healthcheck

```bash
make health
```

## Tests

```bash
uv sync
uv run pytest -q
```

## Defaults

- Morning reminder: ON at 08:00 (user TZ)
- Export default mode: file (CSV attachment)
- Habit soft cap: 1 (use `add force` for up to 3)
