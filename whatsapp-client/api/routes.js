// API endpoints

const express = require('express');
const router = express.Router();
const { getClient } = require('../client/whatsapp');
const { formatWhatsAppNumber, createSuccessResponse, createErrorResponse } = require('../utils/helpers');

// /send-message  → POST
router.post('/send-message', async (req, res) => {
    try {
        const { number, message } = req.body;

        if (!number || !message) {
            return res.status(400).json(
                createErrorResponse("Both 'number' and 'message' are required")
            );
        }

        const client = getClient();
        if (!client || !client.info || !client.info.wid) {
            return res.status(503).json(
                createErrorResponse("WhatsApp client not ready. Scan QR first.")
            );
        }

        // Format the WhatsApp number
        const formatted = formatWhatsAppNumber(number);

        await client.sendMessage(formatted, message);

        res.json(
            createSuccessResponse("Message sent successfully", { to: formatted })
        );

    } catch (err) {
        console.error("API error:", err);

        res.status(500).json(
            createErrorResponse(`Failed to send message: ${err.message}`)
        );
    }
});

module.exports = router;
