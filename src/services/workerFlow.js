const config = require('../config');
const meta = require('./metaClient');
const storage = require('./storage');
const { syncApprovedWorker } = require('./atithySync');

const STATUS = {
  AWAITING_INTEREST: 'awaiting_interest',
  NOT_INTERESTED: 'not_interested',
  AWAITING_NAME: 'awaiting_name',
  AWAITING_GENDER: 'awaiting_gender',
  AWAITING_PLACE: 'awaiting_place',
  AWAITING_AADHAAR_CONSENT: 'awaiting_aadhaar_consent',
  AWAITING_AADHAAR: 'awaiting_aadhaar',
  VERIFICATION_PENDING: 'verification_pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const BUTTONS = {
  INTEREST_YES: 'interest_yes',
  INTEREST_NO: 'interest_no',
  GENDER_MALE: 'gender_male',
  GENDER_FEMALE: 'gender_female',
  CONSENT_YES: 'aadhaar_consent_yes',
  CONSENT_NO: 'aadhaar_consent_no'
};

function now() {
  return new Date().toISOString();
}

function getText(message) {
  return (message.text && message.text.body ? message.text.body : '').trim();
}

function getReplyId(message) {
  return (
    (message.interactive &&
      message.interactive.button_reply &&
      message.interactive.button_reply.id) ||
    ''
  );
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function buildIntro() {
  return [
    'Welcome to Atithy.',
    '',
    'Atithy shares daily job opportunities with workers in Kerala.',
    '',
    'You can expect jobs like helper work, loading/unloading, packing/sorting, house shifting, hotel/restaurant helper, shop/supermarket helper, factory helper, cleaning, farm work, and event setup.',
    '',
    'For each job, you will receive date, time, job details, workplace/customer contact number, and location details.',
    '',
    'After completing the job, payment can be collected from the customer.',
    '',
    'You can earn around Rs 1000 to Rs 1200 per day.'
  ].join('\n');
}

function makeWorker(phone) {
  return {
    phone,
    status: STATUS.AWAITING_INTEREST,
    name: null,
    gender: null,
    currentPlace: null,
    aadhaarConsent: null,
    aadhaar: null,
    review: {
      status: 'not_started',
      reviewedBy: null,
      reviewedAt: null,
      note: null
    },
    source: 'whatsapp',
    createdAt: now(),
    updatedAt: now(),
    history: [{ at: now(), type: 'system', event: 'worker_created' }]
  };
}

async function sendStart(phone) {
  await meta.sendText(phone, buildIntro());
  await meta.sendButtons(phone, 'Are you interested to join Atithy as a worker?', [
    { id: BUTTONS.INTEREST_YES, title: 'Yes, continue' },
    { id: BUTTONS.INTEREST_NO, title: 'Not now' }
  ]);
}

async function createOrStart(phone) {
  let worker = await storage.getWorker(phone);
  if (!worker) {
    worker = await storage.saveWorker(phone, makeWorker(phone));
  }
  await sendStart(phone);
  await storage.appendHistory(phone, { type: 'outbound', event: 'start_sent' });
  return worker;
}

async function updateWorker(phone, patch) {
  const current = (await storage.getWorker(phone)) || makeWorker(phone);
  return storage.saveWorker(phone, {
    ...current,
    ...patch,
    review: {
      ...(current.review || {}),
      ...(patch.review || {})
    }
  });
}

async function askName(phone) {
  await meta.sendText(phone, 'Please send your full name.');
}

async function askGender(phone) {
  await meta.sendButtons(phone, 'Please select your gender.', [
    { id: BUTTONS.GENDER_MALE, title: 'Male' },
    { id: BUTTONS.GENDER_FEMALE, title: 'Female' }
  ]);
}

async function askPlace(phone) {
  await meta.sendText(phone, 'Please send your current place in Kerala.');
}

async function askAadhaarConsent(phone) {
  const text = [
    'Aadhaar verification consent',
    '',
    'By selecting I agree, you allow Atithy to collect and store your Aadhaar card only for worker identity verification and onboarding approval.'
  ].join('\n');
  await meta.sendButtons(phone, text, [
    { id: BUTTONS.CONSENT_YES, title: 'I agree' },
    { id: BUTTONS.CONSENT_NO, title: 'I do not agree' }
  ]);
}

async function askAadhaar(phone) {
  await meta.sendText(phone, 'Please upload your Aadhaar card as a clear image or PDF.');
}

function getMediaFromMessage(message) {
  if (message.image && message.image.id) {
    return {
      type: 'image',
      id: message.image.id,
      filename: 'aadhaar.jpg',
      caption: message.image.caption || ''
    };
  }
  if (message.document && message.document.id) {
    return {
      type: 'document',
      id: message.document.id,
      filename: message.document.filename || 'aadhaar.pdf',
      caption: message.document.caption || ''
    };
  }
  return null;
}

async function notifyReviewer(worker, media) {
  const caption = [
    'Atithy Aadhaar verification',
    '',
    `Worker: ${worker.name || '-'}`,
    `Phone: +${worker.phone}`,
    `Gender: ${worker.gender || '-'}`,
    `Place: ${worker.currentPlace || '-'}`,
    '',
    'Please review and choose an action.'
  ].join('\n');

  if (media.type === 'image') {
    await meta.sendImageById(config.reviewerPhone, media.id, caption);
  } else {
    await meta.sendDocumentById(config.reviewerPhone, media.id, media.filename, caption);
  }

  await meta.sendButtons(config.reviewerPhone, `Aadhaar action for +${worker.phone}`, [
    { id: `approve_${worker.phone}`, title: 'Approve' },
    { id: `reject_${worker.phone}`, title: 'Reject' },
    { id: `clear_${worker.phone}`, title: 'Need clear copy' }
  ]);
}

async function handleAadhaarUpload(phone, message, worker) {
  const incomingMedia = getMediaFromMessage(message);
  if (!incomingMedia) {
    await meta.sendText(phone, 'Please upload Aadhaar as an image or PDF.');
    return;
  }

  const downloaded = await meta.downloadMedia(incomingMedia.id);
  const stored = await storage.uploadAadhaar(phone, {
    ...downloaded,
    filename: incomingMedia.filename
  });

  const next = await updateWorker(phone, {
    status: STATUS.VERIFICATION_PENDING,
    aadhaar: {
      ...stored,
      whatsappMediaId: incomingMedia.id,
      whatsappMediaType: incomingMedia.type
    },
    review: {
      status: 'pending',
      note: null
    }
  });

  await storage.appendHistory(phone, {
    type: 'inbound',
    event: 'aadhaar_uploaded',
    storagePath: stored.storagePath
  });
  await notifyReviewer(next, incomingMedia);
  await meta.sendText(phone, 'Thank you. Your Aadhaar has been received and is now under verification.');
}

async function processWorkerMessage(phone, message) {
  await storage.appendHistory(phone, {
    type: 'inbound',
    event: 'message_received',
    messageType: message.type || null,
    text: getText(message) || null
  });

  let worker = await storage.getWorker(phone);
  if (!worker) {
    await createOrStart(phone);
    return;
  }

  const replyId = getReplyId(message);
  const text = getText(message);

  switch (worker.status) {
    case STATUS.AWAITING_INTEREST:
      if (replyId === BUTTONS.INTEREST_NO) {
        await updateWorker(phone, { status: STATUS.NOT_INTERESTED });
        await meta.sendText(phone, 'Okay. You can message us again later if you want to join Atithy.');
        return;
      }
      if (replyId !== BUTTONS.INTEREST_YES && !/^yes|continue|start$/i.test(text)) {
        await sendStart(phone);
        return;
      }
      await updateWorker(phone, { status: STATUS.AWAITING_NAME });
      await askName(phone);
      return;

    case STATUS.NOT_INTERESTED:
      await updateWorker(phone, { status: STATUS.AWAITING_INTEREST });
      await sendStart(phone);
      return;

    case STATUS.AWAITING_NAME:
      if (!text || text.length < 2) {
        await askName(phone);
        return;
      }
      await updateWorker(phone, { name: text, status: STATUS.AWAITING_GENDER });
      await askGender(phone);
      return;

    case STATUS.AWAITING_GENDER:
      if (replyId === BUTTONS.GENDER_MALE || /^male$/i.test(text)) {
        await updateWorker(phone, { gender: 'male', status: STATUS.AWAITING_PLACE });
        await askPlace(phone);
        return;
      }
      if (replyId === BUTTONS.GENDER_FEMALE || /^female$/i.test(text)) {
        await updateWorker(phone, { gender: 'female', status: STATUS.AWAITING_PLACE });
        await askPlace(phone);
        return;
      }
      await askGender(phone);
      return;

    case STATUS.AWAITING_PLACE:
      if (!text || text.length < 2) {
        await askPlace(phone);
        return;
      }
      await updateWorker(phone, { currentPlace: text, status: STATUS.AWAITING_AADHAAR_CONSENT });
      await askAadhaarConsent(phone);
      return;

    case STATUS.AWAITING_AADHAAR_CONSENT:
      if (replyId === BUTTONS.CONSENT_NO) {
        await updateWorker(phone, {
          status: STATUS.REJECTED,
          aadhaarConsent: {
            accepted: false,
            version: 'aadhaar-consent-v1',
            source: 'whatsapp',
            respondedAt: now()
          }
        });
        await meta.sendText(phone, 'Aadhaar consent is required to complete worker onboarding.');
        return;
      }
      if (replyId !== BUTTONS.CONSENT_YES && !/^agree|yes$/i.test(text)) {
        await askAadhaarConsent(phone);
        return;
      }
      await updateWorker(phone, {
        status: STATUS.AWAITING_AADHAAR,
        aadhaarConsent: {
          accepted: true,
          version: 'aadhaar-consent-v1',
          source: 'whatsapp',
          acceptedAt: now()
        }
      });
      await askAadhaar(phone);
      return;

    case STATUS.AWAITING_AADHAAR:
      worker = await storage.getWorker(phone);
      await handleAadhaarUpload(phone, message, worker);
      return;

    case STATUS.VERIFICATION_PENDING:
      await meta.sendText(phone, 'Your Aadhaar is still under verification. We will update you soon.');
      return;

    case STATUS.APPROVED:
      await meta.sendText(phone, 'Your Atithy worker onboarding is already complete. You are active for Atithy jobs.');
      return;

    case STATUS.REJECTED:
      await updateWorker(phone, { status: STATUS.AWAITING_INTEREST });
      await sendStart(phone);
      return;

    default:
      await updateWorker(phone, { status: STATUS.AWAITING_INTEREST });
      await sendStart(phone);
  }
}

async function approveWorker(phone, reviewedBy = 'reviewer') {
  const worker = await storage.getWorker(phone);
  if (!worker) throw new Error('Worker not found');

  const approvedAt = now();
  const next = await updateWorker(phone, {
    status: STATUS.APPROVED,
    approvedAt,
    activatedAt: approvedAt,
    review: {
      status: 'approved',
      reviewedBy,
      reviewedAt: approvedAt,
      note: null
    }
  });

  let syncResult = null;
  try {
    syncResult = await syncApprovedWorker(next);
  } catch (error) {
    syncResult = { ok: false, error: error.message };
  }

  await storage.appendHistory(phone, {
    type: 'system',
    event: 'aadhaar_approved',
    reviewedBy,
    syncResult
  });
  await meta.sendText(phone, 'Your Atithy worker onboarding is complete. Your profile is now active. You will receive available job details through Atithy.');
  await meta.sendText(config.reviewerPhone, `Approved and activated Atithy worker +${phone}.`);
  return { worker: next, syncResult };
}

async function rejectWorker(phone, reviewedBy = 'reviewer', action = 'reject') {
  const worker = await storage.getWorker(phone);
  if (!worker) throw new Error('Worker not found');

  const statusText = action === 'clear' ? 'clear_copy_requested' : 'rejected';
  const next = await updateWorker(phone, {
    status: STATUS.AWAITING_AADHAAR,
    review: {
      status: statusText,
      reviewedBy,
      reviewedAt: now(),
      note: action === 'clear' ? 'Need clearer Aadhaar copy' : 'Aadhaar rejected'
    }
  });

  await storage.appendHistory(phone, {
    type: 'system',
    event: statusText,
    reviewedBy
  });

  if (action === 'clear') {
    await meta.sendText(phone, 'Please upload a clearer Aadhaar image or PDF. Make sure all details are readable.');
    await meta.sendText(config.reviewerPhone, `Requested clearer Aadhaar from +${phone}.`);
  } else {
    await meta.sendText(phone, 'Your Aadhaar could not be verified. Please upload a valid Aadhaar card again.');
    await meta.sendText(config.reviewerPhone, `Rejected Aadhaar for +${phone}.`);
  }
  return next;
}

async function processReviewerMessage(phone, message) {
  const replyId = getReplyId(message);
  const text = getText(message);
  const command = replyId || text;

  const match = /^(approve|reject|clear)[_\s:+-]*(\d{10,15})$/i.exec(command);
  if (!match) {
    await meta.sendText(phone, 'Reviewer command not recognized. Use Approve, Reject, or Need clear copy buttons.');
    return;
  }

  const action = match[1].toLowerCase();
  const workerPhone = normalizePhone(match[2]);
  if (action === 'approve') {
    await approveWorker(workerPhone, phone);
  } else {
    await rejectWorker(workerPhone, phone, action);
  }
}

async function processIncomingMessage(phone, message) {
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone === config.reviewerPhone) {
    await processReviewerMessage(normalizedPhone, message);
    return;
  }
  await processWorkerMessage(normalizedPhone, message);
}

module.exports = {
  STATUS,
  processIncomingMessage,
  approveWorker,
  rejectWorker
};
