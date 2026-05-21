const config = require('../config');
const meta = require('./metaClient');
const storage = require('./storage');
const { syncApprovedWorker } = require('./atithySync');

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
  LANGUAGE_EN: 'language_en',
  LANGUAGE_HI: 'language_hi',
  INTEREST_YES: 'interest_yes',
  INTEREST_NO: 'interest_no',
  GENDER_MALE: 'gender_male',
  GENDER_FEMALE: 'gender_female',
  CONSENT_YES: 'aadhaar_consent_yes',
  CONSENT_NO: 'aadhaar_consent_no'
};

const DISTRICTS = [
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

const DISTRICT_LABELS_HI = {
  Thiruvananthapuram: 'तिरुवनंतपुरम',
  Kollam: 'कोल्लम',
  Pathanamthitta: 'पथानामथिट्टा',
  Alappuzha: 'अलप्पुझा',
  Kottayam: 'कोट्टायम',
  Idukki: 'इडुक्की',
  Ernakulam: 'एर्नाकुलम',
  Thrissur: 'त्रिशूर',
  Palakkad: 'पलक्कड़',
  Malappuram: 'मलप्पुरम',
  Kozhikode: 'कोझिकोड',
  Wayanad: 'वायनाड',
  Kannur: 'कन्नूर',
  Kasaragod: 'कासरगोड'
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

function buildIntro(language = 'en') {
  if (language === 'hi') {
    return [
      'Atithy में आपका स्वागत है।',
      '',
      'Atithy Kerala में workers को रोज़ काम के अवसर भेजता है।',
      '',
      'आपको helper work, loading/unloading, packing/sorting, house shifting, hotel/restaurant helper, shop/supermarket helper, factory helper, cleaning, farm work और event setup जैसे काम मिल सकते हैं।',
      '',
      'हर काम के लिए आपको तारीख, समय, काम की जानकारी, workplace/customer contact number और location details मिलेंगे।',
      '',
      'काम पूरा करने के बाद payment customer से collect किया जा सकता है।',
      '',
      'आप लगभग Rs 1000 से Rs 1200 प्रति दिन कमा सकते हैं।'
    ].join('\n');
  }

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

function lang(worker) {
  return worker && worker.language === 'hi' ? 'hi' : 'en';
}

function textFor(language, key) {
  const messages = {
    en: {
      languagePrompt: 'Please choose your language.',
      interested: 'Are you interested to join Atithy as a worker?',
      notNow: 'Okay. You can message us again later if you want to join Atithy.',
      chooseOption: 'Please choose an option below.',
      name: 'Please send your full name.',
      gender: 'Please select your gender.',
      districtIntro: 'Please select your current district in Kerala.',
      districtList1: 'Kerala districts - list 1',
      districtList2: 'Kerala districts - list 2',
      aadhaarConsent: [
        'Aadhaar verification consent',
        '',
        'By selecting I agree, you allow Atithy to collect and store your Aadhaar card only for worker identity verification and onboarding approval.'
      ].join('\n'),
      aadhaarUpload: 'Please upload your Aadhaar card as a clear image or PDF.',
      aadhaarRequired: 'Aadhaar consent is required to complete worker onboarding.',
      aadhaarReceived: 'Thank you. Your Aadhaar has been received and is now under verification.',
      aadhaarPending: 'Your Aadhaar is still under verification. We will update you soon.',
      approvedAlready: 'Your Atithy worker onboarding is already complete. You are active for Atithy jobs.',
      complete: 'Your Atithy worker onboarding is complete. Your profile is now active. You will receive available job details through Atithy.',
      clearer: 'Please upload a clearer Aadhaar image or PDF. Make sure all details are readable.',
      rejected: 'Your Aadhaar could not be verified. Please upload a valid Aadhaar card again.'
    },
    hi: {
      languagePrompt: 'कृपया अपनी भाषा चुनें।',
      interested: 'क्या आप Atithy में worker के रूप में जुड़ना चाहते हैं?',
      notNow: 'ठीक है। Atithy से जुड़ना हो तो बाद में फिर message करें।',
      chooseOption: 'कृपया नीचे दिया गया option चुनें।',
      name: 'कृपया अपना पूरा नाम भेजें।',
      gender: 'कृपया अपना लिंग चुनें।',
      districtIntro: 'कृपया Kerala में अपना वर्तमान जिला चुनें।',
      districtList1: 'Kerala जिले - सूची 1',
      districtList2: 'Kerala जिले - सूची 2',
      aadhaarConsent: [
        'Aadhaar verification की सहमति',
        '',
        'I agree चुनने पर आप Atithy को worker identity verification और onboarding approval के लिए Aadhaar card collect और store करने की अनुमति देते हैं।'
      ].join('\n'),
      aadhaarUpload: 'कृपया अपना Aadhaar card clear image या PDF के रूप में upload करें।',
      aadhaarRequired: 'Worker onboarding पूरा करने के लिए Aadhaar consent ज़रूरी है।',
      aadhaarReceived: 'धन्यवाद। आपका Aadhaar मिल गया है और verification के लिए भेज दिया गया है।',
      aadhaarPending: 'आपका Aadhaar अभी verification में है। हम जल्द update देंगे।',
      approvedAlready: 'आपका Atithy worker onboarding पहले से पूरा है। आप Atithy काम के लिए active हैं।',
      complete: 'आपका Atithy worker onboarding पूरा हो गया है। आपकी profile अब active है। उपलब्ध काम की जानकारी आपको Atithy के through मिलेगी।',
      clearer: 'कृपया Aadhaar की clearer image या PDF upload करें। सभी details readable होनी चाहिए।',
      rejected: 'आपका Aadhaar verify नहीं हो पाया। कृपया valid Aadhaar card फिर से upload करें।'
    }
  };
  return messages[language][key] || messages.en[key];
}

function buildDistrictId(district) {
  return `district_${district.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
}

function districtFromReply(replyId) {
  return DISTRICTS.find((district) => buildDistrictId(district) === replyId) || null;
}

function districtLabel(district, language = 'en') {
  return language === 'hi' ? DISTRICT_LABELS_HI[district] || district : district;
}

function makeWorker(phone) {
  return {
    phone,
    status: STATUS.AWAITING_LANGUAGE,
    language: null,
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
  await meta.sendButtons(phone, 'Please choose your language.\nकृपया अपनी भाषा चुनें।', [
    { id: BUTTONS.LANGUAGE_EN, title: 'English' },
    { id: BUTTONS.LANGUAGE_HI, title: 'हिन्दी' }
  ]);
}

async function askInterest(phone, language = 'en') {
  await meta.sendButtons(phone, textFor(language, 'interested'), [
    { id: BUTTONS.INTEREST_YES, title: language === 'hi' ? 'हाँ' : 'Yes, continue' },
    { id: BUTTONS.INTEREST_NO, title: language === 'hi' ? 'अभी नहीं' : 'Not now' }
  ]);
}

async function sendStart(phone, language = 'en') {
  await meta.sendText(phone, buildIntro(language));
  await askInterest(phone, language);
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
  await meta.sendText(phone, textFor(lang(worker), 'name'));
}

async function askGender(phone) {
  const language = lang(await storage.getWorker(phone));
  await meta.sendButtons(phone, textFor(language, 'gender'), [
    { id: BUTTONS.GENDER_MALE, title: language === 'hi' ? 'पुरुष' : 'Male' },
    { id: BUTTONS.GENDER_FEMALE, title: language === 'hi' ? 'महिला' : 'Female' }
  ]);
}

async function askPlace(phone) {
  const language = lang(await storage.getWorker(phone));
  await meta.sendText(phone, textFor(language, 'districtIntro'));

  const firstHalf = DISTRICTS.slice(0, 7);
  const secondHalf = DISTRICTS.slice(7);
  await meta.sendList(phone, textFor(language, 'districtList1'), language === 'hi' ? 'जिला चुनें' : 'Choose district', [
    {
      title: language === 'hi' ? 'जिले 1-7' : 'Districts 1-7',
      rows: firstHalf.map((district) => ({
        id: buildDistrictId(district),
        title: districtLabel(district, language)
      }))
    }
  ]);
  await meta.sendList(phone, textFor(language, 'districtList2'), language === 'hi' ? 'जिला चुनें' : 'Choose district', [
    {
      title: language === 'hi' ? 'जिले 8-14' : 'Districts 8-14',
      rows: secondHalf.map((district) => ({
        id: buildDistrictId(district),
        title: districtLabel(district, language)
      }))
    }
  ]);
}

async function askAadhaarConsent(phone) {
  const language = lang(await storage.getWorker(phone));
  await meta.sendButtons(phone, textFor(language, 'aadhaarConsent'), [
    { id: BUTTONS.CONSENT_YES, title: language === 'hi' ? 'मैं सहमत हूँ' : 'I agree' },
    { id: BUTTONS.CONSENT_NO, title: language === 'hi' ? 'मैं सहमत नहीं हूँ' : 'I do not agree' }
  ]);
}

async function askAadhaar(phone) {
  const worker = await storage.getWorker(phone);
  await meta.sendText(phone, textFor(lang(worker), 'aadhaarUpload'));
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
    await meta.sendText(phone, textFor(lang(worker), 'aadhaarUpload'));
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
  await meta.sendText(phone, textFor(lang(next), 'aadhaarReceived'));
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

  switch (worker.status) {
    case STATUS.AWAITING_LANGUAGE: {
      let language = null;
      if (replyId === BUTTONS.LANGUAGE_EN || /^(english|en)$/i.test(text)) {
        language = 'en';
      }
      if (replyId === BUTTONS.LANGUAGE_HI || /^(hindi|हिंदी|हिन्दी)$/i.test(text)) {
        language = 'hi';
      }
      if (!language) {
        if (isRecent(worker.languagePromptSentAt)) return;
        await updateWorker(phone, { languagePromptSentAt: now() });
        await askLanguage(phone);
        return;
      }
      await updateWorker(phone, {
        language,
        status: STATUS.AWAITING_INTEREST,
        startSentAt: now()
      });
      await sendStart(phone, language);
      await storage.appendHistory(phone, { type: 'outbound', event: 'start_sent', language });
      return;
    }

    case STATUS.AWAITING_INTEREST:
      if (replyId === BUTTONS.INTEREST_NO) {
        await updateWorker(phone, { status: STATUS.NOT_INTERESTED });
        await meta.sendText(phone, textFor(lang(worker), 'notNow'));
        return;
      }
      if (replyId !== BUTTONS.INTEREST_YES && !/^(yes|continue|start|हाँ|हां)$/i.test(text)) {
        await meta.sendText(phone, textFor(lang(worker), 'chooseOption'));
        await askInterest(phone, lang(worker));
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
        await meta.sendText(phone, textFor(lang(worker), 'aadhaarRequired'));
        return;
      }
      if (replyId !== BUTTONS.CONSENT_YES && !/^(agree|yes|हाँ|हां|सहमत)$/i.test(text)) {
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
      await meta.sendText(phone, textFor(lang(worker), 'aadhaarPending'));
      return;

    case STATUS.APPROVED:
      await meta.sendText(phone, textFor(lang(worker), 'approvedAlready'));
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
  await meta.sendText(phone, textFor(lang(next), 'complete'));
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
    await meta.sendText(phone, textFor(lang(worker), 'clearer'));
    await meta.sendText(config.reviewerPhone, `Requested clearer Aadhaar from +${phone}.`);
  } else {
    await meta.sendText(phone, textFor(lang(worker), 'rejected'));
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
