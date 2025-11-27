// safe restart logic

const { stopKeepAlive } = require('./keepalive');
const { waitForEvent } = require('../utils/helpers');

let restartingClient = false;
let pendingRestartPromise = null;

async function restartClient(client, createClientFn, reason = "") {
    if (restartingClient) {
        return pendingRestartPromise;
    }

    restartingClient = true;

    pendingRestartPromise = (async () => {
        try {
            console.log(`♻️ Restarting WhatsApp client... ${reason}`);

            // Stop keep-alive timer to prevent leak
            stopKeepAlive();

            if (client) {
                try {
                    await client.destroy();
                } catch (err) {
                    console.warn("Error during client.destroy():", err.message || err);
                }
            }

            // Recreate new client instance
            const newClient = await createClientFn();

            // Wait until WhatsApp is fully ready (with timeout)
            await waitForEvent(newClient, "ready", 60000); // 60s timeout

            return newClient;

        } finally {
            restartingClient = false;
            pendingRestartPromise = null;
        }
    })();

    return pendingRestartPromise;
}

module.exports = {
    restartClient
};
