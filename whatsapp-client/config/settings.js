// Backend URL for Python server
const BACKEND_URL = "http://127.0.0.1:5000/webhook";

// Port for Express server
const PORT = 3000;

// WhatsApp keep-alive interval (ms)
const KEEPALIVE_MS = 120000; // 2 minutes

module.exports = {
    BACKEND_URL,
    PORT,
    KEEPALIVE_MS
};