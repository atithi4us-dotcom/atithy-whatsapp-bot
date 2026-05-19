const axios = require('axios');
const config = require('../config');

function summarizePayload(payload) {
  return {
    to: payload.to,
    type: payload.type,
    text: payload.text ? payload.text.body : undefined,
    interactiveType: payload.interactive ? payload.interactive.type : undefined
  };
}

async function sendRequest(payload) {
  if (config.dryRun || !config.whatsappToken || !config.whatsappPhoneNumberId) {
    console.log('[DRY_RUN] WhatsApp send', JSON.stringify(summarizePayload(payload)));
    return { dryRun: true };
  }

  const url = `https://graph.facebook.com/${config.graphApiVersion}/${config.whatsappPhoneNumberId}/messages`;
  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${config.whatsappToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

async function sendText(to, body) {
  return sendRequest({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body }
  });
}

async function sendButtons(to, body, buttons) {
  return sendRequest({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: {
        buttons: buttons.map((button) => ({
          type: 'reply',
          reply: {
            id: button.id,
            title: button.title
          }
        }))
      }
    }
  });
}

async function sendImageById(to, mediaId, caption) {
  return sendRequest({
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: {
      id: mediaId,
      caption
    }
  });
}

async function sendDocumentById(to, mediaId, filename, caption) {
  return sendRequest({
    messaging_product: 'whatsapp',
    to,
    type: 'document',
    document: {
      id: mediaId,
      filename: filename || 'aadhaar.pdf',
      caption
    }
  });
}

async function downloadMedia(mediaId) {
  const metaUrl = `https://graph.facebook.com/${config.graphApiVersion}/${mediaId}`;
  const meta = await axios.get(metaUrl, {
    headers: {
      Authorization: `Bearer ${config.whatsappToken}`
    }
  });
  const file = await axios.get(meta.data.url, {
    responseType: 'arraybuffer',
    headers: {
      Authorization: `Bearer ${config.whatsappToken}`
    }
  });
  return {
    id: mediaId,
    buffer: Buffer.from(file.data),
    mimeType: meta.data.mime_type || file.headers['content-type'] || 'application/octet-stream',
    sha256: meta.data.sha256 || null,
    fileSize: meta.data.file_size || null
  };
}

module.exports = {
  sendText,
  sendButtons,
  sendImageById,
  sendDocumentById,
  downloadMedia
};
