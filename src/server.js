const express = require('express');
const path = require('path');
const config = require('./config');
const {
  initializeStorage,
  listWorkers,
  listWorkersPage,
  getWorker,
  getDashboardStats,
  getStorageDiagnostics
} = require('./services/storage');
const {
  processIncomingMessage,
  approveWorker,
  rejectWorker,
  notifyReviewerForWorker,
  resendPendingReviewerAlerts,
  reconcilePendingReviewerNotifications,
  getWorkerFlowDiagnostics
} = require('./services/workerFlow');
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
app.use(
  '/assets',
  express.static(path.join(config.publicDir, 'assets'), {
    setHeaders: (res, filePath) => {
      if (/\.(?:jpg|jpeg|png|webp|avif|gif|svg|ico)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return;
      }
      res.setHeader('Cache-Control', 'public, max-age=3600');
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
    lastReviewerNotification: getWorkerFlowDiagnostics().lastReviewerNotification,
    lastHistoryWrite: getStorageDiagnostics().lastHistoryWrite
  });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(config.publicDir, 'index.html'));
});

app.get('/privacy', (_req, res) => {
  res.sendFile(path.join(config.publicDir, 'privacy.html'));
});

app.get('/privacy-policy', (_req, res) => {
  res.redirect(301, '/privacy');
});

app.get('/terms', (_req, res) => {
  res.sendFile(path.join(config.publicDir, 'terms.html'));
});

app.get('/terms-of-service', (_req, res) => {
  res.redirect(301, '/terms');
});

app.get('/support', (_req, res) => {
  res.sendFile(path.join(config.publicDir, 'support.html'));
});

app.get('/contact', (_req, res) => {
  res.redirect(301, '/support');
});

app.get('/data-deletion', (_req, res) => {
  res.sendFile(path.join(config.publicDir, 'data-deletion.html'));
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').sendFile(path.join(config.publicDir, 'robots.txt'));
});

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').sendFile(path.join(config.publicDir, 'sitemap.xml'));
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

app.get('/admin/api/workers', requireAdmin, async (req, res) => {
  setNoCacheHeaders(res);
  res.json(
    await listWorkersPage({
      limit: req.query.limit,
      cursor: req.query.cursor
    })
  );
});

app.get('/admin/api/dashboard-stats', requireAdmin, async (_req, res) => {
  setNoCacheHeaders(res);
  res.json({ stats: await getDashboardStats() });
});

app.get('/admin/api/workers/:phone', requireAdmin, async (req, res) => {
  setNoCacheHeaders(res);
  const worker = await getWorker(req.params.phone.replace(/\D/g, ''));
  if (!worker) return res.status(404).json({ error: 'Worker not found' });
  return res.json({ worker });
});

app.post('/admin/api/reviewer/resend-pending-alerts', requireAdmin, async (_req, res) => {
  try {
    setNoCacheHeaders(res);
    const result = await resendPendingReviewerAlerts();
    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/admin/api/workers/:phone/approve-worker', requireAdmin, async (req, res) => {
  try {
    setNoCacheHeaders(res);
    const result = await approveWorker(req.params.phone.replace(/\D/g, ''), req.admin.username);
    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/admin/api/workers/:phone/notify-reviewer', requireAdmin, async (req, res) => {
  try {
    setNoCacheHeaders(res);
    const result = await notifyReviewerForWorker(req.params.phone.replace(/\D/g, ''));
    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/admin/api/workers/:phone/reject-worker', requireAdmin, async (req, res) => {
  try {
    setNoCacheHeaders(res);
    const worker = await rejectWorker(req.params.phone.replace(/\D/g, ''), req.admin.username, 'reject');
    return res.json({ ok: true, worker });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

async function start() {
  try {
    await initializeStorage();
    const retryResult = await reconcilePendingReviewerNotifications();
    if (retryResult.count) {
      console.log(`[STARTUP] Retried ${retryResult.count} pending reviewer notification(s)`);
    }
  } catch (error) {
    startupError = summarizeError(error);
    console.error('[STARTUP] Initialization failed', JSON.stringify(startupError));
  }

  app.listen(config.port, () => {
    console.log(`Atithy WhatsApp bot listening on port ${config.port}`);
    console.log(`Webhook callback URL: ${config.publicBaseUrl}/webhook`);
    console.log(`Reviewer phone: ${config.reviewerPhone}`);
  });
}

start();
