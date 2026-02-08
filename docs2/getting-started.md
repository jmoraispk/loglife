---
title: "Getting Started"
description: "Deploy your OpenClaw instance in 5 minutes"
---

# Getting Started

Get your personal AI assistant running in just a few steps.

## Prerequisites

Before you begin, you'll need:

1. **An AutoClaw account** — [Sign up here](https://autoclaw.io/signup)
2. **An AI provider API key** — Anthropic (Claude) or OpenAI

## Step 1: Sign Up

Create your AutoClaw account at [autoclaw.io/signup](https://autoclaw.io/signup).

You can sign up with:
- Email and password
- Google OAuth
- GitHub OAuth

## Step 2: Connect Your AI Provider

After signing up, connect your preferred AI provider:

1. Go to **Settings → API Keys**
2. Add your Anthropic or OpenAI API key
3. AutoClaw will validate the key and show available models

<Note>
AutoClaw supports bring-your-own-key (BYOK) so you maintain full control over your AI costs and usage.
</Note>

## Step 3: Deploy

Click the **Deploy** button. AutoClaw will:

1. Provision a cloud server for you
2. Install the latest stable OpenClaw release
3. Configure Tailscale networking for secure access
4. Set up the Gateway with hardened defaults
5. Start your AI agent

This typically takes 2-3 minutes.

## Step 4: Start Chatting

Once deployed, you can immediately start chatting via the built-in **WebChat** interface:

1. Click **Open Dashboard** to access the OpenClaw control UI
2. Navigate to **WebChat** 
3. Start talking to your AI assistant

## Step 5: Configure Skills (Optional)

AutoClaw comes with a curated set of vetted skills. To add more:

1. Go to **Skills** in your dashboard
2. Browse available skills
3. Click **Enable** on the ones you want
4. For OAuth-based skills (Gmail, GitHub), click **Connect** to authorize

## Next Steps

- [Add more chat channels](/features/channels) — Connect WhatsApp, Telegram, Discord, and more
- [Explore all skills](/features/skills) — See the full list of available integrations
- [Track your costs](/platform/cost-tracking) — Monitor API usage across providers
- [Learn the architecture](/how-it-works) — Understand how AutoClaw works under the hood

## Need Help?

- Check the [FAQ](/help/faq) for common questions
- Contact [support](/help/support) for assistance
