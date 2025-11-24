// keep-alive monitoring

const { KEEPALIVE_MS } = require('../config/settings');
const { restartClient } = require('./restart');

let keepAliveTimer = null;

function startKeepAlive(client, createClientFn) {
    // Clear any existing timer first
    if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
    }

    keepAliveTimer = setInterval(async () => {
        if (!client) return;

        try {
            const state = await client.getState();

            if (!state || ["CONFLICT", "UNLAUNCHED", "DISCONNECTED"].includes(state)) {
                console.warn("⚠️ KeepAlive: bad state:", state);
                await restartClient(client, createClientFn, "keepalive_bad_state");
            }

        } catch (err) {
            const msg = String(err?.message || err);
            if (msg.includes("detached Frame")) {
                console.warn("⚠️ KeepAlive: detached frame, restarting...");
                await restartClient(client, createClientFn, "keepalive_detached_frame");
            } else {
                console.warn("⚠️ KeepAlive: getState failed:", msg);
            }
        }
    }, KEEPALIVE_MS);
}

function stopKeepAlive() {
    if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
    }
}

module.exports = {
    startKeepAlive,
    stopKeepAlive
};
