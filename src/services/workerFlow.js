const path = require('path');
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
  districtFromText,
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
  AWAITING_AADHAAR_FRONT: 'awaiting_aadhaar_front',
  AWAITING_AADHAAR_BACK: 'awaiting_aadhaar_back',
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
  CONSENT_NO: 'aadhaar_consent_no',
  APP_INSTALLED_YES: 'app_installed_yes',
  APP_INSTALLED_NO: 'app_installed_no'
};

const JOB_ACCEPTANCE_VIDEO_PATHS = {
  'hi-IN': path.join(__dirname, '../../videos/whatsapp/job-accept-hi.mp4'),
  'ta-IN': path.join(__dirname, '../../videos/whatsapp/job-accept-ta.mp4'),
  'bn-IN': path.join(__dirname, '../../videos/job-accept-bn.mp4'),
  'or-IN': path.join(__dirname, '../../videos/job-accept-or.mp4'),
  'as-IN': path.join(__dirname, '../../videos/job-accept-as.mp4'),
  'en-IN': path.join(__dirname, '../../videos/job-accept-en.mp4')
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

function getInteractiveReply(message) {
  const buttonReply = message.interactive && message.interactive.button_reply;
  if (buttonReply && buttonReply.id) {
    return {
      id: buttonReply.id,
      title: buttonReply.title || '',
      type: 'button'
    };
  }

  const listReply = message.interactive && message.interactive.list_reply;
  if (listReply && listReply.id) {
    return {
      id: listReply.id,
      title: listReply.title || '',
      description: listReply.description || '',
      type: 'list'
    };
  }

  return null;
}

function getReplyId(message) {
  const reply = getInteractiveReply(message);
  return (reply && reply.id) || '';
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

function readableReplyLabel(replyId) {
  if (!replyId) return '';

  const language = SUPPORTED_LANGUAGES.find((entry) => entry.id === replyId);
  if (language) return language.title;

  const district = districtFromReply(replyId);
  if (district) return district;

  const labels = {
    [BUTTONS.INTEREST_YES]: 'Yes',
    [BUTTONS.INTEREST_NO]: 'No',
    [BUTTONS.GENDER_MALE]: 'Male',
    [BUTTONS.GENDER_FEMALE]: 'Female',
    [BUTTONS.CONSENT_YES]: 'I agree',
    [BUTTONS.CONSENT_NO]: 'I do not agree',
    [BUTTONS.APP_INSTALLED_YES]: 'Installed',
    [BUTTONS.APP_INSTALLED_NO]: 'Not yet'
  };

  return labels[replyId] || '';
}

function getInboundHistoryText(message) {
  const text = getText(message);
  if (text) return text;

  const reply = getInteractiveReply(message);
  if (reply) return reply.title || readableReplyLabel(reply.id) || reply.id;

  const media = getMediaFromMessage(message);
  if (media && media.caption) return media.caption;
  if (media) return media.type === 'document' ? media.filename || 'Document uploaded' : 'Image uploaded';

  return '';
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
    appInstall: null,
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
  const promptText = 'Please choose your language.\nकृपया अपनी भाषा चुनें।';
  try {
    await meta.sendList(phone, promptText, 'Language', [
      {
        title: 'Available languages',
        rows: SUPPORTED_LANGUAGES.map((language) => ({
          id: language.id,
          title: language.title,
          description: language.subtitle
        }))
      }
    ]);
  } catch (error) {
    console.error('[LANGUAGE_LIST_ERROR]', error.response ? error.response.data : error.message);
    const fallbackText = [
      'Please choose your language by typing the name or number:',
      '',
      ...SUPPORTED_LANGUAGES.map(
        (language, index) => `${index + 1}. ${language.title} (${language.subtitle})`
      )
    ].join('\n');
    await meta.sendText(phone, fallbackText);
    await storage.appendHistory(phone, { type: 'outbound', event: 'language_prompt_sent', text: fallbackText });
    return;
  }
  await storage.appendHistory(phone, { type: 'outbound', event: 'language_prompt_sent', text: promptText });
}

async function askInterest(phone, locale) {
  const text = textFor(locale, 'interested');
  await meta.sendButtons(phone, text, [
    { id: BUTTONS.INTEREST_YES, title: textFor(locale, 'yes') },
    { id: BUTTONS.INTEREST_NO, title: textFor(locale, 'no') }
  ]);
  await storage.appendHistory(phone, { type: 'outbound', event: 'interest_prompt', text });
}

async function sendStart(phone, locale) {
  const text = textFor(locale, 'intro');
  await sendWorkerText(phone, text, 'intro_sent', { locale });
  await askInterest(phone, locale);
}

async function createOrStart(phone) {
  let worker = await storage.getWorker(phone);
  if (!worker) {
    worker = await storage.saveWorker(phone, makeWorker(phone));
  }
  await updateWorker(phone, { languagePromptSentAt: now() });
  await askLanguage(phone);
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

async function sendWorkerText(phone, text, event, extra = {}) {
  await meta.sendText(phone, text);
  await storage.appendHistory(phone, {
    type: 'outbound',
    event,
    text,
    ...extra
  });
}

async function askName(phone) {
  const worker = await storage.getWorker(phone);
  const text = textFor(localeForWorker(worker), 'name');
  await sendWorkerText(phone, text, 'name_prompt');
}

async function askGender(phone) {
  const locale = localeForWorker(await storage.getWorker(phone));
  const text = textFor(locale, 'gender');
  await meta.sendButtons(phone, text, [
    { id: BUTTONS.GENDER_MALE, title: textFor(locale, 'male') },
    { id: BUTTONS.GENDER_FEMALE, title: textFor(locale, 'female') }
  ]);
  await storage.appendHistory(phone, { type: 'outbound', event: 'gender_prompt', text });
}

async function askPlace(phone) {
  const locale = localeForWorker(await storage.getWorker(phone));
  const introText = textFor(locale, 'districtIntro');
  await meta.sendText(phone, introText);

  const firstHalf = DISTRICTS.slice(0, 7);
  const secondHalf = DISTRICTS.slice(7);
  const firstListText = textFor(locale, 'districtList1');
  const secondListText = textFor(locale, 'districtList2');
  await meta.sendList(phone, firstListText, textFor(locale, 'districtButton'), [
    {
      title: textFor(locale, 'districtSection1'),
      rows: firstHalf.map((district) => ({
        id: buildDistrictId(district),
        title: districtLabel(district, locale)
      }))
    }
  ]);
  await meta.sendList(phone, secondListText, textFor(locale, 'districtButton'), [
    {
      title: textFor(locale, 'districtSection2'),
      rows: secondHalf.map((district) => ({
        id: buildDistrictId(district),
        title: districtLabel(district, locale)
      }))
    }
  ]);
  await storage.appendHistory(phone, {
    type: 'outbound',
    event: 'place_prompt',
    text: [introText, firstListText, secondListText].join('\n')
  });
}

async function askAadhaarConsent(phone) {
  const locale = localeForWorker(await storage.getWorker(phone));
  const text = textFor(locale, 'aadhaarConsent');
  await meta.sendButtons(phone, text, [
    { id: BUTTONS.CONSENT_YES, title: textFor(locale, 'consentYes') },
    { id: BUTTONS.CONSENT_NO, title: textFor(locale, 'consentNo') }
  ]);
  await storage.appendHistory(phone, { type: 'outbound', event: 'aadhaar_consent_prompt', text });
}

async function askAadhaar(phone) {
  const worker = await storage.getWorker(phone);
  const text = textFor(localeForWorker(worker), 'aadhaarUpload');
  await sendWorkerText(phone, text, 'aadhaar_upload_prompt');
}

async function askAadhaarFront(phone) {
  const worker = await storage.getWorker(phone);
  const text = textFor(localeForWorker(worker), 'aadhaarFrontUpload');
  await sendWorkerText(phone, text, 'aadhaar_front_prompt');
}

async function askAadhaarBack(phone) {
  const worker = await storage.getWorker(phone);
  const text = textFor(localeForWorker(worker), 'aadhaarBackUpload');
  await sendWorkerText(phone, text, 'aadhaar_back_prompt');
}

function jobAcceptanceVideoPathFor(locale) {
  return JOB_ACCEPTANCE_VIDEO_PATHS[localeForWorker({ locale })] || JOB_ACCEPTANCE_VIDEO_PATHS['en-IN'];
}

async function updateAppInstall(phone, patch) {
  const current = await storage.getWorker(phone);
  return updateWorker(phone, {
    appInstall: {
      ...((current && current.appInstall) || {}),
      ...patch
    }
  });
}

async function askAppInstall(phone) {
  const worker = await storage.getWorker(phone);
  const locale = localeForWorker(worker);
  const text = [
    textFor(locale, 'appInstallPrompt'),
    '',
    config.atithyAppDownloadUrl,
    '',
    textFor(locale, 'appInstallQuestion')
  ].join('\n');
  await meta.sendButtons(phone, text, [
    { id: BUTTONS.APP_INSTALLED_YES, title: textFor(locale, 'installedYes') },
    { id: BUTTONS.APP_INSTALLED_NO, title: textFor(locale, 'installedNo') }
  ]);
  await storage.appendHistory(phone, { type: 'outbound', event: 'app_install_prompt_sent', text });
  await updateAppInstall(phone, {
    status: 'awaiting_confirmation',
    linkSentAt: now(),
    downloadUrl: config.atithyAppDownloadUrl
  });
}

async function sendPostApprovalGuidance(phone, worker) {
  const locale = localeForWorker(worker);
  const videoPath = jobAcceptanceVideoPathFor(locale);
  const upload = await meta.sendVideoFile(phone, videoPath, textFor(locale, 'appVideoCaption'));
  await updateAppInstall(phone, {
    status: 'video_sent',
    videoLocale: locale,
    videoPath: path.basename(videoPath),
    videoMediaId: upload && upload.id ? upload.id : null,
    videoSentAt: now()
  });
  await storage.appendHistory(phone, {
    type: 'outbound',
    event: 'job_acceptance_video_sent',
    locale,
    videoPath: path.basename(videoPath)
  });
  await askAppInstall(phone);
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

async function sendReviewerAadhaarSide(worker, side, aadhaarSide) {
  if (!aadhaarSide || !aadhaarSide.whatsappMediaId) return;

  const caption = [
    `Aadhaar ${side}`,
    '',
    `Worker: ${worker.name || '-'}`,
    `Phone: +${worker.phone}`,
    `Gender: ${worker.gender || '-'}`,
    `Place: ${worker.currentPlace || '-'}`
  ].join('\n');

  try {
    if (aadhaarSide.whatsappMediaType === 'image') {
      await meta.sendImageById(config.reviewerPhone, aadhaarSide.whatsappMediaId, caption);
    } else {
      await meta.sendDocumentById(
        config.reviewerPhone,
        aadhaarSide.whatsappMediaId,
        aadhaarSide.filename || `aadhaar-${side}.pdf`,
        caption
      );
    }
  } catch (error) {
    console.error(
      '[REVIEWER_AADHAAR_MEDIA_ERROR]',
      JSON.stringify({ phone: worker.phone, side, error: error.message })
    );
  }
}

async function notifyReviewer(worker) {
  const caption = [
    'Atithy Aadhaar verification',
    '',
    `Worker: ${worker.name || '-'}`,
    `Phone: +${worker.phone}`,
    `Gender: ${worker.gender || '-'}`,
    `Place: ${worker.currentPlace || '-'}`,
    '',
    'Aadhaar front and back are uploaded.',
    'Please review in admin dashboard and choose an action.'
  ].join('\n');

  await meta.sendText(config.reviewerPhone, caption);
  await sendReviewerAadhaarSide(worker, 'front', worker.aadhaar && worker.aadhaar.front);
  await sendReviewerAadhaarSide(worker, 'back', worker.aadhaar && worker.aadhaar.back);

  await meta.sendButtons(config.reviewerPhone, `Aadhaar action for +${worker.phone}`, [
    { id: `approve_${worker.phone}`, title: 'Approve' },
    { id: `reject_${worker.phone}`, title: 'Reject' },
    { id: `clear_both_${worker.phone}`, title: 'Need clear copy' }
  ]);
}

function legacyAadhaarFrom(worker) {
  const aadhaar = worker && worker.aadhaar;
  if (aadhaar && aadhaar.storagePath) return { legacy: aadhaar };
  return aadhaar || {};
}

function uploadedAadhaarSide(stored, incomingMedia) {
  return {
    ...stored,
    whatsappMediaId: incomingMedia.id,
    whatsappMediaType: incomingMedia.type
  };
}

async function markAadhaarPending(phone, worker, aadhaar) {
  const next = await updateWorker(phone, {
    status: STATUS.VERIFICATION_PENDING,
    aadhaar,
    aadhaarRequest: null,
    review: {
      status: 'pending',
      note: null
    }
  });

  await notifyReviewer(next);
  await sendWorkerText(
    phone,
    textFor(localeForWorker(next), 'aadhaarBothReceived'),
    'aadhaar_both_received_sent'
  );
  return next;
}

async function handleAadhaarSideUpload(phone, message, worker, side) {
  const incomingMedia = getMediaFromMessage(message);
  if (!incomingMedia) {
    const messageKey = side === 'front' ? 'aadhaarFrontUpload' : 'aadhaarBackUpload';
    const event = side === 'front' ? 'aadhaar_front_prompt' : 'aadhaar_back_prompt';
    await sendWorkerText(phone, textFor(localeForWorker(worker), messageKey), event);
    return;
  }

  const downloaded = await meta.downloadMedia(incomingMedia.id);
  const stored = await storage.uploadAadhaar(phone, {
    ...downloaded,
    side,
    filename: incomingMedia.filename
  });

  const aadhaar = {
    ...legacyAadhaarFrom(worker),
    [side]: uploadedAadhaarSide(stored, incomingMedia)
  };
  const requestSide = worker && worker.aadhaarRequest && worker.aadhaarRequest.side;

  if (side === 'front') {
    if (requestSide === 'front' && aadhaar.back && aadhaar.back.storagePath) {
      await storage.appendHistory(phone, {
        type: 'inbound',
        event: 'aadhaar_front_uploaded',
        storagePath: stored.storagePath
      });
      return markAadhaarPending(phone, worker, aadhaar);
    }

    const next = await updateWorker(phone, {
      status: STATUS.AWAITING_AADHAAR_BACK,
      aadhaar,
      aadhaarRequest: requestSide === 'both' ? worker.aadhaarRequest : null,
      review: {
        status: 'not_started',
        note: null
      }
    });

    await storage.appendHistory(phone, {
      type: 'inbound',
      event: 'aadhaar_front_uploaded',
      storagePath: stored.storagePath
    });
    await askAadhaarBack(phone);
    return next;
  }

  const next = await updateWorker(phone, {
    status: STATUS.VERIFICATION_PENDING,
    aadhaar,
    aadhaarRequest: null,
    review: {
      status: 'pending',
      note: null
    }
  });

  await storage.appendHistory(phone, {
    type: 'inbound',
    event: 'aadhaar_back_uploaded',
    storagePath: stored.storagePath
  });
  await notifyReviewer(next);
  await sendWorkerText(
    phone,
    textFor(localeForWorker(next), 'aadhaarBothReceived'),
    'aadhaar_both_received_sent'
  );
  return next;
}

async function processWorkerMessage(phone, message) {
  let worker = await storage.getWorker(phone);
  const claim = await storage.claimInboundMessage(phone, message.id || '', worker || makeWorker(phone));
  if (!claim.claimed) return;
  worker = claim.worker || worker;
  if (!worker) {
    worker = await storage.saveWorker(phone, makeWorker(phone));
  }

  const interactiveReply = getInteractiveReply(message);
  await storage.appendHistory(phone, {
    type: 'inbound',
    event: 'message_received',
    messageId: message.id || null,
    messageType: message.type || null,
    text: getInboundHistoryText(message) || null,
    typedText: getText(message) || null,
    replyId: (interactiveReply && interactiveReply.id) || null,
    replyTitle: (interactiveReply && interactiveReply.title) || null,
    replyDescription: (interactiveReply && interactiveReply.description) || null,
    replyType: (interactiveReply && interactiveReply.type) || null
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
      appInstall: null,
      aadhaarRequest: null,
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
      return;
    }

    case STATUS.AWAITING_INTEREST:
      if (replyId === BUTTONS.INTEREST_NO || isNegativeText(text)) {
        await updateWorker(phone, { status: STATUS.NOT_INTERESTED });
        await sendWorkerText(phone, textFor(localeForWorker(worker), 'notNow'), 'not_now_sent');
        return;
      }
      if (replyId !== BUTTONS.INTEREST_YES && !isAffirmativeText(text)) {
        await sendWorkerText(phone, textFor(localeForWorker(worker), 'chooseOption'), 'choose_option_sent');
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
        const district =
          districtFromReply(replyId) ||
          districtFromText(
            text || (interactiveReply && interactiveReply.title),
            localeForWorker(worker)
          );
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
        await sendWorkerText(
          phone,
          textFor(localeForWorker(worker), 'aadhaarRequired'),
          'aadhaar_required_sent'
        );
        return;
      }
      if (replyId !== BUTTONS.CONSENT_YES && !isAffirmativeText(text)) {
        await askAadhaarConsent(phone);
        return;
      }
      await updateWorker(phone, {
        status: STATUS.AWAITING_AADHAAR_FRONT,
        aadhaarRequest: null,
        aadhaarConsent: {
          accepted: true,
          version: 'aadhaar-consent-v1',
          source: 'whatsapp',
          acceptedAt: now()
        }
      });
      await askAadhaarFront(phone);
      return;

    case STATUS.AWAITING_AADHAAR:
      worker = await storage.getWorker(phone);
      await handleAadhaarSideUpload(phone, message, worker, 'front');
      return;

    case STATUS.AWAITING_AADHAAR_FRONT:
      worker = await storage.getWorker(phone);
      await handleAadhaarSideUpload(phone, message, worker, 'front');
      return;

    case STATUS.AWAITING_AADHAAR_BACK:
      worker = await storage.getWorker(phone);
      await handleAadhaarSideUpload(phone, message, worker, 'back');
      return;

    case STATUS.VERIFICATION_PENDING:
      await sendWorkerText(phone, textFor(localeForWorker(worker), 'aadhaarPending'), 'aadhaar_pending_sent');
      return;

    case STATUS.APPROVED:
      if (replyId === BUTTONS.APP_INSTALLED_YES || isAffirmativeText(text)) {
        await updateAppInstall(phone, {
          status: 'installed',
          confirmedAt: now(),
          confirmedBy: 'worker'
        });
        await storage.appendHistory(phone, { type: 'inbound', event: 'app_install_confirmed' });
        await sendWorkerText(phone, textFor(localeForWorker(worker), 'appReady'), 'app_ready_sent');
        return;
      }
      if (replyId === BUTTONS.APP_INSTALLED_NO || isNegativeText(text)) {
        await sendWorkerText(
          phone,
          textFor(localeForWorker(worker), 'appInstallReminder'),
          'app_install_reminder_sent'
        );
        await askAppInstall(phone);
        await storage.appendHistory(phone, { type: 'outbound', event: 'app_install_prompt_resent' });
        return;
      }
      if (worker.appInstall && worker.appInstall.status === 'installed') {
        await sendWorkerText(
          phone,
          textFor(localeForWorker(worker), 'approvedAlready'),
          'approved_already_sent'
        );
        return;
      }
      if (!worker.appInstall || (!worker.appInstall.videoSentAt && worker.appInstall.status !== 'installed')) {
        try {
          await sendPostApprovalGuidance(phone, worker);
          return;
        } catch (error) {
          console.error('[POST_APPROVAL_GUIDANCE_RETRY_ERROR]', JSON.stringify({ phone, error: error.message }));
          await updateAppInstall(phone, {
            status: 'failed',
            error: error.message,
            failedAt: now()
          });
          await storage.appendHistory(phone, {
            type: 'system',
            event: 'post_approval_guidance_retry_failed',
            error: error.message
          });
        }
      }
      await sendWorkerText(
        phone,
        textFor(localeForWorker(worker), 'appInstallChooseOption'),
        'app_install_choose_option_sent'
      );
      await askAppInstall(phone);
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

function hasReviewableAadhaar(worker) {
  const aadhaar = worker && worker.aadhaar;
  return Boolean(
    aadhaar &&
      (aadhaar.storagePath ||
        (aadhaar.front && aadhaar.front.storagePath && aadhaar.back && aadhaar.back.storagePath))
  );
}

async function approveWorker(phone, reviewedBy = 'reviewer') {
  const worker = await storage.getWorker(phone);
  if (!worker) throw new Error('Worker not found');
  if (!hasReviewableAadhaar(worker)) {
    throw new Error('Aadhaar front and back must be uploaded before approval.');
  }

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
  await sendWorkerText(phone, textFor(localeForWorker(next), 'complete'), 'complete_sent');
  try {
    await sendPostApprovalGuidance(phone, next);
  } catch (error) {
    console.error('[POST_APPROVAL_GUIDANCE_ERROR]', JSON.stringify({ phone, error: error.message }));
    await updateAppInstall(phone, {
      status: 'failed',
      error: error.message,
      failedAt: now()
    });
    await storage.appendHistory(phone, {
      type: 'system',
      event: 'post_approval_guidance_failed',
      error: error.message
    });
  }
  await meta.sendText(config.reviewerPhone, `Approved and activated Atithy worker +${phone}.`);
  return { worker: next, syncResult };
}

async function rejectWorker(phone, reviewedBy = 'reviewer', action = 'reject') {
  const worker = await storage.getWorker(phone);
  if (!worker) throw new Error('Worker not found');

  const normalizedAction = action === 'clear' ? 'clear_both' : action;
  const isClearAction = normalizedAction.startsWith('clear');
  const clearSide = normalizedAction.replace('clear_', '');
  const statusText = isClearAction ? `${clearSide}_clear_copy_requested` : 'rejected';
  const resetStatus =
    normalizedAction === 'clear_back' ? STATUS.AWAITING_AADHAAR_BACK : STATUS.AWAITING_AADHAAR_FRONT;
  const next = await updateWorker(phone, {
    status: isClearAction ? resetStatus : STATUS.AWAITING_AADHAAR_FRONT,
    aadhaarRequest: isClearAction
      ? {
          side: clearSide,
          requestedBy: reviewedBy,
          requestedAt: now()
        }
      : {
          side: 'both',
          requestedBy: reviewedBy,
          requestedAt: now()
        },
    review: {
      status: statusText,
      reviewedBy,
      reviewedAt: now(),
      note: isClearAction ? `Need clearer Aadhaar ${clearSide}` : 'Aadhaar rejected'
    }
  });

  await storage.appendHistory(phone, {
    type: 'system',
    event: statusText,
    reviewedBy
  });

  if (isClearAction) {
    const messageKey =
      normalizedAction === 'clear_front'
        ? 'clearerFront'
        : normalizedAction === 'clear_back'
          ? 'clearerBack'
          : 'clearerBoth';
    await sendWorkerText(phone, textFor(localeForWorker(worker), messageKey), `${messageKey}_sent`);
    await meta.sendText(config.reviewerPhone, `Requested clearer Aadhaar ${clearSide} from +${phone}.`);
  } else {
    await sendWorkerText(phone, textFor(localeForWorker(worker), 'rejected'), 'rejected_sent');
    await meta.sendText(config.reviewerPhone, `Rejected Aadhaar for +${phone}.`);
  }
  return next;
}

function reviewableWorker(worker) {
  return Boolean(
    worker &&
      worker.phone &&
      worker.review &&
      worker.review.status === 'pending' &&
      hasReviewableAadhaar(worker)
  );
}

async function sendPendingReviewSummary(phone) {
  const pendingWorkers = (await storage.listWorkers(50)).filter(reviewableWorker);
  if (!pendingWorkers.length) {
    await meta.sendText(phone, 'No Aadhaar reviews are pending right now.');
    return;
  }

  const lines = [
    `Pending Aadhaar reviews: ${pendingWorkers.length}`,
    '',
    `Admin: ${config.publicBaseUrl}/admin`,
    ''
  ];

  for (const worker of pendingWorkers.slice(0, 10)) {
    lines.push(`${worker.name || '-'} +${worker.phone}${worker.currentPlace ? `, ${worker.currentPlace}` : ''}`);
    lines.push(`Approve: approve_${worker.phone}`);
    lines.push(`Reject: reject_${worker.phone}`);
    lines.push(`Clear front: clear_front_${worker.phone}`);
    lines.push(`Clear back: clear_back_${worker.phone}`);
    lines.push(`Clear both: clear_both_${worker.phone}`);
    lines.push('');
  }

  if (pendingWorkers.length > 10) {
    lines.push(`Showing 10 of ${pendingWorkers.length}. Open admin for the full list.`);
  }

  await meta.sendText(phone, lines.join('\n').trim());
}

async function processReviewerMessage(phone, message) {
  const replyId = getReplyId(message);
  const text = getText(message);
  const command = replyId || text;

  const match = /^(clear_front|clear_back|clear_both|approve|reject|clear)[_\s:+-]*(\d{10,15})$/i.exec(command);
  if (!match) {
    await sendPendingReviewSummary(phone);
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
