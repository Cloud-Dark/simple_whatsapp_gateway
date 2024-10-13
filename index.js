require('dotenv').config();
const express = require('express');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const NodeCache = require('node-cache');
const bodyParser = require('body-parser');
const axios = require('axios');
const Pino = require('pino');
const qrcode = require('qrcode-terminal'); // Import qrcode-terminal

// Setup cache and Express app
const msgRetryCounterCache = new NodeCache();
const app = express();
app.use(bodyParser.json());

// Initialize Pino logger
const logger = Pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    },
    level: 'info',
});

const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

let sock;

// Start WhatsApp connection
const startSock = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        logger: logger,
        printQRInTerminal: false, // Disable automatic printing by Baileys
        msgRetryCounterCache,
    });

    // Manually print the QR code using qrcode-terminal
    sock.ev.on('connection.update', (update) => {
        const { connection, qr, lastDisconnect } = update;
        if (qr) {
            qrcode.generate(qr, { small: true }); // Print the QR code in terminal
        }
        if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
            logger.warn('Connection closed, reconnecting...');
            startSock(); // reconnect if not logged out
        } else if (connection === 'open') {
            logger.info('WhatsApp connection opened!');
        }
    });

    // Handling incoming messages with try-catch for safety
    sock.ev.on('messages.upsert', async (messageUpdate) => {
        if (messageUpdate.type === 'notify') {
            for (const msg of messageUpdate.messages) {
                if (!msg.key.fromMe) {
                    try {
                        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

                        // Check if the message contains "ping"
                        if (text.toLowerCase() === 'ping') {
                            // Reply with "pong"
                            await sock.sendMessage(msg.key.remoteJid, { text: 'pong' });
                            logger.info('Replied with pong');
                        } else {
                            // Default reply for other messages
                            await sock.sendMessage(msg.key.remoteJid, { text: 'Hello! Received your message.' });
                            logger.info('Reply sent');
                        }

                        // Send the received message to the webhook
                        try {
                            await axios.post(WEBHOOK_URL, {
                                from: msg.key.remoteJid,
                                message: text,
                                raw: msg
                            });
                            logger.info('Message sent to webhook');
                        } catch (error) {
                            logger.error('Error sending message to webhook', error);
                        }
                    } catch (error) {
                        logger.error('Error processing message', error);
                    }
                }
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
};

// Webhook route to receive POST requests
app.post('/webhook', (req, res) => {
    logger.info('Webhook received:', req.body);
    res.status(200).send('Webhook received');
});

// Start server and WhatsApp connection
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    startSock();
});
