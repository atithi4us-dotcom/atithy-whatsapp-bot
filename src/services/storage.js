const admin = require('firebase-admin');
const config = require('../config');

let app;
let db;

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
  return doc.exists ? { phone: doc.id, ...doc.data() } : null;
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
  return snapshot.docs.map((doc) => ({ phone: doc.id, ...doc.data() }));
}

async function appendHistory(phone, event) {
  await getFirestore()
    .collection('whatsappWorkerOnboarding')
    .doc(phone)
    .set(
      {
        phone,
        updatedAt: new Date().toISOString(),
        history: admin.firestore.FieldValue.arrayUnion({
          at: new Date().toISOString(),
          ...event
        })
      },
      { merge: true }
    );
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

async function uploadAadhaar(phone, media) {
  const safeName = (media.filename || `${media.id}.${media.extension || 'bin'}`).replace(/[^a-zA-Z0-9_.-]/g, '_');
  const side = media.side ? String(media.side).replace(/[^a-zA-Z0-9_-]/g, '_') : '';
  const storagePath = ['worker-aadhaar', phone, side, `${Date.now()}-${safeName}`]
    .filter(Boolean)
    .join('/');
  const file = getBucket().file(storagePath);
  await file.save(media.buffer, {
    metadata: {
      contentType: media.mimeType || 'application/octet-stream',
      metadata: {
        phone,
        side,
        source: 'whatsapp',
        mediaId: media.id || ''
      }
    }
  });
  return {
    storagePath,
    filename: safeName,
    mimeType: media.mimeType || 'application/octet-stream',
    size: media.buffer.length,
    uploadedAt: new Date().toISOString()
  };
}

module.exports = {
  initializeStorage,
  getFirestore,
  getBucket,
  getWorker,
  saveWorker,
  listWorkers,
  appendHistory,
  claimInboundMessage,
  uploadAadhaar
};
