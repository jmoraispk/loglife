---
title: "Cost Tracking"
description: "Monitor your AI API usage and costs"
---

# Cost Tracking

AutoClaw provides unified cost tracking across all AI providers, so you always know what you're spending.

## Overview

The cost dashboard shows:

- **Total spend** — Cumulative costs across all providers
- **Daily breakdown** — Costs by day for the current billing period
- **By provider** — Split between Anthropic, OpenAI, and others
- **By model** — Which models are using the most tokens

## Viewing Costs

1. Go to **Dashboard → Costs** in the sidebar
2. Select your date range
3. View the breakdown

### Cost Summary

The summary card shows:

| Metric | Description |
|--------|-------------|
| **Today** | Costs incurred today |
| **This week** | Rolling 7-day total |
| **This month** | Current billing period total |
| **Projected** | Estimated monthly total based on usage |

### Usage Details

The detailed view shows:

- **Tokens in** — Input tokens (your messages)
- **Tokens out** — Output tokens (agent responses)
- **Total tokens** — Combined usage
- **Cost** — Calculated cost based on provider pricing

## Provider Breakdown

### Anthropic (Claude)

Costs are calculated based on Anthropic's published pricing:

| Model | Input | Output |
|-------|-------|--------|
| Claude 3.5 Sonnet | $3.00/M tokens | $15.00/M tokens |
| Claude 3.5 Haiku | $0.80/M tokens | $4.00/M tokens |
| Claude 3 Opus | $15.00/M tokens | $75.00/M tokens |

### OpenAI (GPT)

Costs are calculated based on OpenAI's published pricing:

| Model | Input | Output |
|-------|-------|--------|
| GPT-4o | $2.50/M tokens | $10.00/M tokens |
| GPT-4o mini | $0.15/M tokens | $0.60/M tokens |
| GPT-4 Turbo | $10.00/M tokens | $30.00/M tokens |

<Note>
Prices shown are approximate and may change. AutoClaw uses current provider pricing for calculations.
</Note>

## Cost Alerts

Set up alerts to avoid surprise bills:

1. Go to **Settings → Alerts**
2. Set a **daily limit** or **monthly limit**
3. Choose notification method (email, in-app)

When you approach or exceed your limit, AutoClaw will notify you.

## Bring Your Own Keys (BYOK)

With BYOK, you use your own API keys and pay providers directly:

- **Full control** — You own the relationship with the provider
- **No markup** — Pay provider prices directly
- **Usage visibility** — See exactly what you're using

AutoClaw just tracks and displays the usage; billing goes through your provider account.

## Optimizing Costs

Tips for reducing AI costs:

### Use Efficient Models

- Use **Haiku** or **GPT-4o mini** for simple tasks
- Reserve **Opus** or **GPT-4** for complex reasoning

### Manage Context

- Shorter conversations = fewer tokens
- Use session pruning to limit context length
- Summarize long conversations

### Batch Operations

- Group related requests when possible
- Use scheduled tasks during off-peak hours

## Export Data

Export your usage data for accounting:

1. Go to **Costs → Export**
2. Select date range
3. Choose format (CSV, JSON)
4. Download

## Learn More

- [OpenClaw Usage Tracking](https://docs.openclaw.io/concepts/usage-tracking) — How usage is calculated
- [Model Providers](https://docs.openclaw.io/providers) — Provider-specific details
