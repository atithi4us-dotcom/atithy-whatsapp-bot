const config = require('../config');
const meta = require('./metaClient');
const storage = require('./storage');
const { syncApprovedWorker } = require('./atithySync');
const {
  SUPPORTED_LANGUAGES,
  DISTRICTS,
  localeForWorker,
  localeFromLanguageSelection,
  textFor,
  districtLabel,
  isAffirmativeText,
  isNegativeText,
  genderFromText
} = require('./locales');

const STATUS = {
  AWAITING_LANGUAGE: 'awaiting_language',
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

function isRecent(isoDate, windowMs = 30000) {
  if (!isoDate) return false;
  const time = Date.parse(isoDate);
  return Number.isFinite(time) && Date.now() - time < windowMs;
}

function getText(message) {
  return (message.text && message.text.body ? message.text.body : '').trim();
}

function getReplyId(message) {
  return (
    (message.interactive &&
      message.interactive.button_reply &&
      message.interactive.button_reply.id) ||
    (message.interactive &&
      message.interactive.list_reply &&
      message.interactive.list_reply.id) ||
    ''
  );
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function isResetCommand(text) {
  return /^(\/reset|reset|restart|start over)$/i.test(text);
}

function buildDistrictId(district) {
  return `district_${district.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
}

function districtFromReply(replyId) {
  return DISTRICTS.find((district) => buildDistrictId(district) === replyId) || null;
}

function makeWorker(phone) {
  return {
    phone,
    status: STATUS.AWAITING_LANGUAGE,
    language: null,
    locale: null,
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
    languagePromptSentAt: null,
    history: [{ at: now(), type: 'system', event: 'worker_created' }]
  };
}

async function askLanguage(phone) {
  await meta.sendList(phone, 'Please choose your language.\nकृपया अपनी भाषा चुनें।', 'Language', [
    {
      title: 'Available languages',
      rows: SUPPORTED_LANGUAGES.map((language) => ({
        id: language.id,
        title: language.title,
        description: language.subtitle
      }))
    }
  ]);
}

async function askInterest(phone, locale) {
  await meta.sendButtons(phone, textFor(locale, 'interested'), [
    { id: BUTTONS.INTEREST_YES, title: textFor(locale, 'yes') },
    { id: BUTTONS.INTEREST_NO, title: textFor(locale, 'no') }
  ]);
}

async function sendStart(phone, locale) {
  await meta.sendText(phone, textFor(locale, 'intro'));
  await askInterest(phone, locale);
}

async function createOrStart(phone) {
  let worker = await storage.getWorker(phone);
  if (!worker) {
    worker = await storage.saveWorker(phone, makeWorker(phone));
  }
  await updateWorker(phone, { languagePromptSentAt: now() });
  await askLanguage(phone);
  await storage.appendHistory(phone, { type: 'outbound', event: 'language_prompt_sent' });
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
  const worker = await storage.getWorker(phone);
  await meta.sendText(phone, textFor(localeForWorker(worker), 'name'));
}

async function askGender(phone) {
  const locale = localeForWorker(await storage.getWorker(phone));
  await meta.sendButtons(phone, textFor(locale, 'gender'), [
    { id: BUTTONS.GENDER_MALE, title: textFor(locale, 'male') },
    { id: BUTTONS.GENDER_FEMALE, title: textFor(locale, 'female') }
  ]);
}

async function askPlace(phone) {
  const locale = localeForWorker(await storage.getWorker(phone));
  await meta.sendText(phone, textFor(locale, 'districtIntro'));

  const firstHalf = DISTRICTS.slice(0, 7);
  const secondHalf = DISTRICTS.slice(7);
  await meta.sendList(phone, textFor(locale, 'districtList1'), textFor(locale, 'districtButton'), [
    {
      title: textFor(locale, 'districtSection1'),
      rows: firstHalf.map((district) => ({
        id: buildDistrictId(district),
        title: districtLabel(district, locale)
      }))
    }
  ]);
  await meta.sendList(phone, textFor(locale, 'districtList2'), textFor(locale, 'districtButton'), [
    {
      title: textFor(locale, 'districtSection2'),
      rows: secondHalf.map((district) => ({
        id: buildDistrictId(district),
        title: districtLabel(district, locale)
      }))
    }
  ]);
}

async function askAadhaarConsent(phone) {
  const locale = localeForWorker(await storage.getWorker(phone));
  await meta.sendButtons(phone, textFor(locale, 'aadhaarConsent'), [
    { id: BUTTONS.CONSENT_YES, title: textFor(locale, 'consentYes') },
    { id: BUTTONS.CONSENT_NO, title: textFor(locale, 'consentNo') }
  ]);
}

async function askAadhaar(phone) {
  const worker = await storage.getWorker(phone);
  await meta.sendText(phone, textFor(localeForWorker(worker), 'aadhaarUpload'));
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
    await meta.sendText(phone, textFor(localeForWorker(worker), 'aadhaarUpload'));
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
  await meta.sendText(phone, textFor(localeForWorker(next), 'aadhaarReceived'));
}

async function processWorkerMessage(phone, message) {
  let worker = await storage.getWorker(phone);
  const claim = await storage.claimInboundMessage(phone, message.id || '', worker || makeWorker(phone));
  if (!claim.claimed) return;
  worker = claim.worker || worker;
  if (!worker) {
    worker = await storage.saveWorker(phone, makeWorker(phone));
  }

  await storage.appendHistory(phone, {
    type: 'inbound',
    event: 'message_received',
    messageId: message.id || null,
    messageType: message.type || null,
    text: getText(message) || null
  });

  const replyId = getReplyId(message);
  const text = getText(message);

  if (isResetCommand(text)) {
    await updateWorker(phone, {
      status: STATUS.AWAITING_LANGUAGE,
      language: null,
      locale: null,
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
      languagePromptSentAt: now()
    });
    await askLanguage(phone);
    await storage.appendHistory(phone, { type: 'system', event: 'worker_reset_by_chat_command' });
    return;
  }

  switch (worker.status) {
    case STATUS.AWAITING_LANGUAGE: {
      const locale = localeFromLanguageSelection(replyId, text);
      if (!locale) {
        if (isRecent(worker.languagePromptSentAt)) return;
        await updateWorker(phone, { languagePromptSentAt: now() });
        await askLanguage(phone);
        return;
      }
      await updateWorker(phone, {
        language: locale,
        locale,
        status: STATUS.AWAITING_INTEREST,
        startSentAt: now()
      });
      await sendStart(phone, locale);
      await storage.appendHistory(phone, { type: 'outbound', event: 'start_sent', locale });
      return;
    }

    case STATUS.AWAITING_INTEREST:
      if (replyId === BUTTONS.INTEREST_NO || isNegativeText(text)) {
        await updateWorker(phone, { status: STATUS.NOT_INTERESTED });
        await meta.sendText(phone, textFor(localeForWorker(worker), 'notNow'));
        return;
      }
      if (replyId !== BUTTONS.INTEREST_YES && !isAffirmativeText(text)) {
        await meta.sendText(phone, textFor(localeForWorker(worker), 'chooseOption'));
        await askInterest(phone, localeForWorker(worker));
        return;
      }
      await updateWorker(phone, { status: STATUS.AWAITING_NAME });
      await askName(phone);
      return;

    case STATUS.NOT_INTERESTED:
      await updateWorker(phone, { status: STATUS.AWAITING_LANGUAGE });
      await askLanguage(phone);
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
      if (replyId === BUTTONS.GENDER_MALE || genderFromText(text) === 'male') {
        await updateWorker(phone, { gender: 'male', status: STATUS.AWAITING_PLACE });
        await askPlace(phone);
        return;
      }
      if (replyId === BUTTONS.GENDER_FEMALE || genderFromText(text) === 'female') {
        await updateWorker(phone, { gender: 'female', status: STATUS.AWAITING_PLACE });
        await askPlace(phone);
        return;
      }
      await askGender(phone);
      return;

    case STATUS.AWAITING_PLACE:
      {
        const district = districtFromReply(replyId);
        if (!district) {
          await askPlace(phone);
          return;
        }
        await updateWorker(phone, { currentPlace: district, status: STATUS.AWAITING_AADHAAR_CONSENT });
        await askAadhaarConsent(phone);
        return;
      }
    case STATUS.AWAITING_AADHAAR_CONSENT:
      if (replyId === BUTTONS.CONSENT_NO || isNegativeText(text)) {
        await updateWorker(phone, {
          status: STATUS.REJECTED,
          aadhaarConsent: {
            accepted: false,
            version: 'aadhaar-consent-v1',
            source: 'whatsapp',
            respondedAt: now()
          }
        });
        await meta.sendText(phone, textFor(localeForWorker(worker), 'aadhaarRequired'));
        return;
      }
      if (replyId !== BUTTONS.CONSENT_YES && !isAffirmativeText(text)) {
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
      await meta.sendText(phone, textFor(localeForWorker(worker), 'aadhaarPending'));
      return;

    case STATUS.APPROVED:
      await meta.sendText(phone, textFor(localeForWorker(worker), 'approvedAlready'));
      return;

    case STATUS.REJECTED:
      await updateWorker(phone, { status: STATUS.AWAITING_LANGUAGE });
      await askLanguage(phone);
      return;

    default:
      await updateWorker(phone, { status: STATUS.AWAITING_LANGUAGE, languagePromptSentAt: now() });
      await askLanguage(phone);
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
  await meta.sendText(phone, textFor(localeForWorker(next), 'complete'));
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
    await meta.sendText(phone, textFor(localeForWorker(worker), 'clearer'));
    await meta.sendText(config.reviewerPhone, `Requested clearer Aadhaar from +${phone}.`);
  } else {
    await meta.sendText(phone, textFor(localeForWorker(worker), 'rejected'));
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
