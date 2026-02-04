---
title: "Security"
description: "How AutoClaw keeps your data safe"
---

# Security

Security is a core priority for AutoClaw. Here's how we protect your data and your AI assistant.

## Infrastructure Security

### Private Networking

Every AutoClaw instance runs on a private [Tailscale](https://tailscale.com) network:

- **Not exposed to the public internet** — Your instance has no public IP
- **End-to-end encryption** — All traffic encrypted with WireGuard
- **Zero-trust architecture** — Every connection is authenticated

### Isolated Instances

Your OpenClaw instance runs in isolation:

- Dedicated container per customer
- No shared resources with other users
- Network isolation between instances

### Secure Hosting

Our infrastructure runs on enterprise-grade cloud providers:

- SOC 2 compliant data centers
- Regular security audits
- Automated patching and updates

## Data Security

### Encryption

| Data Type | At Rest | In Transit |
|-----------|:-------:|:----------:|
| Conversations | ✅ AES-256 | ✅ TLS 1.3 |
| API Keys | ✅ AES-256 | ✅ TLS 1.3 |
| Configuration | ✅ AES-256 | ✅ TLS 1.3 |
| Logs | ✅ AES-256 | ✅ TLS 1.3 |

### Credential Management

- API keys are encrypted at rest
- Keys are never logged or displayed in full
- Secrets are stored separately from application data

### Data Retention

- Conversations are retained until you delete them
- Logs are retained for 30 days
- You can export or delete your data at any time

## Authentication

### Account Security

- Password hashing with bcrypt
- Optional two-factor authentication (2FA)
- OAuth support (Google, GitHub)
- Session management with secure tokens

### Gateway Authentication

Your OpenClaw Gateway requires authentication:

- Gateway token generated during setup
- Tokens are rotated automatically
- Failed auth attempts are rate-limited

## Skill Security

### Vetted Skills Only

Every skill in the AutoClaw catalog is security-reviewed:

- Code auditing for malicious behavior
- API credential handling verification
- Sandboxed execution where possible
- Clear permission scopes

### OAuth Best Practices

For OAuth-connected skills:

- Minimal permission scopes requested
- Tokens stored encrypted
- Automatic token refresh
- Revocation support

### Sandboxing

Skills that execute code run in sandboxed environments:

- Limited file system access
- Network restrictions
- Resource limits (CPU, memory)
- Time limits

## Agent Security

### Tool Policies

Control what your agent can do:

- **Elevated tools** — Require explicit approval for dangerous operations
- **Sandboxed execution** — Code runs in restricted environments
- **Approval workflows** — Human-in-the-loop for sensitive actions

### Rate Limiting

Protect against runaway agents:

- Message rate limits
- Token usage limits
- Tool call limits

## Access Control

### User Permissions

| Role | Capabilities |
|------|--------------|
| **Owner** | Full access, billing, delete instance |
| **Admin** | Configuration, skills, channels |
| **User** | Chat, view dashboard |

### Audit Logging

All actions are logged:

- Who performed the action
- What action was taken
- When it occurred
- Success or failure

View audit logs in **Settings → Security → Audit Log**.

## Incident Response

If a security issue occurs:

1. **Detection** — Automated monitoring detects anomalies
2. **Containment** — Affected resources are isolated
3. **Investigation** — Our team investigates the cause
4. **Resolution** — Issue is fixed and verified
5. **Communication** — Affected users are notified

## Reporting Security Issues

Found a security vulnerability? Contact us:

- Email: security@autoclaw.io
- We respond within 24 hours
- Responsible disclosure is appreciated

## Compliance

AutoClaw is designed with compliance in mind:

- GDPR data handling
- Data export and deletion support
- Audit logging for accountability

## Learn More

- [OpenClaw Security](https://docs.openclaw.io/gateway/security) — Gateway security details
- [Sandboxing](https://docs.openclaw.io/gateway/sandboxing) — How code execution is sandboxed
