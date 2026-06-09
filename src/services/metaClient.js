const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const config = require('../config');

function summarizePayload(payload) {
  return {
    to: payload.to,
    type: payload.type,
    text: payload.text ? payload.text.body : undefined,
    interactiveType: payload.interactive ? payload.interactive.type : undefined,
    template: payload.template ? payload.template.name : undefined,
    mediaId:
      (payload.image && payload.image.id) ||
      (payload.video && payload.video.id) ||
      (payload.document && payload.document.id) ||
      undefined
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

async function sendList(to, body, buttonText, sections) {
  return sendRequest({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: body },
      action: {
        button: buttonText,
        sections
      }
    }
  });
}

async function sendTemplate(to, name, languageCode, bodyParameters = [], buttonPayload) {
  const components = [];
  if (bodyParameters.length) {
    components.push({
      type: 'body',
      parameters: bodyParameters.map((text) => ({
        type: 'text',
        text: String(text || '-')
      }))
    });
  }
  if (buttonPayload) {
    components.push({
      type: 'button',
      sub_type: 'quick_reply',
      index: '0',
      parameters: [
        {
          type: 'payload',
          payload: buttonPayload
        }
      ]
    });
  }

  return sendRequest({
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name,
      language: {
        code: languageCode
      },
      ...(components.length ? { components } : {})
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

async function uploadMediaFromFile(filePath, mimeType = 'video/mp4') {
  if (config.dryRun || !config.whatsappToken || !config.whatsappPhoneNumberId) {
    console.log('[DRY_RUN] WhatsApp media upload', JSON.stringify({ filePath, mimeType }));
    return { id: `dry-run-${path.basename(filePath)}`, dryRun: true };
  }

  const buffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', mimeType);
  form.append('file', new Blob([buffer], { type: mimeType }), path.basename(filePath));

  const url = `https://graph.facebook.com/${config.graphApiVersion}/${config.whatsappPhoneNumberId}/media`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.whatsappToken}`
    },
    body: form
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp media upload failed: ${response.status} ${body}`);
  }

  return response.json();
}

async function sendVideoById(to, mediaId, caption) {
  return sendRequest({
    messaging_product: 'whatsapp',
    to,
    type: 'video',
    video: {
      id: mediaId,
      caption
    }
  });
}

async function sendVideoFile(to, filePath, caption) {
  const upload = await uploadMediaFromFile(filePath, 'video/mp4');
  await sendVideoById(to, upload.id, caption);
  return upload;
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
  sendList,
  sendTemplate,
  sendImageById,
  sendDocumentById,
  uploadMediaFromFile,
  sendVideoById,
  sendVideoFile,
  downloadMedia
};
