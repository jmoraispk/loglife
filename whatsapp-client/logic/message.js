// handles incoming WhatsApp messages

const fetch = require('node-fetch');
const { BACKEND_URL } = require('../config/settings');
const { extractPhoneNumber, extractReply, safeSendMessage } = require('../utils/helpers');
const { MessageMedia } = require('whatsapp-web.js');

async function handleIncomingMessage(msg, client) {
    // Extract message properties
    const from = msg.from;
    const msgType = msg.type;
    const hasMedia = msg.hasMedia;
    const body = msg.body;
    const vCards = msg.vCards;

    try {
        const phoneNumber = extractPhoneNumber(from);

        // Base payload structure
        const payload = {
            sender: phoneNumber,
            raw_msg: '',
            msg_type: msgType
        };

        // Handle Audio
        const isAudio = hasMedia && (msgType === 'ptt' || msgType === 'audio');
        if (isAudio) {
            try {
                const media = await msg.downloadMedia();
                payload.raw_msg = media?.data || '';
            } catch (err) {
                console.error("Failed to download media:", err);
                payload.raw_msg = '';
            }
        }
        // Handle vCard
        else if (msgType === 'vcard') {
            payload.raw_msg = JSON.stringify(vCards);
        }
        // Handle text or anything else
        else {
            payload.raw_msg = body || '';
        }

        // Send to backend
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        // Handle backend response errors
        if (!response.ok) {
            const fallback = `Server error (${response.status}). Try again later.`;
            await client.sendMessage(from, fallback);
            return;
        }

        const data = await response.json();

        // Send transcript file if available
        const transcriptFile = data?.data?.transcript_file || '';
        if (transcriptFile) {
            const base64TranscriptData = transcriptFile
                .replace(/^data:.*?;base64,/, '')  // Remove data URL prefix if present
                .replace(/\s/g, '');                // Remove whitespace/newlines

            if (base64TranscriptData) {
                const media = new MessageMedia('text/plain', base64TranscriptData, 'transcript.txt');
                await client.sendMessage(from, media);
            }
        }

        // Determine reply
        const reply = extractReply(data);

        await client.sendMessage(from, reply);

    } catch (err) {
        console.error("Message handler error:", err);
        await safeSendMessage(client, from, "System error. Please try again.");
    }
}

module.exports = {
    handleIncomingMessage
};
