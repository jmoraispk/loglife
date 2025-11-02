# Building Documentation

> **How to build and serve the documentation locally and on remote servers**

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Building Locally](#building-locally)
- [Building on Remote Server](#building-on-remote-server)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before building the documentation, ensure you have:

- **Python 3.11+** installed
- **uv** package manager installed
- Access to the `docs` directory in the repository

The documentation uses **Material for MkDocs** and all dependencies are managed via `uv`.

---

## Building Locally

To view the documentation locally with live reload:

1. Navigate to the `docs` directory:
   ```bash
   cd docs
   ```

2. Start the development server:
   ```bash
   uv run mkdocs serve
   ```

3. Open your browser and navigate to:
   ```
   http://127.0.0.1:8000
   ```

The development server will automatically reload when you make changes to the documentation files. Press `Ctrl+C` to stop the server.

### Local Build for Testing

To build the static site locally (without serving):

```bash
cd docs
uv run mkdocs build
```

This generates the static HTML files in the `docs/site/` directory, which you can inspect before deploying.

---

## Building on Remote Server

To build and deploy the documentation on a remote server:

### Step 1: Build the Documentation

Navigate to the docs directory and build the static site:

```bash
cd docs
uv run mkdocs build
```

This creates the static HTML files in the `docs/site/` directory.

### Step 2: Create Target Directory

Create the directory where the documentation will be served (replace with your domain/path):

```bash
sudo mkdir -p /var/www/docs.loglife.co
```

### Step 3: Copy Files to Web Server

Copy the built site files to the web server directory:

```bash
sudo cp -r /home/ali/new/life-bot/docs/site/* /var/www/docs.loglife.co/
```

> **Note:** Adjust the source path (`/home/ali/new/life-bot/docs/site/*`) and destination path (`/var/www/docs.loglife.co/`) according to your server setup.

### Step 4: Configure Nginx

Edit your Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/docs.loglife.co
```

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name docs.loglife.co;

    root /var/www/docs.loglife.co;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

### Step 5: Test and Reload Nginx

Test the Nginx configuration and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

If the configuration test passes, Nginx will reload and your documentation will be available at your configured domain.

---

## Troubleshooting

### Common Issues

**Issue:** `uv run mkdocs serve` fails
- **Solution:** Ensure you're in the `docs` directory and that `uv` and dependencies are properly installed.

**Issue:** Files not updating on server
- **Solution:** Make sure to rebuild the docs (`uv run mkdocs build`) after making changes and copy the new files to the server directory.

**Issue:** Nginx 403 Forbidden error
- **Solution:** Check that Nginx has read permissions for `/var/www/docs.loglife.co/` and that the directory contains the `index.html` file.

**Issue:** Nginx configuration test fails
- **Solution:** Check the Nginx error log with `sudo tail -f /var/log/nginx/error.log` and verify your configuration file syntax.

---

