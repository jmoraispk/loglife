# 🚀 Remote Deployment

This guide details the manual steps to deploy the LogLife application to the remote server (Dev Environment).

## 📋 Prerequisites

*   **Server Access**: SSH access to the target server.
*   **Systemd**: The backend service (`loglife-dev`) should be configured with the necessary environment variables (e.g., `FLASK_ENV`, `PORT`).

## 🔄 Deployment Steps

### 1. Update Codebase
SSH into the server and pull the latest changes from the repository.

```bash
cd /home/ali/loglife-dev
git pull
```

### 2. Restart Backend Services
Restart the Python backend service.

```bash
sudo systemctl restart loglife-dev
# Restart the database service if needed
sudo systemctl restart life-bot-db.service
```

### 3. Update WhatsApp Client
The Node.js client runs inside a `screen` session named `loglife`.

```bash
cd /home/ali/loglife-dev/whatsapp-client
npm ci --only=production

# Kill existing session (if any)
screen -S loglife -X quit || true

# Start new session detached
screen -S loglife -dm node index.js
```

### 4. Deploy Documentation
Build the static site and copy it to the Nginx web root.

```bash
cd /home/ali/loglife-dev
uv run mkdocs build

# Deploy to web server directory
sudo cp -r site/* /var/www/docs.loglife.co/
sudo systemctl reload nginx
```

## 🏭 Production differences

For the **Production** environment:
*   Directory: `/home/ali/loglife-prod`
*   Service: `loglife-prod` (Environment `FLASK_ENV=production`, `PORT=5001`)
