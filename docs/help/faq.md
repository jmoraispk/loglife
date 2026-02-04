---
title: "FAQ"
description: "Frequently asked questions about AutoClaw"
---

# Frequently Asked Questions

Common questions about AutoClaw answered.

## General

### What is AutoClaw?

AutoClaw is a managed deployment platform for [OpenClaw](https://docs.openclaw.io), an open-source personal AI assistant. We handle all the infrastructure—servers, networking, updates—so you can focus on using your AI agent.

### What is OpenClaw?

OpenClaw is a powerful open-source project that bridges AI agents (like Claude or GPT) to messaging platforms. It supports 20+ chat channels, 50+ skills, and runs on multiple platforms. AutoClaw makes deploying OpenClaw effortless.

### Why use AutoClaw instead of self-hosting OpenClaw?

Self-hosting OpenClaw requires:
- Renting and managing a VPS
- Setting up networking (SSH, Tailscale)
- Installing dependencies and building OpenClaw
- Managing updates and security patches
- Troubleshooting when things break

AutoClaw handles all of this. One click and you're running.

### Is AutoClaw free?

AutoClaw has a subscription fee for managed hosting. You also pay for AI API usage (either through your own keys or pooled credits). See our [pricing page](https://autoclaw.io/pricing) for details.

## Technical

### What AI providers are supported?

Currently supported:
- **Anthropic** — Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **OpenAI** — GPT-4o, GPT-4o mini, GPT-4 Turbo

More providers coming soon.

### Can I use my own API keys?

Yes! AutoClaw supports Bring Your Own Keys (BYOK). You add your API keys and pay the providers directly. AutoClaw just tracks usage.

### Which chat channels are available?

Currently, **WebChat** is fully available. WhatsApp, Telegram, Discord, and other channels are coming soon. See the [channels page](/features/channels) for the full roadmap.

### Can I access the full OpenClaw configuration?

Yes. AutoClaw provides access to the native OpenClaw Control UI for advanced configuration. Click **Advanced → OpenClaw UI** in your dashboard.

### Where does my instance run?

Your OpenClaw instance runs on cloud infrastructure in a private Tailscale network. It's not exposed to the public internet.

### Can I SSH into my instance?

Direct SSH access is not provided in the standard plan. For advanced debugging needs, contact support.

## Account & Billing

### How do I sign up?

Visit [autoclaw.io/signup](https://autoclaw.io/signup) to create an account.

### What payment methods do you accept?

We accept credit/debit cards via Stripe.

### Can I cancel anytime?

Yes. You can cancel your subscription at any time. Your instance will remain active until the end of your current billing period.

### What happens to my data if I cancel?

When you cancel:
1. Your instance stops at the end of the billing period
2. Data is retained for 30 days
3. You can export your data during this period
4. After 30 days, data is permanently deleted

### Do you offer refunds?

Contact support within 7 days of your first subscription payment for a refund. After that, we pro-rate based on usage.

## Features

### What skills are available?

50+ skills including Gmail, GitHub, Calendar, Browser, Weather, and more. See the [skills page](/features/skills) for the full list.

### Are skills secure?

Yes. Every skill in the AutoClaw catalog is security-reviewed by our team. We don't allow unvetted community skills.

### Can I add custom skills?

Custom skill support is coming soon. For now, you're limited to the vetted skills in our catalog.

### Does AutoClaw support voice?

Voice features (Voice Wake, Talk Mode, TTS) require the macOS or iOS companion apps. The WebChat interface is text-only.

### Can I use multiple AI agents?

Yes. OpenClaw supports multi-agent configurations where different channels or users route to different agents. Configure this in the OpenClaw Control UI.

## Troubleshooting

### My instance won't start

Try these steps:
1. Check your API key is valid in **Settings → API Keys**
2. Click **Restart** in your dashboard
3. Check **Logs** for error messages
4. Contact support if the issue persists

### WebChat isn't loading

1. Clear your browser cache
2. Try a different browser
3. Check if your instance is running in the dashboard
4. Contact support if the issue persists

### I'm not getting responses from the agent

1. Check your AI provider API key is valid
2. Verify you have API credits with your provider
3. Check **Logs** for error messages
4. Try sending a simple message like "Hello"

### How do I reset my instance?

1. Go to **Settings → Instance**
2. Click **Reset Instance**
3. Confirm the action
4. This clears all conversations and settings

<Warning>
Resetting is irreversible. Export any data you want to keep first.
</Warning>

## Contact

### How do I get help?

- Check this FAQ first
- Review the [OpenClaw documentation](https://docs.openclaw.io)
- Contact [support](/help/support)

### How do I report a bug?

Email support@autoclaw.io with:
1. What you expected to happen
2. What actually happened
3. Steps to reproduce
4. Any error messages or screenshots

### How do I request a feature?

Email hello@autoclaw.io with your feature request. We prioritize based on demand.
