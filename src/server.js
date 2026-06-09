const express = require('express');
const path = require('path');
const config = require('./config');
const {
  initializeStorage,
  listWorkers,
  getWorker,
  getBucket,
  getStorageDiagnostics
} = require('./services/storage');
const { processIncomingMessage, approveWorker, rejectWorker } = require('./services/workerFlow');
const {
  createSession,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  validateCredentials,
  requireAdmin,
  verifySession
} = require('./services/auth');

const app = express();
let startupError = null;
let lastWebhookError = null;
let lastInboundMessage = null;
let lastMessageStatus = null;
let lastReviewerDeliveryFailure = null;

function getWebhookPreviewText(message) {
  if (message.text && message.text.body) return message.text.body;
  if (message.image && message.image.caption) return message.image.caption;
  if (message.document && message.document.caption) return message.document.caption;
  if (message.interactive && message.interactive.button_reply && message.interactive.button_reply.title) {
    return message.interactive.button_reply.title;
  }
  if (message.interactive && message.interactive.list_reply && message.interactive.list_reply.title) {
    return message.interactive.list_reply.title;
  }
  return '';
}

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(
  '/admin/assets',
  express.static(path.join(config.publicDir, 'assets'), {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }
  })
);

function setNoCacheHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
}

function summarizeError(error) {
  return {
    message: error.message,
    response: error.response ? error.response.data : null
  };
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'atithy-whatsapp-bot',
    commit: process.env.RENDER_GIT_COMMIT || null,
    dryRun: config.dryRun,
    webhookUrl: `${config.publicBaseUrl}/webhook`,
    whatsappConfigured: Boolean(config.whatsappToken && config.whatsappPhoneNumberId),
    firebaseConfigured: Boolean(
      config.googleApplicationCredentials ||
        (config.firebaseProjectId && config.firebaseClientEmail && config.firebasePrivateKey)
    ),
    reviewerPhone: config.reviewerPhone,
    startupError,
    lastWebhookError,
    lastInboundMessage,
    lastMessageStatus,
    lastReviewerDeliveryFailure,
    lastHistoryWrite: getStorageDiagnostics().lastHistoryWrite
  });
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsappVerifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  try {
    let processedMessages = 0;
    let processedStatuses = 0;

    for (const entry of req.body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        const messages = value.messages || [];
        const statuses = value.statuses || [];

        for (const message of messages) {
          if (!message.from) continue;
          processedMessages += 1;
          const preview = getWebhookPreviewText(message);
          lastInboundMessage = {
            at: new Date().toISOString(),
            from: String(message.from || '').replace(/(\d{6})(\d{4})$/, '******$2'),
            type: message.type || null,
            hasText: Boolean(preview),
            preview: preview ? preview.slice(0, 160) : null,
            messageId: message.id || null
          };
          console.log(
            '[WEBHOOK] Incoming message',
            JSON.stringify(
              {
                from: message.from,
                type: message.type,
                text: message.text && message.text.body ? message.text.body : null,
                interactiveReplyId:
                  message.interactive &&
                  message.interactive.button_reply &&
                  message.interactive.button_reply.id
                    ? message.interactive.button_reply.id
                    : message.interactive &&
                        message.interactive.list_reply &&
                        message.interactive.list_reply.id
                      ? message.interactive.list_reply.id
                      : null,
                interactiveReplyTitle:
                  message.interactive &&
                  message.interactive.button_reply &&
                  message.interactive.button_reply.title
                    ? message.interactive.button_reply.title
                    : message.interactive &&
                        message.interactive.list_reply &&
                        message.interactive.list_reply.title
                      ? message.interactive.list_reply.title
                    : null,
                id: message.id || null,
                phoneNumberId:
                  value.metadata && value.metadata.phone_number_id
                    ? value.metadata.phone_number_id
                    : null,
                displayPhoneNumber:
                  value.metadata && value.metadata.display_phone_number
                    ? value.metadata.display_phone_number
                    : null
              },
              null,
              2
            )
          );
          await processIncomingMessage(message.from, message);
        }

        for (const status of statuses) {
          processedStatuses += 1;
          const normalizedStatus = {
            at: new Date().toISOString(),
            id: status.id || null,
            status: status.status || null,
            recipientId: status.recipient_id || null,
            errors: Array.isArray(status.errors)
              ? status.errors.map((error) => ({
                  code: error.code || null,
                  title: error.title || null,
                  message: error.message || null
                }))
              : [],
            phoneNumberId:
              value.metadata && value.metadata.phone_number_id ? value.metadata.phone_number_id : null,
            displayPhoneNumber:
              value.metadata && value.metadata.display_phone_number
                ? value.metadata.display_phone_number
                : null
          };
          lastMessageStatus = normalizedStatus;
          if (
            normalizedStatus.status === 'failed' &&
            normalizedStatus.recipientId === config.reviewerPhone
          ) {
            lastReviewerDeliveryFailure = normalizedStatus;
          }
          console.log(
            '[WEBHOOK] Message status',
            JSON.stringify(normalizedStatus, null, 2)
          );
        }
      }
    }

    if (!processedMessages && !processedStatuses) {
      console.log('[WEBHOOK] Event received with no message payload');
    }

    return res.sendStatus(200);
  } catch (error) {
    lastWebhookError = {
      at: new Date().toISOString(),
      ...summarizeError(error)
    };
    console.error('[WEBHOOK_ERROR]', JSON.stringify(lastWebhookError, null, 2));
    return res.sendStatus(500);
  }
});

