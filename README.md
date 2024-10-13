# WhatsApp Baileys Bot with Webhook Integration

This project demonstrates a simple WhatsApp bot using the [Baileys](https://github.com/WhiskeySockets/Baileys) library to send and receive messages on WhatsApp. It integrates with a webhook to forward received messages to an external service.

## Features

- Automatically reconnects if the WhatsApp connection is lost.
- Receives incoming messages and replies based on their content.
  - Replies "pong" when the message contains "ping".
  - Replies with a default message for other inputs.
- Forwards received messages to a specified webhook.
- QR code generation for authentication directly in the terminal.

## Requirements

- Node.js v14 or higher
- WhatsApp account for connecting with Baileys
- Webhook service (e.g., [webhook.site](https://webhook.site) for testing)

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/whatsapp-baileys-bot.git
   cd whatsapp-baileys-bot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your environment variables by creating a `.env` file:

   ```bash
   touch .env
   ```

   Inside `.env`, add:

   ```bash
   PORT=3000
   WEBHOOK_URL=https://webhook.site/a99ced1f-44d7-4891-b60b-2b8d67c76f94
   ```

4. Run the application:

   ```bash
   node index.js
   ```

   This will start the bot on `http://localhost:3000`.

## How It Works

### WhatsApp Connection

The bot uses Baileys to establish a WhatsApp connection. Upon first run, it will prompt a QR code in the terminal for you to scan using WhatsApp Web.

### Receiving Messages

When a message is received, it checks if the message contains the word "ping". If so, it replies with "pong". For other messages, it replies with a default message: "Hello! Received your message."

The received message is also forwarded to the webhook URL set in your `.env` file.

### Example Response to Webhook

The bot sends a POST request to the webhook URL with the following payload:

```json
{
  "from": "628998937095@s.whatsapp.net",
  "message": "Ping",
  "raw": {
    "key": {
      "remoteJid": "628998937095@s.whatsapp.net",
      "fromMe": false,
      "id": "7DC8B1A6CF78DB8F3B8FA296C0E8101C"
    },
    "messageTimestamp": 1728810667,
    "pushName": "syah&",
    "broadcast": false,
    "message": {
      "conversation": "Ping",
      "messageContextInfo": {
        "deviceListMetadata": {
          "senderKeyHash": "o3hE83tpJ/D/FA==",
          "senderTimestamp": "1728570648",
          "recipientKeyHash": "Ghj8EGC6x90zAQ==",
          "recipientTimestamp": "1728809806"
        },
        "deviceListMetadataVersion": 2,
        "messageSecret": "iEDSa/IBGbxKEaZ27RH/U3pnYffCfnwE17PS9A31Orw="
      }
    }
  }
}
```

### QR Code Authentication

To authenticate the WhatsApp account, the bot will display a QR code in the terminal, which you need to scan with your WhatsApp mobile app (from WhatsApp Web). This will allow the bot to access and interact with your WhatsApp account.

## Webhook Route

The app provides a simple webhook route for testing:

```bash
POST /webhook
```

When a message is received, it will send a JSON payload containing information about the message, including sender and message content, to the specified webhook URL.

## Logging

The bot uses [Pino](https://github.com/pinojs/pino) for logging. Logs will be displayed in a colorized and readable format in the terminal.

## License

This project is licensed under the MIT License.
