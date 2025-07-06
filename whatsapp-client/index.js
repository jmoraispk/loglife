const { Client, LocalAuth } = require('whatsapp-web.js');
const fetch = require('node-fetch');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const CLEAR_SESSION = process.argv.includes('--reset-session');
const SESSION_PATH = './session';

if (CLEAR_SESSION) {
    const fs = require('fs');
    fs.rmSync(SESSION_PATH, { recursive: true, force: true });
    console.log('🧹 Session cleared. Restart to rescan QR code.');
    process.exit();
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "goal-bot-session" })
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
});

client.on('message', async msg => {
    if (msg.body.toLowerCase().startsWith("bot:")) {
        try {
            const response = await fetch(process.env.PY_BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg.body, from: msg.from })
                // TODO: check if images can be sent/received
            });
            const text = await response.text();
            client.sendMessage(msg.from, text);
        } catch (err) {
            console.error("Failed to fetch from backend:", err);
        }
    }
});

client.initialize();
