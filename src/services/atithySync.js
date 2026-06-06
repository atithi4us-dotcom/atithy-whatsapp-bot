const axios = require('axios');
const config = require('../config');
const { localeForWorker } = require('./locales');

async function syncApprovedWorker(worker) {
  if (!config.atithySyncUrl) {
    return { skipped: true, reason: 'ATITHY_APP_SYNC_URL not configured' };
  }

  const response = await axios.post(
    config.atithySyncUrl,
    {
      source: 'whatsapp_onboarding',
      phone: worker.phone,
      name: worker.name,
      gender: worker.gender,
      currentPlace: worker.currentPlace,
      locale: localeForWorker(worker),
      aadhaarVerified: true,
      aadhaar: worker.aadhaar || null,
      approvedAt: worker.approvedAt || new Date().toISOString()
    },
    {
      headers: {
        'Content-Type': 'application/json',
        ...(config.atithySyncSecret ? { Authorization: `Bearer ${config.atithySyncSecret}` } : {})
      },
      timeout: 15000
    }
  );

  return response.data || { ok: true };
}

module.exports = {
  syncApprovedWorker
};
