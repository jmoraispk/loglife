---
title: "Skills & Integrations"
description: "Extend your AI assistant with powerful tools"
---

# Skills & Integrations

Skills are integrations that give your AI assistant new capabilities. Connect to external services, automate tasks, and extend what your agent can do.

## Vetted for Security

Every skill in the AutoClaw catalog is **security-reviewed by our team**. We verify:

- No malicious code or data exfiltration
- Proper API credential handling
- Sandboxed execution where possible
- Clear permission scopes

This is a key difference from running OpenClaw yourself, where community skills may not have been audited.

## Available Skills

### Communication

| Skill | Description | Auth Type |
|-------|-------------|-----------|
| **Gmail** | Read, send, and manage emails | OAuth |
| **Calendar** | Schedule and manage events | OAuth |
| **Contacts** | Access and search contacts | OAuth |

### Development

| Skill | Description | Auth Type |
|-------|-------------|-----------|
| **GitHub** | Manage repos, PRs, issues, and code | OAuth |
| **Coding Agent** | Write, edit, and refactor code | None |
| **Git** | Version control operations | None |

### Productivity

| Skill | Description | Auth Type |
|-------|-------------|-----------|
| **Notes** | Apple Notes, Obsidian, Notion integration | Varies |
| **Reminders** | Apple Reminders, Things, Todoist | Varies |
| **Trello** | Board and card management | API Key |

### Utilities

| Skill | Description | Auth Type |
|-------|-------------|-----------|
| **Browser** | Browse the web, take screenshots | None |
| **Weather** | Get weather forecasts | None |
| **Web Search** | Search the internet | API Key |
| **File System** | Read and write local files | None |

### Smart Home

| Skill | Description | Auth Type |
|-------|-------------|-----------|
| **Hue Lights** | Control Philips Hue | API Key |
| **Sonos** | Control Sonos speakers | None |
| **HomeKit** | Apple HomeKit devices | macOS only |

### Media

| Skill | Description | Auth Type |
|-------|-------------|-----------|
| **Spotify** | Music playback and playlists | OAuth |
| **Apple Music** | Music playback | macOS only |
| **Photos** | Access photo library | macOS only |

### Security

| Skill | Description | Auth Type |
|-------|-------------|-----------|
| **1Password** | Password and secret access | CLI |

## Enabling Skills

### Pre-enabled Skills

Some skills are enabled by default in every AutoClaw instance:

- **Coding Agent** — Code writing and editing
- **Browser** — Web browsing
- **File System** — Local file access
- **Weather** — Weather forecasts

### OAuth Skills

For skills that use OAuth (Gmail, GitHub, Calendar, etc.):

1. Go to **Skills** in your dashboard
2. Find the skill you want to enable
3. Click **Connect**
4. Complete the OAuth authorization flow
5. The skill is now active

### API Key Skills

For skills that require an API key:

1. Go to **Skills** in your dashboard
2. Find the skill you want to enable
3. Click **Configure**
4. Enter your API key
5. Click **Save**

## Skill Permissions

Each skill has defined permissions that control what it can do:

| Permission | Description |
|------------|-------------|
| **read** | Can read data from the service |
| **write** | Can create or modify data |
| **delete** | Can remove data |
| **admin** | Full administrative access |

You can review and adjust permissions for each skill in your dashboard.

## Requesting New Skills

Want a skill that isn't available yet? [Contact us](/help/support) with:

1. The service you want to integrate
2. What actions you'd like the agent to perform
3. Any relevant API documentation

We'll evaluate the request and prioritize based on demand and security considerations.

## Learn More

- [OpenClaw Skills Documentation](https://docs.openclaw.io/tools/skills) — Full skill details
- [Skills Configuration](https://docs.openclaw.io/tools/skills-config) — Advanced configuration
