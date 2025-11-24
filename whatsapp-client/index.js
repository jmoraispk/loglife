const { createClient } = require('./client/whatsapp');
const { startServer } = require('./api/server');

async function main() {
    try {
        // Start WhatsApp client (wait for initialization)
        await createClient();
        
        // Start API server
        startServer();
    } catch (err) {
        console.error("Failed to start:", err);
        process.exit(1);
    }
}

main();