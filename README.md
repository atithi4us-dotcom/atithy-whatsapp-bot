# Atithy WhatsApp Bot

WhatsApp onboarding bot for Atithy workers.

## Flow

1. Ask the worker to choose a language from the app-supported worker languages:
   Hindi, Tamil, Bengali, Odia, Assamese, or English.
2. Continue the worker-facing chat in the selected language.
3. Explain Atithy work and daily earning.
4. Ask if the worker wants to continue.
5. Collect name, gender, and current place in Kerala.
6. Ask Aadhaar verification consent.
7. Collect Aadhaar image/PDF.
8. Send Aadhaar to reviewer `+91 94466 00809`.
9. Reviewer approves, rejects, or asks for a clearer Aadhaar.
10. On approval, mark onboarding complete and call the Atithy app sync endpoint with the selected locale if configured.

## Local

```bash
npm install
npm run check
npm start
```

## Render

Service name: `atithy-whatsapp-bot`

Webhook callback URL:

```text
https://atithy-whatsapp-bot.onrender.com/webhook
```

Use WhatsApp number `+91 96331 08778`.
