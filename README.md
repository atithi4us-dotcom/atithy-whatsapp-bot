# Atithy WhatsApp Bot

WhatsApp onboarding bot for Atithy workers.

## Flow

1. Explain Atithy work and daily earning.
2. Ask if the worker wants to continue.
3. Collect name, gender, and current place in Kerala.
4. Ask Aadhaar verification consent.
5. Collect Aadhaar image/PDF.
6. Send Aadhaar to reviewer `+91 94466 00809`.
7. Reviewer approves, rejects, or asks for a clearer Aadhaar.
8. On approval, mark onboarding complete and call the Atithy app sync endpoint if configured.

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