app.get('/admin/login', (req, res) => {
  setNoCacheHeaders(res);
  const session = verifySession(parseCookies(req.headers.cookie).atithy_admin_session);
  if (session) return res.redirect('/admin');
  return res.sendFile(path.join(config.publicDir, 'admin', 'login.html'));
});

app.post('/admin/login', (req, res) => {
  setNoCacheHeaders(res);
  if (!validateCredentials(req.body.username, req.body.password)) {
    return res.redirect('/admin/login?error=1');
  }
  setSessionCookie(res, createSession(req.body.username));
  return res.redirect('/admin');
});

app.post('/admin/logout', (_req, res) => {
  setNoCacheHeaders(res);
  clearSessionCookie(res);
  return res.redirect('/admin/login');
});

app.get('/admin', requireAdmin, (_req, res) => {
  setNoCacheHeaders(res);
  res.sendFile(path.join(config.publicDir, 'admin', 'index.html'));
});

app.post('/maintenance/create-reviewer-template', async (req, res) => {
  const token = req.headers['x-maintenance-token'] || req.query.token;
  if (token !== '35Lt5GiXkQKuXtbrF59k7MoxlIpykHmawKA36Ep91h4') {
    return res.status(404).json({ error: 'Not found' });
  }

  const headers = {
    Authorization: `Bearer ${config.whatsappToken}`,
    'Content-Type': 'application/json'
  };
  async function graphGet(path) {
    const response = await fetch(`https://graph.facebook.com/${config.graphApiVersion}${path}`, { headers });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  }

  async function findWabaId() {
    const probes = [];

    const phoneProbe = await graphGet(
      `/${config.whatsappPhoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,platform_type`
    );
    probes.push({ step: 'phone_lookup', ...phoneProbe });

    const businessProbe = await graphGet('/me/businesses?fields=id,name');
    probes.push({ step: 'businesses', ...businessProbe });

    const businesses = businessProbe.ok && Array.isArray(businessProbe.data.data) ? businessProbe.data.data : [];
    for (const business of businesses) {
      const ownedProbe = await graphGet(
        `/${business.id}/owned_whatsapp_business_accounts?fields=id,name,currency,timezone_id,message_template_namespace`
      );
      probes.push({ step: `owned_wabas:${business.id}`, ...ownedProbe });
      const ownedWaba =
        ownedProbe.ok && Array.isArray(ownedProbe.data.data) && ownedProbe.data.data.length
          ? ownedProbe.data.data[0]
          : null;
      if (ownedWaba && ownedWaba.id) return { wabaId: ownedWaba.id, probes };

      const clientProbe = await graphGet(
        `/${business.id}/client_whatsapp_business_accounts?fields=id,name,currency,timezone_id,message_template_namespace`
      );
      probes.push({ step: `client_wabas:${business.id}`, ...clientProbe });
      const clientWaba =
        clientProbe.ok && Array.isArray(clientProbe.data.data) && clientProbe.data.data.length
          ? clientProbe.data.data[0]
          : null;
      if (clientWaba && clientWaba.id) return { wabaId: clientWaba.id, probes };
    }

    return { wabaId: '', probes };
  }

  const found = await findWabaId();
  const wabaId = found.wabaId;
  if (!wabaId) {
    return res.status(400).json({ ok: false, step: 'waba_lookup', probes: found.probes });
  }

  /*
  const phoneUrl = `https://graph.facebook.com/${config.graphApiVersion}/${config.whatsappPhoneNumberId}?fields=whatsapp_business_account`;
  const phoneResponse = await fetch(phoneUrl, { headers });
  const phoneData = await phoneResponse.json();
  if (!phoneResponse.ok) {
    return res.status(phoneResponse.status).json({ ok: false, step: 'phone_lookup', response: phoneData });
  }

  const waba = phoneData.whatsapp_business_account;
  const wabaId = waba && (typeof waba === 'string' ? waba : waba.id);
  if (!wabaId) {
    return res.status(400).json({ ok: false, step: 'phone_lookup', response: phoneData });
  }
  */

  const templateName = config.reviewerTemplateName;
  const listUrl = `https://graph.facebook.com/${config.graphApiVersion}/${wabaId}/message_templates?name=${encodeURIComponent(
    templateName
  )}&limit=10`;
  const listResponse = await fetch(listUrl, { headers });
  const listData = await listResponse.json();
  if (!listResponse.ok) {
    return res.status(listResponse.status).json({ ok: false, step: 'template_lookup', response: listData });
  }

  const existingTemplate = Array.isArray(listData.data)
    ? listData.data.find((template) => template.name === templateName)
    : null;
  if (existingTemplate) {
    return res.json({ ok: true, existed: true, wabaId, template: existingTemplate });
  }

  const createResponse = await fetch(
    `https://graph.facebook.com/${config.graphApiVersion}/${wabaId}/message_templates`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: templateName,
        language: config.reviewerTemplateLanguage,
        category: 'UTILITY',
        components: [
          {
            type: 'BODY',
            text: [
              'New Aadhaar review pending.',
              '',
              'Worker: {{1}}',
              'Phone: +{{2}}',
              'Place: {{3}}',
              '',
              'Tap Show reviews to receive Aadhaar media and review actions.'
            ].join('\n'),
            example: {
              body_text: [['Rakhav', '917736108778', 'Ernakulam']]
            }
          },
          {
            type: 'BUTTONS',
            buttons: [
              {
                type: 'QUICK_REPLY',
                text: 'Show reviews'
              }
            ]
          }
        ]
      })
    }
  );
  const createData = await createResponse.json();
  return res.status(createResponse.ok ? 200 : createResponse.status).json({
    ok: createResponse.ok,
    existed: false,
    wabaId,
    response: createData
  });
});

