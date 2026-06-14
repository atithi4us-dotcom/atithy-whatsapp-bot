const admin = require('firebase-admin');
const config = require('../config');

let app;
let db;
let lastHistoryWrite = null;
let dashboardStatsCache = null;
const DASHBOARD_STATS_CACHE_MS = 30000;

function getFirebaseApp() {
  if (app) return app;

  if (!admin.apps.length) {
    const hasInlineCredential =
      config.firebaseProjectId && config.firebaseClientEmail && config.firebasePrivateKey;
    const hasCredentialFile = Boolean(config.googleApplicationCredentials);

    if (!hasInlineCredential && !hasCredentialFile) {
      throw new Error('Firebase credentials are missing.');
    }

    const credential = hasCredentialFile
      ? admin.credential.applicationDefault()
      : admin.credential.cert({
          projectId: config.firebaseProjectId,
          clientEmail: config.firebaseClientEmail,
          privateKey: config.firebasePrivateKey
        });

    app = admin.initializeApp({
      credential,
      projectId: config.firebaseProjectId || undefined,
      storageBucket: config.firebaseStorageBucket || undefined
    });
  } else {
    [app] = admin.apps;
  }

  return app;
}

function getFirestore() {
  if (!db) {
    db = admin.firestore(getFirebaseApp());
  }
  return db;
}

function getBucket() {
  return admin.storage(getFirebaseApp()).bucket(config.firebaseStorageBucket || undefined);
}

function normalizeHistoryValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return Object.values(value);
  return [];
}

function normalizeWorker(rawWorker) {
  if (!rawWorker) return rawWorker;
  return {
    ...rawWorker,
    history: normalizeHistoryValue(rawWorker.history)
  };
}

async function initializeStorage() {
  await getFirestore().collection('_health').doc('atithy-whatsapp-bot').set(
    {
      checkedAt: new Date().toISOString()
    },
    { merge: true }
  );
}

async function getWorker(phone) {
  const doc = await getFirestore().collection('whatsappWorkerOnboarding').doc(phone).get();
  return doc.exists ? { phone: doc.id, ...normalizeWorker(doc.data()) } : null;
}

async function saveWorker(phone, worker) {
  const next = {
    ...worker,
    phone,
    updatedAt: new Date().toISOString()
  };
  await getFirestore().collection('whatsappWorkerOnboarding').doc(phone).set(next, { merge: true });
  return next;
}

async function listWorkers(limit = 100) {
  const snapshot = await getFirestore()
    .collection('whatsappWorkerOnboarding')
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ phone: doc.id, ...normalizeWorker(doc.data()) }));
}

function encodeWorkerCursor(doc) {
  return Buffer.from(JSON.stringify({ phone: doc.id }), 'utf8').toString('base64url');
}

function decodeWorkerCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    return parsed && typeof parsed.phone === 'string' ? parsed.phone.replace(/\D/g, '') : null;
  } catch (_error) {
    return null;
  }
}

