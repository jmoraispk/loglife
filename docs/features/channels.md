---
title: "Chat Channels"
description: "Messaging platforms supported by OpenClaw and AutoClaw"
---

# Chat Channels

Talk to your AI assistant from any messaging platform. OpenClaw supports 20+ channels, and AutoClaw is progressively enabling them.

## Channel Availability

The table below shows all channels supported by OpenClaw and their current status in AutoClaw.

| Channel | OpenClaw | AutoClaw | Setup Required | Notes |
|---------|:--------:|:--------:|:---------------|-------|
| **WebChat** | ✅ | ✅ | None | Built-in browser interface, works immediately |
| **WhatsApp** | ✅ | 🔜 Coming Soon | QR code pairing | Via Baileys (WhatsApp Web protocol) |
| **Telegram** | ✅ | 🔜 Coming Soon | Bot token | Via grammY, supports groups |
| **Discord** | ✅ | 🔜 Coming Soon | Bot token | Servers, channels, and DMs |
| **Slack** | ✅ | 🔜 Coming Soon | Workspace app | Via Bolt SDK |
| **Signal** | ✅ | 🔜 Coming Soon | signal-cli setup | Privacy-focused |
| **iMessage** | ✅ | 🔜 Coming Soon | macOS only | Via imsg CLI |
| **BlueBubbles** | ✅ | 🔜 Coming Soon | BlueBubbles server | Recommended for iMessage |
| **Google Chat** | ✅ | 🔜 Coming Soon | Google Workspace | HTTP webhook |
| **MS Teams** | ✅ | 🔜 Coming Soon | Bot Framework | Enterprise support (plugin) |
| **Mattermost** | ✅ | 🔜 Coming Soon | Bot token | Open source Slack alternative (plugin) |
| **Matrix** | ✅ | 🔜 Coming Soon | Homeserver | Open protocol (plugin) |
| **LINE** | ✅ | 🔜 Coming Soon | Messaging API | Popular in Asia (plugin) |
| **Zalo** | ✅ | 🔜 Coming Soon | Bot API | Popular in Vietnam (plugin) |
| **Nextcloud Talk** | ✅ | 🔜 Coming Soon | Nextcloud server | Self-hosted (plugin) |
| **Nostr** | ✅ | 🔜 Coming Soon | NIP-04 | Decentralized (plugin) |
| **Twitch** | ✅ | 🔜 Coming Soon | IRC connection | Streaming chat (plugin) |
| **Tlon** | ✅ | 🔜 Coming Soon | Urbit-based | Experimental (plugin) |

### Legend

- ✅ **Available** — Fully supported and ready to use
- 🔜 **Coming Soon** — Planned for upcoming releases
- ❌ **Not Available** — Not currently supported

## Currently Available in AutoClaw

### WebChat

The WebChat interface is available immediately when you deploy AutoClaw. No additional setup required.

**Features:**
- Browser-based, works on any device
- Real-time streaming responses
- File and image sharing
- Conversation history

**Access:**
1. Open your AutoClaw dashboard
2. Click on "WebChat" in the sidebar
3. Start chatting

## Coming Soon

We're actively working on enabling more channels. Priority order:

1. **WhatsApp** — Most requested, coming first
2. **Telegram** — Simple setup via bot token
3. **Discord** — Popular for developer communities
4. **Slack** — Workplace integration

<Note>
Want a specific channel prioritized? [Let us know](/help/support) and we'll factor it into our roadmap.
</Note>

## Channel Features by Platform

Not all channels support all features. Here's what works where:

| Feature | WebChat | WhatsApp | Telegram | Discord | Slack |
|---------|:-------:|:--------:|:--------:|:-------:|:-----:|
| Text messages | ✅ | ✅ | ✅ | ✅ | ✅ |
| Images | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voice notes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Documents | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reactions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Group chats | ✅ | ✅ | ✅ | ✅ | ✅ |
| Typing indicators | ✅ | ✅ | ✅ | ✅ | ❌ |
| Read receipts | ❌ | ✅ | ❌ | ❌ | ❌ |

## Self-Managed Channels

If you need a channel that AutoClaw doesn't yet support, you can:

1. Access your OpenClaw instance directly via the dashboard
2. Configure additional channels using OpenClaw's native configuration
3. Set up channel credentials and complete any required pairing

This requires more technical knowledge but gives you full access to OpenClaw's channel capabilities.

## Learn More

- [OpenClaw Channels Documentation](https://docs.openclaw.io/channels) — Full details on each channel
- [Channel Troubleshooting](https://docs.openclaw.io/channels/troubleshooting) — Common issues and solutions