app.get('/admin/api/workers', requireAdmin, async (_req, res) => {
  setNoCacheHeaders(res);
  res.json({ workers: await listWorkers(200) });
});

app.get('/admin/api/workers/:phone', requireAdmin, async (req, res) => {
  setNoCacheHeaders(res);
  const worker = await getWorker(req.params.phone.replace(/\D/g, ''));
  if (!worker) return res.status(404).json({ error: 'Worker not found' });
  return res.json({ worker });
});

async function streamAadhaarFile(req, res, side) {
  try {
    const worker = await getWorker(req.params.phone.replace(/\D/g, ''));
    const allAadhaar = worker && worker.aadhaar;
    const aadhaar = side && allAadhaar ? allAadhaar[side] : allAadhaar;
    if (!aadhaar || !aadhaar.storagePath) {
      return res.status(404).send('Aadhaar file not found');
    }

    const file = getBucket().file(aadhaar.storagePath);
    const [exists] = await file.exists();
    if (!exists) return res.status(404).send('Aadhaar file not found');

    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || aadhaar.mimeType || 'application/octet-stream';
    const filename = (aadhaar.filename || 'aadhaar').replace(/["\r\n]/g, '_');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    file.createReadStream().on('error', () => res.sendStatus(500)).pipe(res);
  } catch (error) {
    return res.status(500).send(error.message);
  }
}

app.get('/admin/api/workers/:phone/aadhaar', requireAdmin, async (req, res) => {
  setNoCacheHeaders(res);
  return streamAadhaarFile(req, res);
});

app.get('/admin/api/workers/:phone/aadhaar/:side', requireAdmin, async (req, res) => {
  setNoCacheHeaders(res);
  const side = req.params.side === 'front' || req.params.side === 'back' ? req.params.side : '';
  if (!side) return res.status(404).send('Aadhaar file not found');
  return streamAadhaarFile(req, res, side);
});

app.post('/admin/api/workers/:phone/approve-aadhaar', requireAdmin, async (req, res) => {
  try {
    setNoCacheHeaders(res);
    const result = await approveWorker(req.params.phone.replace(/\D/g, ''), req.admin.username);
    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/admin/api/workers/:phone/reject-aadhaar', requireAdmin, async (req, res) => {
  try {
    setNoCacheHeaders(res);
    const worker = await rejectWorker(req.params.phone.replace(/\D/g, ''), req.admin.username, 'reject');
    return res.json({ ok: true, worker });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/admin/api/workers/:phone/request-clear-aadhaar', requireAdmin, async (req, res) => {
  try {
    setNoCacheHeaders(res);
    const worker = await rejectWorker(req.params.phone.replace(/\D/g, ''), req.admin.username, 'clear_both');
    return res.json({ ok: true, worker });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/admin/api/workers/:phone/request-clear-aadhaar-front', requireAdmin, async (req, res) => {
  try {
    setNoCacheHeaders(res);
    const worker = await rejectWorker(req.params.phone.replace(/\D/g, ''), req.admin.username, 'clear_front');
    return res.json({ ok: true, worker });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/admin/api/workers/:phone/request-clear-aadhaar-back', requireAdmin, async (req, res) => {
  try {
    setNoCacheHeaders(res);
    const worker = await rejectWorker(req.params.phone.replace(/\D/g, ''), req.admin.username, 'clear_back');
    return res.json({ ok: true, worker });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

async function start() {
  try {
    await initializeStorage();
  } catch (error) {
    startupError = summarizeError(error);
    console.error('[STARTUP] Firebase initialization failed', JSON.stringify(startupError));
  }

  app.listen(config.port, () => {
    console.log(`Atithy WhatsApp bot listening on port ${config.port}`);
    console.log(`Webhook callback URL: ${config.publicBaseUrl}/webhook`);
    console.log(`Reviewer phone: ${config.reviewerPhone}`);
  });
}

start();
