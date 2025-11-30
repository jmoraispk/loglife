const { Client, LocalAuth } = require('whatsapp-web.js');
const fetch = require('node-fetch');
const qrcode = require('qrcode-terminal');
const express = require('express');
const os = require('os');

require('dotenv').config();

const CLEAR_SESSION = process.argv.includes('--reset-session');
const SESSION_PATH = './session';

if (CLEAR_SESSION) {
    const fs = require('fs');
    fs.rmSync(SESSION_PATH, { recursive: true, force: true });
    console.log('🧹 Session cleared. Restart to rescan QR code.');
    process.exit();
}

const isRoot = process.getuid && process.getuid() === 0;

let client;
let restartingClient = false;
let pendingRestartPromise = null;
let lastReadyAt = null;
let keepAliveTimer = null;
const KEEPALIVE_MS = Number(process.env.KEEPALIVE_MS || 120000);

async function keepAliveTick() {
    if (!client) return;
    if (restartingClient) return;
    try {
        const state = await client.getState();
        if (!state || state === 'CONFLICT' || state === 'UNLAUNCHED' || state === 'DISCONNECTED') {
            console.warn('KeepAlive detected bad state:', state);
            await restartClient(`keepalive_bad_state_${state || 'UNKNOWN'}`);
        }
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        if (msg.includes('detached Frame')) {
            console.warn('KeepAlive detected detached frame. Restarting client...');
            await restartClient('keepalive_detached_frame');
        } else {
            console.warn('KeepAlive getState failed:', msg);
        }
    }
}

function startKeepAlive() {
    if (keepAliveTimer) return;
    keepAliveTimer = setInterval(() => {
        // fire and forget; internal logic is guarded
        keepAliveTick();
    }, KEEPALIVE_MS);
}

function createClient() {
    const newClient = new Client({
        authStrategy: new LocalAuth({ clientId: "goal-bot-session" }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for Ubuntu servers with AppArmor restrictions
        }
    });

    newClient.on('qr', qr => {
        qrcode.generate(qr, { small: true });
    });

    newClient.on('ready', () => {
        console.log('WhatsApp bot is ready!');
        lastReadyAt = Date.now();
        startKeepAlive();
    });

    newClient.on('auth_failure', (msg) => {
        console.error('Auth failure:', msg);
        // Trigger a guarded restart to recover
        restartClient('auth_failure').catch(() => {});
    });

    newClient.on('disconnected', (reason) => {
        console.warn('Client disconnected:', reason);
        // Trigger a guarded restart to recover
        restartClient('disconnected').catch(() => {});
    });

    newClient.on('message', async msg => {
        try {
            const phoneNumber = msg.from.split('@')[0];

            // console.log(msg);

			// Standardized payload with exactly three top-level keys
			const payload = {
				sender: phoneNumber,
				raw_msg: '',
				msg_type: msg.type,
				client_type: 'whatsapp'
			};

			// Populate raw_msg based on message type
			const isAudio = msg.hasMedia && (msg.type === 'ptt' || msg.type === 'audio');
			if (isAudio) {
				try {
					const media = await msg.downloadMedia();
					if (media) {
						// raw_msg should be string only: send base64 data only
						payload.raw_msg = typeof media.data === 'string' ? media.data : '';
					} else {
						payload.raw_msg = '';
					}
				} catch (mediaErr) {
					console.error('Failed to download media:', mediaErr);
					payload.raw_msg = '';
				}
			} else if (msg.type === 'vcard') {
					payload.raw_msg = JSON.stringify(msg.vCards);
			} else {
				// Text/other: send text body as string
				payload.raw_msg = typeof msg.body === 'string' ? msg.body : '';
			}
			
            const response = await fetch(process.env.PY_BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    const errorMessage = errorData?.data?.message || errorData?.message || 'Sorry, I encountered an error processing your message. Please try again.';
                    console.error(`❌ Backend error (${response.status}):`, JSON.stringify(errorData).substring(0, 500));
                    await newClient.sendMessage(msg.from, errorMessage);
                } catch (parseErr) {
                    const errorText = await response.text();
                    console.error(`❌ Backend error (${response.status}):`, errorText.substring(0, 500));
                    await newClient.sendMessage(msg.from, 'Sorry, I encountered an error processing your message. Please try again.');
                }
                return;
            }

            const responseData = await response.json();
            if (responseData.success && responseData.data && responseData.data.message) {
                newClient.sendMessage(msg.from, responseData.data.message);
            } else {
                // Fallback if response structure is unexpected
                const fallbackMessage = responseData?.data?.message || responseData?.message || 'Sorry, I encountered an error processing your message. Please try again.';
                newClient.sendMessage(msg.from, fallbackMessage);
            }
        } catch (err) {
            console.error('Failed to fetch from backend:', err);
            try {
                await newClient.sendMessage(msg.from, 'Sorry, I encountered a system error. Please try again.');
            } catch (sendErr) {
                console.error('Failed to send error message:', sendErr);
            }
        }
    });

    client = newClient;
    return newClient.initialize();
}

