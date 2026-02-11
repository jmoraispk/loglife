# Why the Multi-User Layer (vs. Just `dmScope: "per-peer"`)

OpenClaw already has a config option — `session.dmScope: "per-peer"` (or `"per-channel-peer"`) — that gives each sender their own conversation history. So why do we need all of this?

## What `dmScope: "per-peer"` gives you (free, just config)

When you set `session.dmScope: "per-peer"`, each sender gets **their own conversation history**. Alice's messages don't show up in Bob's session. This is purely **memory/session isolation**.

That's it. That's all it does.

Everything still runs through the **same single agent**, so all users share the same API keys, the same model, the same skills, the same long-term memory, and the same usage bucket.

## What it does NOT give you

| Capability | `dmScope: "per-peer"` alone | Multi-user layer |
|---|---|---|
| Separate conversation memory | Yes | Yes |
| Separate API keys | No — everyone shares the same keys. If the Anthropic key gets rate-limited by Alice's usage, Bob is also affected. | Yes — each user has their own `auth-profiles.json`. Alice's key can be revoked without touching Bob's. |
| Different model per user | No — everyone talks to the same model | Yes — Alice on Claude, Bob on GPT-4o |
| Different skills per user | No — everyone has access to the same tools | Yes — Alice gets web-search + calendar, Bob gets code-execution only |
| Cross-channel identity | No — `per-peer` isolates by peer ID, so Alice on WhatsApp and Alice on Telegram are treated as different sessions | Yes — bindings route both to the same agent |
| Per-user usage tracking | No — usage is aggregated under the single agent | Yes — each user IS an agent, so the existing `byAgent` API gives per-user breakdowns for free |
| Per-user long-term memory | No — the vector DB (`memory/<agentId>.sqlite`) is shared across all users | Yes — each agent has its own memory DB |

## The fundamental difference

**`dmScope: "per-peer"`** = one brain, separate notepads.

Everyone talks to the same assistant, which has the same skills, same API keys, same long-term memory — it just keeps separate conversation logs per sender.

**Multi-user layer** = separate brains entirely.

Each user gets their own agent with their own everything — API keys, model, skills, conversation history, long-term memory, usage tracking.

## When `dmScope` alone is sufficient

If all your users are fine with:

- The same model
- The same API keys (and shared rate limits / billing)
- The same skills
- Shared long-term memory (what Alice teaches the bot, Bob can recall)
- No per-user usage visibility

...then `dmScope: "per-peer"` is all you need. Zero extra code. Just set it in your `openclaw.json`:

```json
{
  "session": {
    "dmScope": "per-peer"
  }
}
```

## When you need the multi-user layer

As soon as you need **any** of the following, you need the one-user-per-agent mapping that this layer provides:

- Different API keys per user (separate billing, separate rate limits)
- Different models per user (Alice on Claude, Bob on GPT-4o)
- Different skills per user (restrict who can do what)
- Isolated long-term memory (Alice's context is invisible to Bob)
- Per-user usage tracking (who consumed how many tokens, at what cost)

The `dmScope` setting cannot solve these because they are properties of the **agent**, not the **session**. Our layer maps each user to their own agent, so all of these are isolated automatically by OpenClaw's existing per-agent architecture.

---

## Appendix: Memory layers and isolation

OpenClaw has six distinct layers of persistent state. Understanding these is important for reasoning about what is and isn't isolated between users.

### 1. Conversation history (session transcripts)

The back-and-forth messages — what you said, what the AI replied.

- **Where**: `~/.openclaw/agents/{agentId}/sessions/{sessionId}.jsonl`
- **Isolated per user?** Yes — path includes `agentId`

### 2. Session metadata

Index of all sessions (creation time, last message, session IDs).

- **Where**: `~/.openclaw/agents/{agentId}/sessions/sessions.json`
- **Isolated per user?** Yes

### 3. Long-term memory (vector DB)

The `.sqlite` database that stores embeddings for semantic recall — things the bot "remembers" across conversations. This is the persistent knowledge that survives session resets.

- **Where**: `~/.openclaw/memory/{agentId}.sqlite`
- **Isolated per user?** Yes — one DB per agent

### 4. Workspace memory files

Markdown files the agent uses as a scratchpad — `MEMORY.md`, daily logs in `memory/YYYY-MM-DD.md`.

- **Where**: `~/.openclaw/workspace-{agentId}/` (or `~/.openclaw/workspace/` for the default agent)
- **Isolated per user?** Yes — each agent gets its own workspace directory

### 5. Agent directory (auth, config)

Auth profiles (`auth-profiles.json`), runtime auth cache.

- **Where**: `~/.openclaw/agents/{agentId}/agent/`
- **Isolated per user?** Yes

### 6. Log files (debug/trace)

Cache traces, raw API payloads, command logs — operational and debug data.

- **Where**: `~/.openclaw/logs/*.jsonl`
- **Isolated per user?** **No** — these are shared across all agents. Entries from different agents are interleaved in the same files.

### Is memory 100% separate?

**Almost.** The five layers that matter for user-facing behavior — conversation history, long-term memory, workspace files, session metadata, and auth — are all fully isolated per agent, which means fully isolated per user in our setup.

The only shared layer is **debug/trace logs** (`~/.openclaw/logs/`). These are operational logs (raw API payloads, cache traces), not user-facing memory. An agent never reads from these files to inform its responses. They don't affect what the bot "knows" or "remembers."

**Bottom line**: for anything that affects what the bot says, remembers, or knows — the isolation is complete. Alice cannot learn Bob's secrets, recall Bob's conversations, or access Bob's workspace files. The only "leak" is in debug logs that no agent reads.
