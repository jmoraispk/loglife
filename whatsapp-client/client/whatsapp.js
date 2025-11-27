// WhatsApp initialization & event wiring

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const { handleIncomingMessage } = require('../logic/message');
const { restartClient } = require('./restart');
const { startKeepAlive } = require('./keepalive');

let client = null;

// Expose current client to API (routes.js)
function getClient() {
    return client;
}

async function createClient() {
    const newClient = new Client({
        authStrategy: new LocalAuth({ clientId: "goal-bot-session" }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    // ----- EVENTS -----

    newClient.on('qr', qr => {
        qrcode.generate(qr, { small: true });
    });

    newClient.on('ready', () => {
        console.log("📱 WhatsApp bot is ready!");
        startKeepAlive(newClient, createClient); 
    });

    newClient.on('auth_failure', msg => {
        console.error("❌ Auth failure:", msg);
        restartClient(newClient, createClient, "auth_failure");
    });

    newClient.on('disconnected', reason => {
        console.warn("⚠️ Disconnected:", reason);
        restartClient(newClient, createClient, "disconnected");
    });

    newClient.on('message', msg => {
        handleIncomingMessage(msg, newClient);
    });

    // Save reference
    client = newClient;

    // Initialize WhatsApp Web session
    try {
        await newClient.initialize();
        return newClient;
    } catch (err) {
        console.error("❌ Failed to initialize WhatsApp client:", err.message || err);
        
        // Clean up failed client
        try {
            await newClient.destroy();
        } catch (destroyErr) {
            console.warn("Error destroying failed client:", destroyErr.message);
        }
        
        client = null;
        throw err; // Re-throw to let caller handle it
    }
}

module.exports = {
    createClient,
    getClient
};
