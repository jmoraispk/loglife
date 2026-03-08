# LogLife Ops: Top 5 Commands

```bash
# 1) Gateway token (Control UI login)
openclaw config get gateway.auth.token

# 2) LogLife API key (/loglife/* Bearer)
jq -r '.plugins.entries.loglife.config.apiKey' ~/.openclaw/openclaw.json

# 3) Gateway health
openclaw health

# 4) Channel/link status
openclaw channels status --probe

# 5) Watch registered users
bash plugin/scripts/check-registered-users.sh --watch --interval 2
```
