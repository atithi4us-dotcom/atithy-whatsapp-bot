const workersEl = document.getElementById('workers');
const detailsEl = document.getElementById('details');
const refreshBtn = document.getElementById('refreshBtn');
const REFRESH_INTERVAL_MS = 6000;

let workers = [];
let selectedPhone = '';
let isLoading = false;
let refreshTimer = null;

function fmt(value) {
  return value || '-';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function statusClass(status) {
  return `status ${String(status || '').replace(/[^a-z0-9_-]/gi, '_')}`;
}

function humanize(value) {
  return String(value || '-')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value) {
  if (!value) return '-';
  const date = timestampToDate(value);
  if (!date) return String(value);
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatClock(value) {
  if (!value) return '';
  const date = timestampToDate(value);
  if (!date) return '';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatInboxTime(value) {
  if (!value) return '';
  const date = timestampToDate(value);
  if (!date) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return formatClock(value);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], {
    day: '2-digit',
    month: 'short'
  });
}

function formatDateLabel(value) {
  if (!value) return '';
  const date = timestampToDate(value);
  if (!date) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function aadhaarSideUrl(worker, side) {
  return worker.aadhaar && worker.aadhaar[side] && worker.aadhaar[side].storagePath
    ? `/admin/api/workers/${encodeURIComponent(worker.phone)}/aadhaar/${side}`
    : '';
}

function timestampToDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const date = new Date(value < 10000000000 ? value * 1000 : value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      const date = value.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }
    const seconds = value.seconds || value._seconds;
    if (typeof seconds === 'number') {
      const millis = seconds * 1000 + Math.floor((value.nanoseconds || value._nanoseconds || 0) / 1000000);
      const date = new Date(millis);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function workerDisplayName(worker) {
  return worker.name || `+${worker.phone}`;
}

function workerInitial(worker) {
  return workerDisplayName(worker).replace(/^\+/, '').charAt(0).toUpperCase() || 'A';
}

function toHistoryTimestamp(value) {
  const date = timestampToDate(value);
  return date ? date.getTime() : null;
}

function getSortedHistory(worker) {
  const rawHistory = worker && worker.history;
  const history = Array.isArray(rawHistory)
    ? rawHistory
    : rawHistory && typeof rawHistory === 'object'
      ? Object.values(rawHistory)
      : [];

  const fallbackAt = toHistoryTimestamp(worker && worker.updatedAt) || toHistoryTimestamp(worker && worker.createdAt);

  return history
    .slice()
    .filter((event) => event && typeof event === 'object')
    .map((event) => {
      const directAt = toHistoryTimestamp(event.at);
      const fallbackEventAt = directAt === null ? fallbackAt || null : directAt;
      return fallbackEventAt === null ? { ...event, __at: null } : { ...event, __at: fallbackEventAt };
    })
    .sort((a, b) => {
      const left = a.__at || Number.MIN_SAFE_INTEGER;
      const right = b.__at || Number.MIN_SAFE_INTEGER;
      return left - right;
    });
}

const replyLabels = {
  aadhaar_consent_no: 'I do not agree',
  aadhaar_consent_yes: 'I agree',
  gender_female: 'Female',
  gender_male: 'Male',
  interest_no: 'No',
  interest_yes: 'Yes',
  language_as_in: 'Assamese',
  language_bn_in: 'Bengali',
  language_en_in: 'English',
  language_hi_in: 'Hindi',
  language_or_in: 'Odia',
  language_ta_in: 'Tamil'
};

const districts = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod'
];

function buildDistrictId(district) {
  return `district_${district.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
}

function readableReplyLabel(replyId) {
  if (!replyId) return '';
  if (replyLabels[replyId]) return replyLabels[replyId];
  const district = districts.find((item) => buildDistrictId(item) === replyId);
  return district || '';
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const text = value.trim();
    if (text) return text;
  }
  return '';
}

function inboundPayloadText(event) {
  const message = event.message || event.rawMessage || event.payload || {};
  const interactive = event.interactive || message.interactive || {};
  const buttonReply = interactive.button_reply || {};
  const listReply = interactive.list_reply || {};
  const image = event.image || message.image || {};
  const documentFile = event.document || message.document || {};

  return firstText(
    event.text,
    event.typedText,
    event.body,
    event.caption,
    event.messageText,
    event.replyTitle,
    event.reply && event.reply.title,
    buttonReply.title,
    listReply.title,
    message.text && message.text.body,
    image.caption,
    documentFile.caption,
    documentFile.filename
  );
}

function inboundPayloadReplyId(event) {
  const message = event.message || event.rawMessage || event.payload || {};
  const interactive = event.interactive || message.interactive || {};
  return firstText(
    event.replyId,
    event.reply && event.reply.id,
    interactive.button_reply && interactive.button_reply.id,
    interactive.list_reply && interactive.list_reply.id
  );
}

function legacyOutboundText(event) {
  if (event.type !== 'outbound') return '';
  const labels = {
    aadhaar_back_prompt: 'Now please upload the back side of your Aadhaar card as a clear image or PDF.',
    aadhaar_both_received_sent:
      'Thank you. Your Aadhaar front and back have been received and are now under verification.',
    aadhaar_consent_prompt:
      'Aadhaar verification consent\n\nBy selecting I agree, you allow Atithy to collect and store your Aadhaar card only for worker identity verification and onboarding approval.',
    aadhaar_front_prompt: 'Please upload the front side of your Aadhaar card as a clear image or PDF.',
    aadhaar_pending_sent: 'Your Aadhaar is still under verification. We will update you soon.',
    aadhaar_required_sent: 'Aadhaar consent is required to complete worker onboarding.',
    aadhaar_upload_prompt: 'Please upload your Aadhaar card as a clear image or PDF.',
    app_install_prompt_sent: 'Please download and install the Atithy app to receive and accept jobs.',
    choose_option_sent: 'Please choose an option below.',
    gender_prompt: 'Please select your gender.',
    interest_prompt: 'Are you interested to join Atithy as a worker?',
    language_prompt_sent: 'Please choose your language.\nकृपया अपनी भाषा चुनें।',
    name_prompt: 'Please send your full name.',
    not_now_sent: 'Okay. You can message us again later if you want to join Atithy.',
    place_prompt: 'Please select your current district in Kerala.',
    rejected_sent: 'Your Aadhaar could not be verified. Please upload a valid Aadhaar card again.',
    start_sent: 'Welcome to Atithy.'
  };
  return labels[event.event] || '';
}

function inferOldMessageText(event, context) {
  if (event.event !== 'message_received') return '';
  if (event.messageType === 'interactive') {
    if (context && context.next && context.next.event === 'start_sent') {
      return 'Worker selected a language';
    }
    return 'Worker selected an option';
  }
  if (event.messageType === 'image') return 'Image uploaded';
  if (event.messageType === 'document') return 'Document uploaded';
  return '';
}

function eventText(event, context = {}) {
  const payloadText = inboundPayloadText(event);
  if (payloadText) return payloadText;

  const replyId = inboundPayloadReplyId(event);
  if (replyId) return readableReplyLabel(replyId) || replyId;

  const inferredText = inferOldMessageText(event, context);
  if (inferredText) return inferredText;

  const outboundText = legacyOutboundText(event);
  if (outboundText) return outboundText;

  const labels = {
    interest_prompt: 'Interest prompt sent',
    language_prompt_sent: 'Language selection sent',
    name_prompt: 'Name prompt sent',
    gender_prompt: 'Gender prompt sent',
    place_prompt: 'District prompt sent',
    aadhaar_consent_prompt: 'Aadhaar consent prompt sent',
    aadhaar_upload_prompt: 'Aadhaar upload prompt sent',
    aadhaar_front_prompt: 'Aadhaar front upload prompt sent',
    aadhaar_back_prompt: 'Aadhaar back upload prompt sent',
    app_install_confirmed: 'Worker confirmed app install',
    app_install_prompt_resent: 'App install prompt resent',
    app_install_prompt_sent: 'App install prompt sent',
    aadhaar_approved: 'Aadhaar approved',
    aadhaar_back_uploaded: 'Aadhaar back uploaded',
    aadhaar_front_uploaded: 'Aadhaar front uploaded',
    back_clear_copy_requested: 'Clear Aadhaar back requested',
    both_clear_copy_requested: 'Clear Aadhaar front and back requested',
    front_clear_copy_requested: 'Clear Aadhaar front requested',
    language_prompt_sent: 'Language selection sent',
    message_received: 'Message received',
    job_acceptance_video_sent: 'Job acceptance video sent',
    post_approval_guidance_retry_failed: 'Post-approval guidance failed',
    rejected: 'Aadhaar rejected',
    start_sent: 'Onboarding started',
    worker_created: 'Worker profile created',
    worker_reset_by_chat_command: 'Worker restarted the chat'
  };

  return labels[event.event] || humanize(event.event || event.type || 'system');
}

function lastHistoryEvent(worker) {
  const history = getSortedHistory(worker);
  return history[history.length - 1] || null;
}

function lastActivityAt(worker) {
  const event = lastHistoryEvent(worker);
  return (event && event.at) || worker.updatedAt || worker.createdAt || '';
}

function inboxPreview(worker) {
  const event = lastHistoryEvent(worker);
  if (!event) return humanize(worker.status || 'No messages yet');
  const prefix = event.type === 'outbound' ? 'Bot: ' : event.type === 'system' ? '' : '';
  return `${prefix}${eventText(event, { worker })}`;
}

function renderChatExtras(worker, event) {
  const details = [];
  if (event.messageType && !event.text && event.messageType !== 'interactive') {
    details.push(escapeHtml(`Message: ${event.messageType}`));
  }
  if (event.locale) details.push(escapeHtml(`Language: ${event.locale}`));
  if (event.storagePath) {
    const side =
      event.event === 'aadhaar_front_uploaded'
        ? 'front'
        : event.event === 'aadhaar_back_uploaded'
          ? 'back'
          : '';
    const fileUrl = side ? aadhaarSideUrl(worker, side) : '';
    details.push(
      fileUrl
        ? `<a href="${fileUrl}" target="_blank" rel="noopener">View file</a>`
        : escapeHtml(`File: ${event.storagePath}`)
    );
  }
  if (event.reviewedBy) details.push(escapeHtml(`Reviewer: +${event.reviewedBy}`));
  if (event.syncResult) {
    const syncStatus = event.syncResult.ok === false ? event.syncResult.error || 'Failed' : 'Done';
    details.push(escapeHtml(`Sync: ${syncStatus}`));
  }
  return details.length
    ? `<div class="chat-extra">${details.map((detail) => `<span>${detail}</span>`).join('')}</div>`
    : '';
}

function renderHistory(worker) {
  const history = getSortedHistory(worker);
  if (!history.length) {
    return `
      <section class="chat-thread">
        <div class="history-empty">No messages recorded yet.</div>
      </section>
    `;
  }

  let lastDateLabel = '';
  const rows = history
    .map((event, index) => {
      const eventAt = event.__at ? new Date(event.__at).toISOString() : event.at || worker.updatedAt || worker.createdAt;
      const context = {
        worker,
        previous: history[index - 1] || null,
        next: history[index + 1] || null
      };
      const dateLabel = formatDateLabel(eventAt);
      const separator =
        dateLabel && dateLabel !== lastDateLabel
          ? `<div class="date-separator"><span>${escapeHtml(dateLabel)}</span></div>`
          : '';
      lastDateLabel = dateLabel || lastDateLabel;

      if (event.type === 'system') {
        return `
          ${separator}
          <div class="system-note">
            <span>${escapeHtml(eventText(event, context))}</span>
            <time>${escapeHtml(formatClock(eventAt))}</time>
          </div>
        `;
      }

      return `
        ${separator}
        <div class="message-line ${event.type === 'outbound' ? 'sent' : 'received'}">
          <div class="message-bubble">
            <div class="message-text">${escapeHtml(eventText(event, context))}</div>
            ${renderChatExtras(worker, event)}
            <time>${escapeHtml(formatClock(eventAt))}</time>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <section class="chat-thread">
      ${rows}
    </section>
  `;
}

function getWorkerFromList(phone) {
  return workers.find((worker) => worker.phone === phone) || null;
}

function scrollChatToLatest() {
  const thread = detailsEl.querySelector('.chat-thread');
  if (!thread) return;
  requestAnimationFrame(() => {
    thread.scrollTop = thread.scrollHeight;
  });
}

async function fetchJson(url, options) {
  const method = options && typeof options.method === 'string' ? options.method.toUpperCase() : 'GET';
  const requestUrl =
    method === 'GET' && typeof url === 'string'
      ? `${url}${url.includes('?') ? '&' : '?'}_ts=${Date.now()}`
      : url;

  const response = await fetch(requestUrl, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function renderWorkers() {
  workersEl.innerHTML = workers
    .map(
      (worker) => `
        <div class="worker-row ${worker.phone === selectedPhone ? 'selected' : ''}" data-phone="${worker.phone}">
          <div class="avatar">${escapeHtml(workerInitial(worker))}</div>
          <div class="worker-main">
            <div class="worker-topline">
              <strong>${escapeHtml(workerDisplayName(worker))}</strong>
              <time>${escapeHtml(formatInboxTime(lastActivityAt(worker)))}</time>
            </div>
            <div class="worker-preview">${escapeHtml(inboxPreview(worker))}</div>
            <div class="worker-subline">
              <span>+${escapeHtml(worker.phone)}${worker.currentPlace ? ` · ${escapeHtml(worker.currentPlace)}` : ''}</span>
              <span class="${statusClass(worker.status)}">${escapeHtml(fmt(worker.status))}</span>
            </div>
          </div>
        </div>
      `
    )
    .join('');
}

function renderReviewPanel(worker, aadhaarFrontUrl, aadhaarBackUrl, legacyAadhaarUrl) {
  return `
    <aside class="review-panel">
      <h3>Review</h3>
      <div class="review-fields">
        <div><span>Gender</span><strong>${escapeHtml(fmt(worker.gender))}</strong></div>
        <div><span>Current place</span><strong>${escapeHtml(fmt(worker.currentPlace))}</strong></div>
        <div><span>Aadhaar consent</span><strong>${
          worker.aadhaarConsent && worker.aadhaarConsent.accepted ? 'Accepted' : '-'
        }</strong></div>
        <div><span>Review status</span><strong>${escapeHtml(fmt(worker.review && worker.review.status))}</strong></div>
        <div><span>Front file</span><strong>${escapeHtml(
          fmt(worker.aadhaar && worker.aadhaar.front && worker.aadhaar.front.filename)
        )}</strong></div>
        <div><span>Back file</span><strong>${escapeHtml(
          fmt(worker.aadhaar && worker.aadhaar.back && worker.aadhaar.back.filename)
        )}</strong></div>
      </div>

      <div class="file-actions">
        ${
          aadhaarFrontUrl
            ? `<a class="button-link" href="${aadhaarFrontUrl}" target="_blank" rel="noopener">View Front</a>`
            : ''
        }
        ${
          aadhaarBackUrl
            ? `<a class="button-link" href="${aadhaarBackUrl}" target="_blank" rel="noopener">View Back</a>`
            : ''
        }
        ${
          legacyAadhaarUrl
            ? `<a class="button-link" href="${legacyAadhaarUrl}" target="_blank" rel="noopener">View Old</a>`
            : ''
        }
      </div>

      <div class="actions">
        <button class="ghost" data-action="notifyReviewer">Notify reviewer</button>
        <button data-action="approve">Approve Aadhaar</button>
        <button class="danger" data-action="reject">Reject Aadhaar</button>
        <button class="ghost" data-action="clearFront">Request clear front</button>
        <button class="ghost" data-action="clearBack">Request clear back</button>
        <button class="ghost" data-action="clearBoth">Request both again</button>
      </div>
    </aside>
  `;
}

function renderDetails(worker) {
  const legacyAadhaarUrl =
    worker.aadhaar && worker.aadhaar.storagePath
      ? `/admin/api/workers/${encodeURIComponent(worker.phone)}/aadhaar`
      : '';
  const aadhaarFrontUrl = aadhaarSideUrl(worker, 'front');
  const aadhaarBackUrl = aadhaarSideUrl(worker, 'back');

  detailsEl.innerHTML = `
    <div class="conversation" data-phone="${escapeHtml(worker.phone)}">
      <section class="chat-panel">
        <header class="chat-header">
          <div class="avatar">${escapeHtml(workerInitial(worker))}</div>
          <div>
            <h2>${escapeHtml(workerDisplayName(worker))}</h2>
            <p>+${escapeHtml(worker.phone)}${worker.currentPlace ? ` · ${escapeHtml(worker.currentPlace)}` : ''}</p>
          </div>
          <span class="${statusClass(worker.status)}">${escapeHtml(fmt(worker.status))}</span>
        </header>
        ${renderHistory(worker)}
      </section>
      ${renderReviewPanel(worker, aadhaarFrontUrl, aadhaarBackUrl, legacyAadhaarUrl)}
    </div>
  `;
  scrollChatToLatest();
}

async function loadWorkers() {
  if (isLoading) return;
  isLoading = true;
  try {
    const data = await fetchJson('/admin/api/workers');
    workers = data.workers || [];
    if (selectedPhone && !workers.some((worker) => worker.phone === selectedPhone)) {
      selectedPhone = '';
    }
    if (!selectedPhone && workers.length) {
      selectedPhone = workers[0].phone;
    }
    renderWorkers();
    if (!workers.length) {
      detailsEl.innerHTML = '<div class="empty">No workers yet.</div>';
      return;
    }
    if (selectedPhone) {
      const listWorker = getWorkerFromList(selectedPhone);
      if (listWorker) {
        renderDetails(listWorker);
      }
      try {
        const selected = await fetchJson(`/admin/api/workers/${selectedPhone}`);
        if (selected && selected.worker) {
          renderDetails(selected.worker);
        }
      } catch (_error) {
        // Keep showing list payload if detail endpoint is temporarily unavailable.
      }
    }
  } finally {
    isLoading = false;
  }
}

workersEl.addEventListener('click', async (event) => {
  const row = event.target.closest('.worker-row');
  if (!row) return;
  selectedPhone = row.dataset.phone;
  renderWorkers();
  const listWorker = getWorkerFromList(selectedPhone);
  if (listWorker) {
    renderDetails(listWorker);
  }
  try {
    const data = await fetchJson(`/admin/api/workers/${row.dataset.phone}`);
    if (data && data.worker) {
      renderDetails(data.worker);
    }
  } catch (_error) {
    // Keep showing list payload if detail endpoint is temporarily unavailable.
  }
});

detailsEl.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const actionMap = {
    approve: 'approve-aadhaar',
    notifyReviewer: 'notify-reviewer',
    reject: 'reject-aadhaar',
    clearFront: 'request-clear-aadhaar-front',
    clearBack: 'request-clear-aadhaar-back',
    clearBoth: 'request-clear-aadhaar'
  };
  const conversation = detailsEl.querySelector('.conversation');
  const phone = conversation ? conversation.dataset.phone : '';
  if (!phone) return;
  button.disabled = true;
  try {
    await fetchJson(`/admin/api/workers/${phone}/${actionMap[button.dataset.action]}`, {
      method: 'POST',
      body: '{}'
    });
    await loadWorkers();
    const data = await fetchJson(`/admin/api/workers/${phone}`);
    renderDetails(data.worker);
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
  }
});

refreshBtn.addEventListener('click', loadWorkers);

function ensureAutoRefresh() {
  if (refreshTimer) return;
  refreshTimer = setInterval(() => {
    if (document.hidden) return;
    loadWorkers().catch(() => {});
  }, REFRESH_INTERVAL_MS);
}

window.addEventListener('focus', () => {
  loadWorkers().catch(() => {});
});

ensureAutoRefresh();
loadWorkers().catch((error) => {
  detailsEl.innerHTML = `<div class="empty">${error.message}</div>`;
});
