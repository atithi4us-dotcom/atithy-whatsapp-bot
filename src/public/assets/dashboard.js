const workersEl = document.getElementById('workers');
const detailsEl = document.getElementById('details');
const refreshBtn = document.getElementById('refreshBtn');

let workers = [];

function fmt(value) {
  return value || '-';
}

function statusClass(status) {
  return `status ${String(status || '').replace(/[^a-z0-9_-]/gi, '_')}`;
}

function aadhaarSideUrl(worker, side) {
  return worker.aadhaar && worker.aadhaar[side] && worker.aadhaar[side].storagePath
    ? `/admin/api/workers/${encodeURIComponent(worker.phone)}/aadhaar/${side}`
    : '';
}

async function fetchJson(url, options) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
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
        <div class="worker-row" data-phone="${worker.phone}">
          <strong>${fmt(worker.name) || worker.phone}</strong>
          <div class="muted">+${worker.phone} · ${fmt(worker.currentPlace)}</div>
          <span class="${statusClass(worker.status)}">${fmt(worker.status)}</span>
        </div>
      `
    )
    .join('');
}

function renderDetails(worker) {
  const legacyAadhaarUrl =
    worker.aadhaar && worker.aadhaar.storagePath
      ? `/admin/api/workers/${encodeURIComponent(worker.phone)}/aadhaar`
      : '';
  const aadhaarFrontUrl = aadhaarSideUrl(worker, 'front');
  const aadhaarBackUrl = aadhaarSideUrl(worker, 'back');

  detailsEl.innerHTML = `
    <h2>${fmt(worker.name)}</h2>
    <p class="muted">+${worker.phone}</p>
    <span class="${statusClass(worker.status)}">${fmt(worker.status)}</span>

    <div class="detail-grid">
      <div class="field"><span>Gender</span>${fmt(worker.gender)}</div>
      <div class="field"><span>Current place</span>${fmt(worker.currentPlace)}</div>
      <div class="field"><span>Aadhaar consent</span>${
        worker.aadhaarConsent && worker.aadhaarConsent.accepted ? 'Accepted' : '-'
      }</div>
      <div class="field"><span>Review</span>${fmt(worker.review && worker.review.status)}</div>
      <div class="field"><span>Aadhaar front file</span>${fmt(
        worker.aadhaar && worker.aadhaar.front && worker.aadhaar.front.filename
      )}</div>
      <div class="field"><span>Aadhaar back file</span>${fmt(
        worker.aadhaar && worker.aadhaar.back && worker.aadhaar.back.filename
      )}</div>
      <div class="field"><span>Front storage path</span>${fmt(
        worker.aadhaar && worker.aadhaar.front && worker.aadhaar.front.storagePath
      )}</div>
      <div class="field"><span>Back storage path</span>${fmt(
        worker.aadhaar && worker.aadhaar.back && worker.aadhaar.back.storagePath
      )}</div>
      <div class="field"><span>Old Aadhaar file</span>${fmt(worker.aadhaar && worker.aadhaar.filename)}</div>
      <div class="field"><span>Old storage path</span>${fmt(worker.aadhaar && worker.aadhaar.storagePath)}</div>
    </div>

    <div class="actions">
      ${
        aadhaarFrontUrl
          ? `<a class="button-link" href="${aadhaarFrontUrl}" target="_blank" rel="noopener">View Aadhaar Front</a>`
          : ''
      }
      ${
        aadhaarBackUrl
          ? `<a class="button-link" href="${aadhaarBackUrl}" target="_blank" rel="noopener">View Aadhaar Back</a>`
          : ''
      }
      ${
        legacyAadhaarUrl
          ? `<a class="button-link" href="${legacyAadhaarUrl}" target="_blank" rel="noopener">View Old Aadhaar</a>`
          : ''
      }
      <button data-action="approve">Approve Aadhaar</button>
      <button class="danger" data-action="reject">Reject Aadhaar</button>
      <button class="ghost" data-action="clearFront">Request clear front</button>
      <button class="ghost" data-action="clearBack">Request clear back</button>
      <button class="ghost" data-action="clearBoth">Request both again</button>
    </div>
  `;
}

async function loadWorkers() {
  const data = await fetchJson('/admin/api/workers');
  workers = data.workers || [];
  renderWorkers();
  if (!workers.length) {
    detailsEl.innerHTML = '<div class="empty">No workers yet.</div>';
  }
}

workersEl.addEventListener('click', async (event) => {
  const row = event.target.closest('.worker-row');
  if (!row) return;
  const data = await fetchJson(`/admin/api/workers/${row.dataset.phone}`);
  renderDetails(data.worker);
});

detailsEl.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const phone = detailsEl.querySelector('.muted').textContent.replace(/\D/g, '');
  const actionMap = {
    approve: 'approve-aadhaar',
    reject: 'reject-aadhaar',
    clearFront: 'request-clear-aadhaar-front',
    clearBack: 'request-clear-aadhaar-back',
    clearBoth: 'request-clear-aadhaar'
  };
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
loadWorkers().catch((error) => {
  detailsEl.innerHTML = `<div class="empty">${error.message}</div>`;
});
