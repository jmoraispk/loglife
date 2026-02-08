---
title: "How It Works"
description: "Understanding the AutoClaw architecture"
---

# How It Works

AutoClaw provides managed hosting for OpenClaw, handling all infrastructure and operations so you can focus on using your AI assistant.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      AutoClaw                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Your OpenClaw Instance              │    │
│  │                                                  │    │
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐  │    │
│  │   │ Gateway  │────│ AI Agent │────│  Skills  │  │    │
│  │   └────┬─────┘    └──────────┘    └──────────┘  │    │
│  │        │                                         │    │
│  │   ┌────┴─────────────────────────────────────┐  │    │
│  │   │              Chat Channels                │  │    │
│  │   │  WebChat │ WhatsApp │ Telegram │ ...     │  │    │
│  │   └──────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│  ┌───────────────────────┴───────────────────────────┐  │
│  │           AutoClaw Management Layer                │  │
│  │  • Provisioning  • Updates  • Monitoring  • Costs  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Components

### OpenClaw Gateway

The Gateway is the core of your OpenClaw instance. It:

- Manages all chat channel connections (WhatsApp, Telegram, Discord, etc.)
- Routes messages to the AI agent
- Handles tool execution and responses
- Provides the WebSocket control plane

### AI Agent

Your AI assistant (powered by Claude or GPT) that:

- Processes incoming messages
- Uses available skills and tools
- Maintains conversation context and memory
- Generates responses

### Skills

Integrations that extend your agent's capabilities:

- **Communication** — Gmail, Calendar
- **Development** — GitHub, Coding Agent
- **Utilities** — Browser, Weather, Notes
- **Smart Home** — Hue, Sonos, and more

### Chat Channels

The messaging platforms you can use to talk to your agent:

- **Web** — Built-in WebChat interface (available immediately)
- **Mobile** — WhatsApp, Telegram, Signal, iMessage
- **Work** — Slack, Discord, MS Teams, Google Chat
- **More** — Matrix, Mattermost, and others

## What AutoClaw Manages

### Infrastructure

- **Server provisioning** — We deploy your instance on reliable cloud infrastructure
- **Networking** — Tailscale VPN for secure, private access
- **Storage** — Persistent data for conversations and configuration
- **Backups** — Regular backups of your instance state

### Operations

- **Automatic updates** — We keep OpenClaw up-to-date with the latest stable release
- **Health monitoring** — Continuous monitoring of your instance health
- **Security patches** — Critical security updates applied promptly
- **Uptime management** — Automatic restarts if the Gateway crashes

### Security

- **Vetted skills only** — Every skill is reviewed by our team before inclusion
- **Hardened defaults** — Secure configuration out of the box
- **API key encryption** — Your credentials are encrypted at rest
- **Audit logging** — Track all actions in your instance

## Tailscale Networking

AutoClaw uses [Tailscale](https://tailscale.com) for secure networking:

- **Private by default** — Your instance is not exposed to the public internet
- **End-to-end encryption** — All traffic is encrypted
- **Easy access** — Connect from anywhere via your Tailnet
- **No port forwarding** — Works behind NATs and firewalls

## Cost Model

AutoClaw uses a simple, predictable pricing model:

- **Platform fee** — Monthly subscription for managed hosting
- **AI costs** — You pay your AI provider directly (BYOK) or use pooled credits
- **No hidden fees** — What you see is what you pay

See the [cost tracking](/platform/cost-tracking) page for details on monitoring your usage.
