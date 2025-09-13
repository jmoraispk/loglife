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

## Commands

Legend: Status indicates whether the capability is available in M1 or planned for M2.

| Command | Syntax | Description | Status |
| --- | --- | --- | --- |
| start | `start` | Begin onboarding; welcomes the user (questions phased in later). | M1 |
| set timezone | `set tz <Area/City>` | Set timezone (e.g., `America/Los_Angeles`). | M2 (implemented) |
| style set | `style set <bullet|compact|table|card>` | Set message style (bullet/compact active). | M2 (implemented) |
| style get | `style get` | Show current style. | M2 (implemented) |
| morning reminder | `set morning <HH:MM|off>` | Enable/disable and set morning reminder time. | M2 (implemented) |
| add habit | `add <habit> at <HH:MM>` | Add a habit (respects soft cap 1). | M1 |
| add habit (force) | `add force <habit> at <HH:MM>` | Add even if at soft cap (up to 3 total). | M1 |
| remove habit | `remove <habit>` | Remove a habit by name. | M2 |
| rename habit | `rename <old> -> <new>` | Rename a habit. | M2 |
| list habits | `list` | List active habits and their check times. | M1 |
| check-in (single) | `3`/`2`/`1` or `done` | Log completion/partial/miss for one habit; updates streak. | M1 |
| check-in (multi) | `321` or `3 2 1` or `✅⚠️❌` | Log for multiple habits in listed order. | M2 |
| backfill | `backfill yesterday 321` or `backfill YYYY-MM-DD 321` | Backfill only for yesterday or today; rejects older. | M1 |
| streak | `streak <habit>` | Show current streak for a habit. | M2 |
| stats | `stats w1|w12|m1|m3` | Aggregate stats for a window. | M2 |
| export | `export w1|m3|YYYY-MM-DD..YYYY-MM-DD [habit:"name"]` | Generate CSV (file by default). | M1 |
| export mode | `export mode file|link` | Choose export delivery mode (link mode returns signed URL). | M2 (implemented) |
| boost | `boost [<habit>]` | 7-step prompts to improve habit strategy. | M2 |
| set why/identity/... | `set why <habit>: <text>` (and similar) | Shortcuts to set strategy fields. | M2 |
| nudges | `nudges on|off [<habit>]` / `nudges status [<habit>]` | Control precomputed nudges and see status. | M2 |
| celebrate | `celebrate on|off [<habit>]` / `celebrate milestones <habit>: ...` | Configure celebration behavior. | M2 |
| feedback | `feedback <text>` | Open a feedback ticket and return id. | M1 |
| account | `pause` / `resume` / `cancel` | Pause/resume reminders; log cancel. | M2 (pause/resume implemented) |
| delete | `delete me` (then `YES`) | Delete user data (requires confirm). | M2 |

Notes:
- In M1, check-in replies include streak and percent toward the horizon; first day and milestones show a 🎉.
- Scheduler sends one morning reminder (08:00 default) and evening check prompts per habit, with suppression if already logged that day.

## Project structure

```text
app/
  api/handler.py            # Webhook entry + healthcheck; logs inbound/outbound messages
  adapters/
    simulator.py            # Stdin/stdout simulator using the same handler
  ui/
    render_whatsapp.py      # Template renderer with style variants (bullet/compact)
    strings/whatsapp.en.yaml# Message templates
  core/
    parser.py               # Command parsing (M1 subset implemented)
    services.py             # Core flows: add/list/checkin/backfill/export
    scheduler.py            # Tick loop with morning reminder + evening checks
  domain/
    dto.py                  # Inbound/Outbound DTOs
  infra/
    repo_sqlite.py          # SQLite schema + repo (users/habits/logs/messages, helpers)
    clock.py                # Timezone utilities (now/today/yesterday)
  admin/
    cli.py                  # (Planned) Admin CLI commands (KPIs, feedback, export)
tests/
  unit/                     # Unit tests for parser/services/backfill
  integration/              # Integration tests (scheduler)
  e2e/                      # End-to-end scenario tests via handler
Makefile                    # uv-based tasks: sync, migrate, simulate, test, health
pyproject.toml              # Project + tooling config (uv, ruff, pytest)
```

## Message flow (file-level)

Inbound (webhook or simulator):
1. `app.api.handler.handle_message` parses the raw payload into `InboundMessage` and ensures the user exists. It logs the inbound message in `messages`, updates usage streak, applies idempotency guard, then parses the command via `app.core.parser.parse_command`.
2. `app.core.services.ServiceContainer.route_command` dispatches to the appropriate handler (e.g., add/list/checkin/backfill/export/boost/prefs). These handlers call into `app.infra.repo_sqlite.Repo` for reads/writes and use `app.ui.render_whatsapp.render` to generate the WhatsApp text.
3. `app.api.handler` logs the outbound message, applies a simple daily rate limit budget, and returns `OutboundMessage` to the adapter.
4. Adapters (e.g., `app.adapters.simulator`) print/send the text. A real WhatsApp adapter would call the transport API here.

Scheduler (tick loop):
1. `app.core.scheduler.tick` iterates users, determines local time (TZ), sends morning reminders and evening check prompts as needed.
2. Suppression rules: skip checks if a log exists for today; suppress nudges if the user interacted in the last 10 minutes.
3. The loop can run with `--once` for testing or continuously every 60 seconds.

## M2 outline (Boost & Nudges, Polishing)

- Boost & strategy
  - Implement `boost` flow with 7-step prompts and per-habit saves.
  - Add setters: why, identity, env+/env-, minimum, ifthen, reward, plan.
  - Store `habit_meta` and `habit_strategy`, compute `readiness_score`.
- Nudges
  - Precompute `habit_nudges` templates (if_then, minimum, identity, env, reward, compassion, plan).
  - Queue and send via `nudge_queue` using policies (pre_time, post_time, next_morning, weekly).
  - Enforce cooldowns and `NUDGE_MAX_PER_DAY_PER_HABIT`; suppress after recent user activity.
- Preferences & renderer
  - Support `style set/get`, default style per user; add compact style coverage.
  - Implement `export mode file|link` and signed-link generation with 24h TTL.
- Account and controls
  - `pause`/`resume` reminders; `cancel` audit log; `delete me` with confirmation and wipe.
  - `celebrate on|off` and milestones config.
- Admin CLI (local-only)
  - `feedback list|show|close <id>`; `kpis today`; `users show <phone>`; `export <phone> w4`.
- Reliability & ops
  - Message rate limits (30 msgs/user/day), export limits; record `messages` for KPIs.
  - Add coverage to ≥85% (unit, integration, e2e, golden outputs).