async function restartClient(reason) {
    if (restartingClient) {
        return pendingRestartPromise;
    }
    restartingClient = true;
    pendingRestartPromise = (async () => {
        try {
            console.log('Restarting WhatsApp client...', reason ? `Reason: ${reason}` : '');
            if (client) {
                try {
                    await client.destroy();
                } catch (e) {
                    console.warn('Error during client.destroy():', e.message || e);
                }
            }
            await createClient();
            // Wait for ready event before proceeding
            await new Promise((resolve) => {
                if (client && client.info && client.info.wid) return resolve();
                client.once('ready', resolve);
            });
        } finally {
            restartingClient = false;
            pendingRestartPromise = null;
        }
    })();
    return pendingRestartPromise;
}

// Express server setup
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Helper function to check if client is ready
function isClientReady() {
    return client && client.info && client.info.wid;
}

// Endpoint to send WhatsApp message
app.post('/send-message', async (req, res) => {
    try {
        const { number, message } = req.body;
        
        // Validate input
        if (!number || !message) {
            return res.status(400).json({ 
                error: 'Both number and message are required' 
            });
        }
        
        // Check if client is ready
        if (!isClientReady()) {
            return res.status(503).json({ 
                error: 'WhatsApp client is not connected. Please scan QR code first.' 
            });
        }
        
        // Format number for WhatsApp (add @c.us if not present)
        let formattedNumber = number;
        if (!formattedNumber.includes('@c.us')) {
            // Remove any non-digit characters (expecting full number with country code)
            formattedNumber = formattedNumber.replace(/\D/g, '');
            formattedNumber = formattedNumber + '@c.us';
        }
        
        // Send message with one guarded retry on frame detachment
        const trySend = async () => client.sendMessage(formattedNumber, message);
        try {
            await trySend();
        } catch (err) {
            if (String(err.message || err).includes('detached Frame')) {
                // Restart client safely, then retry once
                if (restartingClient && pendingRestartPromise) {
                    await pendingRestartPromise; // wait ongoing restart
                } else {
                    await restartClient('detached_frame');
                }
                await trySend();
            } else {
                throw err;
            }
        }
        
        res.json({ 
            success: true, 
            message: 'Message sent successfully',
            to: formattedNumber
        });
        
    } catch (error) {
        console.error('Error sending message:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to send message';
        if (String(error.message || error).includes('detached Frame')) {
            errorMessage = 'Temporary WhatsApp Web issue. Please retry.';
        } else if (String(error.message || error).includes('not connected')) {
            errorMessage = 'WhatsApp client is not connected. Please scan QR code first.';
        }
        
        res.status(500).json({ 
            error: errorMessage,
            details: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Send messages via POST /send-message`);
});

// Initialize client for the first time
createClient().catch(err => {
    console.error('Failed to initialize WhatsApp client:', err);
});