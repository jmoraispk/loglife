// shared utility functions

// Normalize a phone number to WhatsApp format
function formatWhatsAppNumber(number) {
    if (!number) return "";
    
    // If already formatted
    if (number.includes('@c.us')) return number;

    // Remove all non-digits
    const digits = number.replace(/\D/g, '');

    return digits + '@c.us';
}

// Extract phone number from WhatsApp ID (removes @c.us suffix)
function extractPhoneNumber(whatsappId) {
    return whatsappId?.split('@')[0] || 'unknown';
}

// Extract reply message from backend response
function extractReply(data, fallback = "Sorry, I couldn't process your message.") {
    return data?.data?.message || data?.message || fallback;
}

// Safely send a message (catches errors)
async function safeSendMessage(client, to, text) {
    try {
        await client.sendMessage(to, text);
    } catch (err) {
        console.error("Failed to send message:", err);
    }
}

// Wait for an event with timeout
function waitForEvent(emitter, event, timeoutMs = 30000) {
    return Promise.race([
        new Promise(resolve => emitter.once(event, resolve)),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeoutMs)
        )
    ]);
}

// Create standard success response
function createSuccessResponse(message, data = null) {
    return {
        success: true,
        message,
        data
    };
}

// Create standard error response
function createErrorResponse(message) {
    return {
        success: false,
        message,
        data: null
    };
}

module.exports = {
    formatWhatsAppNumber,
    extractPhoneNumber,
    extractReply,
    safeSendMessage,
    waitForEvent,
    createSuccessResponse,
    createErrorResponse
};