async function listWorkersPage({ limit = 50, cursor = '' } = {}) {
  const pageSize = Math.min(Math.max(Number.parseInt(limit, 10) || 50, 1), 50);
  const collection = getFirestore().collection('whatsappWorkerOnboarding');
  let query = collection.orderBy('updatedAt', 'desc').limit(pageSize + 1);
  const cursorPhone = decodeWorkerCursor(cursor);

  if (cursorPhone) {
    const cursorDoc = await collection.doc(cursorPhone).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.get();
  const pageDocs = snapshot.docs.slice(0, pageSize);

  return {
    workers: pageDocs.map((doc) => ({ phone: doc.id, ...normalizeWorker(doc.data()) })),
    nextCursor: snapshot.docs.length > pageSize ? encodeWorkerCursor(pageDocs[pageDocs.length - 1]) : '',
    hasMore: snapshot.docs.length > pageSize,
    limit: pageSize
  };
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

function startOfKolkataDay(date, dayOffset = 0) {
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const shifted = new Date(date.getTime() + offsetMs);
  shifted.setUTCHours(0, 0, 0, 0);
  shifted.setUTCDate(shifted.getUTCDate() + dayOffset);
  return new Date(shifted.getTime() - offsetMs);
}

function getCompletedAt(worker) {
  return (
    timestampToDate(worker.approvedAt) ||
    timestampToDate(worker.activatedAt) ||
    timestampToDate(worker.review && worker.review.reviewedAt)
  );
}

function getStartedAt(worker) {
  const directDate = timestampToDate(worker.createdAt);
  if (directDate) return directDate;

  return normalizeHistoryValue(worker.history)
    .map((event) => timestampToDate(event && event.at))
    .filter(Boolean)
    .sort((left, right) => left.getTime() - right.getTime())[0] || null;
}

function isWithin(date, start, end) {
  return Boolean(date && date >= start && (!end || date < end));
}

async function getDashboardStats() {
  if (
    dashboardStatsCache &&
    dashboardStatsCache.expiresAt > Date.now()
  ) {
    return dashboardStatsCache.stats;
  }

  const snapshot = await getFirestore().collection('whatsappWorkerOnboarding').get();
  const nowDate = new Date();
  const todayStart = startOfKolkataDay(nowDate);
  const tomorrowStart = startOfKolkataDay(nowDate, 1);
  const yesterdayStart = startOfKolkataDay(nowDate, -1);
  const sevenDaysAgo = new Date(nowDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(nowDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const stats = {
    pendingVerification: 0,
    totalCompleted: 0,
    totalMalesCompleted: 0,
    totalFemalesCompleted: 0,
    completedToday: 0,
    completedYesterday: 0,
    conversationsStartedToday: 0,
    conversationsStartedIn7Days: 0,
    conversationsStartedIn30Days: 0,
    completedIn7Days: 0,
    completedIn30Days: 0,
    generatedAt: nowDate.toISOString()
  };

  snapshot.docs.forEach((doc) => {
    const worker = normalizeWorker(doc.data()) || {};
    const status = String(worker.status || '').toLowerCase();
    const gender = String(worker.gender || '').toLowerCase();
    const completedAt = getCompletedAt(worker);
    const startedAt = getStartedAt(worker);

    if (status === 'verification_pending') {
      stats.pendingVerification += 1;
    }

    if (status === 'approved') {
      stats.totalCompleted += 1;
      if (gender === 'male') stats.totalMalesCompleted += 1;
      if (gender === 'female') stats.totalFemalesCompleted += 1;
      if (isWithin(completedAt, todayStart, tomorrowStart)) stats.completedToday += 1;
      if (isWithin(completedAt, yesterdayStart, todayStart)) stats.completedYesterday += 1;
      if (isWithin(completedAt, sevenDaysAgo)) stats.completedIn7Days += 1;
      if (isWithin(completedAt, thirtyDaysAgo)) stats.completedIn30Days += 1;
    }

    if (isWithin(startedAt, todayStart, tomorrowStart)) stats.conversationsStartedToday += 1;
    if (isWithin(startedAt, sevenDaysAgo)) stats.conversationsStartedIn7Days += 1;
    if (isWithin(startedAt, thirtyDaysAgo)) stats.conversationsStartedIn30Days += 1;
  });

  dashboardStatsCache = {
    expiresAt: Date.now() + DASHBOARD_STATS_CACHE_MS,
    stats
  };

  return stats;
}

async function appendHistory(phone, event) {
  const ref = getFirestore().collection('whatsappWorkerOnboarding').doc(phone);
  const payload = {
    at: new Date().toISOString(),
    ...event
  };
  let writeSummary = null;

  await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const existing = snapshot.exists ? snapshot.data() : {};

    const existingHistory = Array.isArray(existing.history)
      ? existing.history
      : existing.history && typeof existing.history === 'object'
        ? Object.values(existing.history)
        : [];

    const nextHistory = [...existingHistory, payload].slice(-500);

    writeSummary = {
      at: payload.at,
      phone,
      event: payload.event || null,
      type: payload.type || null,
      beforeCount: existingHistory.length,
      afterCount: nextHistory.length,
      messageId: payload.messageId || null
    };

    transaction.set(
      ref,
      {
        phone,
        ...(snapshot.exists ? {} : existing),
        updatedAt: payload.at,
        history: nextHistory
      },
      { merge: true }
    );
  });

  lastHistoryWrite = writeSummary;
}

async function claimInboundMessage(phone, messageId, initialWorker) {
  if (!messageId) return { claimed: true, worker: null };

  const ref = getFirestore().collection('whatsappWorkerOnboarding').doc(phone);
  return getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const existing = snapshot.exists ? { phone: snapshot.id, ...snapshot.data() } : null;
    const processedMessageIds = Array.isArray(existing && existing.processedMessageIds)
      ? existing.processedMessageIds
      : [];

    if (processedMessageIds.includes(messageId)) {
      return { claimed: false, worker: existing };
    }

    const nextIds = [...processedMessageIds, messageId].slice(-50);
    const base = existing || initialWorker || { phone };
    const next = {
      ...base,
      phone,
      processedMessageIds: nextIds,
      updatedAt: new Date().toISOString()
    };

    transaction.set(ref, next, { merge: true });
    return { claimed: true, worker: next };
  });
}

function getStorageDiagnostics() {
  return {
    lastHistoryWrite
  };
}

module.exports = {
  initializeStorage,
  getFirestore,
  getBucket,
  getStorageDiagnostics,
  getWorker,
  saveWorker,
  listWorkers,
  listWorkersPage,
  getDashboardStats,
  appendHistory,
  claimInboundMessage
};
