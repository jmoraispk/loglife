# 🚀 Remote Deployment

This guide details the manual steps to deploy the LogLife application to the remote servers. These steps mirror our CI/CD pipeline.

## 📋 Prerequisites

*   **Server Access**: SSH access to the target server.
*   **Systemd**: The backend services (`loglife-dev` or `loglife-prod`) should be configured with the necessary environment variables.
    *   **Dev**: Defaults to port `5000`.
    *   **Prod**: Sets `PORT=5001` via systemd (required by `src/loglife/main.py`).

## 🔄 Deployment Steps

### 1. Update Codebase
SSH into the server and pull the latest changes from the repository.

**Dev:**
```bash
cd /home/ali/loglife-dev
git pull
```

**Prod:**
```bash
cd /home/ali/loglife-prod
git pull
```

### 2. Restart Backend Services
Restart the Python backend and database services.

**Dev:**
```bash
sudo systemctl restart loglife-dev
sudo systemctl restart loglife-db-dev.service
```

**Prod:**
```bash
sudo systemctl restart loglife-prod
# sudo systemctl restart loglife-db-prod.service # (If applicable)
```

### 3. Update WhatsApp Client
The Node.js client runs inside a `screen` session.

**Dev (Session: `loglife-dev`):**
```bash
cd /home/ali/loglife-dev/whatsapp-client
npm ci --only=production
screen -S loglife-dev -X quit || true
screen -S loglife-dev -dm node index.js
```

**Prod (Session: `loglife-prod`):**
```bash
cd /home/ali/loglife-prod/whatsapp-client
npm ci --only=production
screen -S loglife-prod -X quit || true
screen -S loglife-prod -dm node index.js
```

### 4. Deploy Documentation (Dev Only)
Documentation is typically deployed from the Dev environment.

```bash
cd /home/ali/loglife-dev
uv run mkdocs build
sudo cp -r site/* /var/www/docs.loglife.co/
sudo systemctl reload nginx
```
