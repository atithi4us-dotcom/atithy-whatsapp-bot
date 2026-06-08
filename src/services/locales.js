const ENGLISH = 'en-IN';
const HINDI = 'hi-IN';
const TAMIL = 'ta-IN';
const BENGALI = 'bn-IN';
const ODIA = 'or-IN';
const ASSAMESE = 'as-IN';

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

const SUPPORTED_LANGUAGES = [
  { locale: HINDI, id: 'language_hi_in', title: 'हिंदी', subtitle: 'Hindi' },
  { locale: TAMIL, id: 'language_ta_in', title: 'தமிழ்', subtitle: 'Tamil' },
  { locale: BENGALI, id: 'language_bn_in', title: 'বাংলা', subtitle: 'Bengali' },
  { locale: ODIA, id: 'language_or_in', title: 'ଓଡ଼ିଆ', subtitle: 'Odia' },
  { locale: ASSAMESE, id: 'language_as_in', title: 'অসমীয়া', subtitle: 'Assamese' },
  { locale: ENGLISH, id: 'language_en_in', title: 'English', subtitle: 'अंग्रेजी' }
];

const LANGUAGE_ALIASES = {
  [ENGLISH]: ['en', 'en-in', 'english'],
  [HINDI]: ['hi-in', 'hindi', 'हिंदी', 'हिन्दी'],
  [TAMIL]: ['ta', 'ta-in', 'tamil', 'தமிழ்'],
  [BENGALI]: ['bn', 'bn-in', 'bengali', 'bangla', 'বাংলা'],
  [ODIA]: ['or', 'or-in', 'od', 'odia', 'oriya', 'ଓଡ଼ିଆ', 'ଓଡିଆ'],
  [ASSAMESE]: ['as', 'as-in', 'assamese', 'অসমীয়া', 'অসমীয়া']
};

const DISTRICT_LABELS = {
  [ENGLISH]: {},
  [HINDI]: {
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
  },
  [TAMIL]: {
    Thiruvananthapuram: 'திருவனந்தபுரம்',
    Kollam: 'கொல்லம்',
    Pathanamthitta: 'பத்தனம்திட்டா',
    Alappuzha: 'ஆலப்புழா',
    Kottayam: 'கோட்டயம்',
    Idukki: 'இடுக்கி',
    Ernakulam: 'எറണாகுளம்',
    Thrissur: 'திருச்சூர்',
    Palakkad: 'பாலக்காடு',
    Malappuram: 'மலப்பുറം',
    Kozhikode: 'கோழிக்கோடு',
    Wayanad: 'வயநாடு',
    Kannur: 'கண்ணூர்',
    Kasaragod: 'காசர்கோடு'
  },
  [BENGALI]: {
    Thiruvananthapuram: 'তিরুবনন্তপুরম',
    Kollam: 'কোল্লাম',
    Pathanamthitta: 'পাথানামথিট্টা',
    Alappuzha: 'আলাপ্পুঝা',
    Kottayam: 'কোট্টায়াম',
    Idukki: 'ইডুক্কি',
    Ernakulam: 'এর্নাকুলাম',
    Thrissur: 'ত্রিশূর',
    Palakkad: 'পালাক্কাড',
    Malappuram: 'মালাপ্পুরম',
    Kozhikode: 'কোঝিকোড়',
    Wayanad: 'ওয়ায়ানাড',
    Kannur: 'কান্নুর',
    Kasaragod: 'কাসারগোড'
  },
  [ODIA]: {
    Thiruvananthapuram: 'ତିରୁଵନନ୍ତପୁରମ',
    Kollam: 'କୋଲ୍ଲମ',
    Pathanamthitta: 'ପଥାନମଥିଟ୍ଟା',
    Alappuzha: 'ଆଲାପ୍ପୁଝା',
    Kottayam: 'କୋଟ୍ଟାୟମ',
    Idukki: 'ଇଡୁକ୍କି',
    Ernakulam: 'ଏର୍ଣ୍ଣାକୁଲମ',
    Thrissur: 'ତ୍ରିଶୂର',
    Palakkad: 'ପାଲକ୍କାଡ',
    Malappuram: 'ମଲପ୍ପୁରମ',
    Kozhikode: 'କୋଝିକୋଡ',
    Wayanad: 'ୱାୟନାଡ',
    Kannur: 'କନ୍ନୁର',
    Kasaragod: 'କାସରଗୋଡ'
  },
  [ASSAMESE]: {
    Thiruvananthapuram: 'তিৰুৱনন্তপুৰম',
    Kollam: 'কোল্লাম',
    Pathanamthitta: 'পথানামথিট্টা',
    Alappuzha: 'আলাপ্পুঝা',
    Kottayam: 'কোট্টায়াম',
    Idukki: 'ইডুক্কি',
    Ernakulam: 'এৰ্ণাকুলাম',
    Thrissur: 'থ্ৰিছূৰ',
    Palakkad: 'পালাক্কাড',
    Malappuram: 'মালাপ্পুৰম',
    Kozhikode: 'কোঝিকোড',
    Wayanad: 'ৱায়ানাড',
    Kannur: 'কান্নুৰ',
    Kasaragod: 'কাসাৰগোড'
  }
};

const TEXT = {
  [ENGLISH]: {
    languagePrompt: 'Please choose your language.',
    languageButton: 'Language',
    languageSection: 'Available languages',
    intro: [
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
    ].join('\n'),
    interested: 'Are you interested to join Atithy as a worker?',
    yes: 'Yes, continue',
    no: 'Not now',
    notNow: 'Okay. You can message us again later if you want to join Atithy.',
    chooseOption: 'Please choose an option below.',
    name: 'Please send your full name.',
    gender: 'Please select your gender.',
    male: 'Male',
    female: 'Female',
    districtIntro: 'Please select your current district in Kerala.',
    districtList1: 'Kerala districts - list 1',
    districtList2: 'Kerala districts - list 2',
    districtButton: 'Choose district',
    districtSection1: 'Districts 1-7',
    districtSection2: 'Districts 8-14',
    aadhaarConsent: [
      'Aadhaar verification consent',
      '',
      'By selecting I agree, you allow Atithy to collect and store your Aadhaar card only for worker identity verification and onboarding approval.'
    ].join('\n'),
    consentYes: 'I agree',
    consentNo: 'I do not agree',
    aadhaarUpload: 'Please upload your Aadhaar card as a clear image or PDF.',
    aadhaarFrontUpload: 'Please upload the front side of your Aadhaar card as a clear image or PDF.',
    aadhaarBackUpload: 'Now please upload the back side of your Aadhaar card as a clear image or PDF.',
    aadhaarRequired: 'Aadhaar consent is required to complete worker onboarding.',
    aadhaarReceived: 'Thank you. Your Aadhaar has been received and is now under verification.',
    aadhaarBothReceived: 'Thank you. Your Aadhaar front and back have been received and are now under verification.',
    aadhaarPending: 'Your Aadhaar is still under verification. We will update you soon.',
    approvedAlready: 'Your Atithy worker onboarding is already complete. You are active for Atithy jobs.',
    complete: 'Your Atithy worker onboarding is complete. Your profile is now active. You will receive available job details through Atithy.',
    appVideoCaption: 'Watch this video to learn how to accept jobs in the Atithy app.',
    appInstallPrompt: 'Please download and install the Atithy app to receive and accept jobs.',
    appInstallQuestion: 'Have you installed the Atithy app?',
    installedYes: 'Installed',
    installedNo: 'Not yet',
    appInstallReminder: 'Please install the Atithy app using the link above. After installing, reply Installed.',
    appReady: 'Great. You are ready to receive and accept jobs through Atithy.',
    appInstallChooseOption: 'Please choose Installed after you install the Atithy app, or Not yet if you need the link again.',
    clearer: 'Please upload a clearer Aadhaar image or PDF. Make sure all details are readable.',
    clearerFront: 'Please upload a clearer front side of your Aadhaar card. Make sure all details are readable.',
    clearerBack: 'Please upload a clearer back side of your Aadhaar card. Make sure all details are readable.',
    clearerBoth: 'Please upload clearer front and back sides of your Aadhaar card. Make sure all details are readable.',
    rejected: 'Your Aadhaar could not be verified. Please upload a valid Aadhaar card again.'
  },
  [HINDI]: {
    languagePrompt: 'कृपया अपनी भाषा चुनें।',
    languageButton: 'भाषा',
    languageSection: 'उपलब्ध भाषाएँ',
    intro: [
      'Atithy में आपका स्वागत है।',
      '',
      'Atithy केरल में श्रमिकों को रोज़ काम के अवसर भेजता है।',
      '',
      'आपको सहायक का काम, सामान चढ़ाना-उतारना, पैकिंग-छँटाई, घर शिफ्टिंग, होटल/रेस्टोरेंट सहायक, दुकान/सुपरमार्केट सहायक, फैक्ट्री सहायक, सफाई, खेत का काम और कार्यक्रम की तैयारी जैसे काम मिल सकते हैं।',
      '',
      'हर काम के लिए आपको तारीख, समय, काम की जानकारी, कार्यस्थल/ग्राहक का संपर्क नंबर और स्थान की जानकारी मिलेगी।',
      '',
      'काम पूरा करने के बाद भुगतान ग्राहक से लिया जा सकता है।',
      '',
      'आप लगभग ₹1000 से ₹1200 प्रति दिन कमा सकते हैं।'
    ].join('\n'),
    interested: 'क्या आप Atithy में श्रमिक के रूप में जुड़ना चाहते हैं?',
    yes: 'हाँ',
    no: 'अभी नहीं',
    notNow: 'ठीक है। Atithy से जुड़ना हो तो बाद में फिर संदेश भेजें।',
    chooseOption: 'कृपया नीचे दिया गया विकल्प चुनें।',
    name: 'कृपया अपना पूरा नाम भेजें।',
    gender: 'कृपया अपना लिंग चुनें।',
    male: 'पुरुष',
    female: 'महिला',
    districtIntro: 'कृपया केरल में अपना वर्तमान जिला चुनें।',
    districtList1: 'केरल जिले - सूची 1',
    districtList2: 'केरल जिले - सूची 2',
    districtButton: 'जिला चुनें',
    districtSection1: 'जिले 1-7',
    districtSection2: 'जिले 8-14',
    aadhaarConsent: [
      'Aadhaar सत्यापन की सहमति',
      '',
      'सहमति देने पर आप Atithy को श्रमिक पहचान सत्यापन और पंजीकरण स्वीकृति के लिए आपका Aadhaar कार्ड लेने और सुरक्षित रखने की अनुमति देते हैं।'
    ].join('\n'),
    consentYes: 'मैं सहमत हूँ',
    consentNo: 'सहमत नहीं',
    aadhaarUpload: 'कृपया अपना Aadhaar कार्ड साफ़ तस्वीर या PDF के रूप में भेजें।',
    aadhaarFrontUpload: 'कृपया अपने Aadhaar कार्ड के सामने वाले हिस्से की साफ़ तस्वीर या PDF भेजें।',
    aadhaarBackUpload: 'अब कृपया अपने Aadhaar कार्ड के पीछे वाले हिस्से की साफ़ तस्वीर या PDF भेजें।',
    aadhaarRequired: 'श्रमिक पंजीकरण पूरा करने के लिए Aadhaar सहमति ज़रूरी है।',
    aadhaarReceived: 'धन्यवाद। आपका Aadhaar मिल गया है और सत्यापन के लिए भेज दिया गया है।',
    aadhaarBothReceived: 'धन्यवाद। आपके Aadhaar के सामने और पीछे दोनों हिस्से मिल गए हैं और सत्यापन के लिए भेज दिए गए हैं।',
    aadhaarPending: 'आपका Aadhaar अभी सत्यापन में है। हम जल्द जानकारी देंगे।',
    approvedAlready: 'आपका Atithy श्रमिक पंजीकरण पहले से पूरा है। आप Atithy के कामों के लिए सक्रिय हैं।',
    complete: 'आपका Atithy श्रमिक पंजीकरण पूरा हो गया है। आपकी प्रोफ़ाइल अब सक्रिय है। उपलब्ध काम की जानकारी आपको Atithy के माध्यम से मिलेगी।',
    appVideoCaption: 'Atithy ऐप में काम स्वीकार करना सीखने के लिए यह वीडियो देखें।',
    appInstallPrompt: 'काम पाने और स्वीकार करने के लिए कृपया Atithy ऐप डाउनलोड और इंस्टॉल करें।',
    appInstallQuestion: 'क्या आपने Atithy ऐप इंस्टॉल कर लिया है?',
    installedYes: 'इंस्टॉल हो गया',
    installedNo: 'अभी नहीं',
    appInstallReminder: 'कृपया ऊपर दिए गए लिंक से Atithy ऐप इंस्टॉल करें। इंस्टॉल करने के बाद इंस्टॉल हो गया चुनें।',
    appReady: 'बहुत अच्छा। अब आप Atithy के माध्यम से काम पाने और स्वीकार करने के लिए तैयार हैं।',
    appInstallChooseOption: 'Atithy ऐप इंस्टॉल करने के बाद इंस्टॉल हो गया चुनें, या लिंक फिर चाहिए तो अभी नहीं चुनें।',
    clearer: 'कृपया Aadhaar की और साफ़ तस्वीर या PDF भेजें। सभी जानकारी पढ़ने योग्य होनी चाहिए।',
    clearerFront: 'कृपया Aadhaar के सामने वाले हिस्से की और साफ़ तस्वीर भेजें। सभी जानकारी पढ़ने योग्य होनी चाहिए।',
    clearerBack: 'कृपया Aadhaar के पीछे वाले हिस्से की और साफ़ तस्वीर भेजें। सभी जानकारी पढ़ने योग्य होनी चाहिए।',
    clearerBoth: 'कृपया Aadhaar के सामने और पीछे दोनों हिस्सों की साफ़ तस्वीरें भेजें। सभी जानकारी पढ़ने योग्य होनी चाहिए।',
    rejected: 'आपका Aadhaar सत्यापित नहीं हो पाया। कृपया मान्य Aadhaar कार्ड फिर से भेजें।'
  },
  [TAMIL]: {
    languagePrompt: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்.',
    languageButton: 'மொழி',
    languageSection: 'கிடைக்கும் மொழிகள்',
    intro: [
      'Atithy-க்கு வரவேற்கிறோம்.',
      '',
      'Atithy, கேரளாவில் தொழிலாளர்களுக்கு தினசரி வேலை வாய்ப்புகளை அனுப்புகிறது.',
      '',
      'உதவியாளர் வேலை, பொருட்கள் ஏற்றுதல்/இறக்குதல், பொருட்கள் அடுக்குதல்/வரிசைப்படுத்துதல், வீடு மாற்றுதல், ஹோட்டல்/உணவக உதவியாளர், கடை/சூப்பர் மார்க்கெட் உதவியாளர், தொழிற்சாலை உதவியாளர், சுத்தம் செய்தல், விவசாய வேலை மற்றும் நிகழ்ச்சி அமைத்தல் போன்ற வேலைகள் கிடைக்கலாம்.',
      '',
      'ஒவ்வொரு வேலைக்கும் தேதி, நேரம், வேலை விவரம், வேலை இடம்/வாடிக்கையாளர் தொடர்பு எண் மற்றும் இட விவரம் கிடைக்கும்.',
      '',
      'வேலை முடிந்த பிறகு பணத்தை வாடிக்கையாளரிடமிருந்து பெறலாம்.',
      '',
      'நீங்கள் ஒரு நாளுக்கு சுமார் ₹1000 முதல் ₹1200 வரை சம்பாதிக்கலாம்.'
    ].join('\n'),
    interested: 'Atithy-யில் தொழிலாளராக சேர விருப்பமா?',
    yes: 'ஆம்',
    no: 'இப்போது வேண்டாம்',
    notNow: 'சரி. Atithy-யில் சேர விரும்பினால் பிறகு மீண்டும் செய்தி அனுப்பலாம்.',
    chooseOption: 'கீழே உள்ள விருப்பத்தைத் தேர்ந்தெடுக்கவும்.',
    name: 'உங்கள் முழு பெயரை அனுப்பவும்.',
    gender: 'உங்கள் பாலினத்தைத் தேர்ந்தெடுக்கவும்.',
    male: 'ஆண்',
    female: 'பெண்',
    districtIntro: 'கேரளாவில் உங்கள் தற்போதைய மாவட்டத்தைத் தேர்ந்தெடுக்கவும்.',
    districtList1: 'கேரளா மாவட்டங்கள் - பட்டியல் 1',
    districtList2: 'கேரளா மாவட்டங்கள் - பட்டியல் 2',
    districtButton: 'மாவட்டம்',
    districtSection1: 'மாவட்டங்கள் 1-7',
    districtSection2: 'மாவட்டங்கள் 8-14',
    aadhaarConsent: [
      'Aadhaar சரிபார்ப்புக்கான ஒப்புதல்',
      '',
      'ஒப்புக்கொள்வதைத் தேர்ந்தெடுத்தால், தொழிலாளர் அடையாளச் சரிபார்ப்பு மற்றும் பதிவு ஒப்புதலுக்காக Atithy உங்கள் Aadhaar அட்டையைப் பெற்று பாதுகாப்பாக வைத்திருக்க அனுமதிக்கிறீர்கள்.'
    ].join('\n'),
    consentYes: 'ஒப்புக்கொள்கிறேன்',
    consentNo: 'ஒப்புக்கொள்ளவில்லை',
    aadhaarUpload: 'உங்கள் Aadhaar அட்டையை தெளிவான படம் அல்லது PDF ஆக அனுப்பவும்.',
    aadhaarFrontUpload: 'உங்கள் Aadhaar அட்டையின் முன்பக்கத்தை தெளிவான படம் அல்லது PDF ஆக அனுப்பவும்.',
    aadhaarBackUpload: 'இப்போது உங்கள் Aadhaar அட்டையின் பின்பக்கத்தை தெளிவான படம் அல்லது PDF ஆக அனுப்பவும்.',
    aadhaarRequired: 'தொழிலாளர் பதிவை முடிக்க Aadhaar ஒப்புதல் அவசியம்.',
    aadhaarReceived: 'நன்றி. உங்கள் Aadhaar பெறப்பட்டது, சரிபார்ப்புக்கு அனுப்பப்பட்டுள்ளது.',
    aadhaarBothReceived: 'நன்றி. உங்கள் Aadhaar அட்டையின் முன்பக்கமும் பின்பக்கமும் பெறப்பட்டு சரிபார்ப்புக்கு அனுப்பப்பட்டுள்ளது.',
    aadhaarPending: 'உங்கள் Aadhaar இன்னும் சரிபார்ப்பில் உள்ளது. விரைவில் தகவல் தருகிறோம்.',
    approvedAlready: 'உங்கள் Atithy தொழிலாளர் பதிவு ஏற்கனவே முடிந்துள்ளது. நீங்கள் Atithy வேலைகளுக்கு செயலில் உள்ளீர்கள்.',
    complete: 'உங்கள் Atithy தொழிலாளர் பதிவு முடிந்தது. உங்கள் சுயவிவரம் இப்போது செயலில் உள்ளது. கிடைக்கும் வேலை விவரங்கள் Atithy மூலம் அனுப்பப்படும்.',
    appVideoCaption: 'Atithy செயலியில் வேலை ஏற்குவது எப்படி என்பதை அறிய இந்த வீடியோவைப் பாருங்கள்.',
    appInstallPrompt: 'வேலைகளைப் பெறவும் ஏற்கவும் Atithy செயலியை பதிவிறக்கம் செய்து நிறுவவும்.',
    appInstallQuestion: 'Atithy செயலியை நிறுவிவிட்டீர்களா?',
    installedYes: 'நிறுவிவிட்டேன்',
    installedNo: 'இல்லை',
    appInstallReminder: 'மேலுள்ள இணைப்பைப் பயன்படுத்தி Atithy செயலியை நிறுவவும். நிறுவிய பிறகு நிறுவிவிட்டேன் என்பதைத் தேர்ந்தெடுக்கவும்.',
    appReady: 'சிறப்பு. Atithy மூலம் வேலைகளைப் பெறவும் ஏற்கவும் நீங்கள் தயாராக உள்ளீர்கள்.',
    appInstallChooseOption: 'Atithy செயலியை நிறுவிய பிறகு நிறுவிவிட்டேன் என்பதைத் தேர்ந்தெடுக்கவும், அல்லது இணைப்பு மீண்டும் வேண்டுமெனில் இல்லை என்பதைத் தேர்ந்தெடுக்கவும்.',
    clearer: 'Aadhaar-ன் இன்னும் தெளிவான படம் அல்லது PDF அனுப்பவும். எல்லா விவரங்களும் படிக்கக்கூடியதாக இருக்க வேண்டும்.',
    clearerFront: 'Aadhaar அட்டையின் முன்பக்கத்தை இன்னும் தெளிவாக அனுப்பவும். எல்லா விவரங்களும் படிக்கக்கூடியதாக இருக்க வேண்டும்.',
    clearerBack: 'Aadhaar அட்டையின் பின்பக்கத்தை இன்னும் தெளிவாக அனுப்பவும். எல்லா விவரங்களும் படிக்கக்கூடியதாக இருக்க வேண்டும்.',
    clearerBoth: 'Aadhaar அட்டையின் முன்பக்கமும் பின்பக்கமும் இன்னும் தெளிவாக அனுப்பவும். எல்லா விவரங்களும் படிக்கக்கூடியதாக இருக்க வேண்டும்.',
    rejected: 'உங்கள் Aadhaar சரிபார்க்கப்படவில்லை. செல்லுபடியாகும் Aadhaar அட்டையை மீண்டும் அனுப்பவும்.'
  },
  [BENGALI]: {
    languagePrompt: 'অনুগ্রহ করে আপনার ভাষা বেছে নিন।',
    languageButton: 'ভাষা',
    languageSection: 'উপলব্ধ ভাষা',
    intro: [
      'Atithy-তে আপনাকে স্বাগতম।',
      '',
      'Atithy কেরালায় শ্রমিকদের প্রতিদিনের কাজের সুযোগ পাঠায়।',
      '',
      'আপনি সহায়কের কাজ, মাল ওঠানো-নামানো, প্যাকিং-ছাঁটাই, বাড়ি বদলানোর কাজ, হোটেল/রেস্তোরাঁ সহায়ক, দোকান/সুপারমার্কেট সহায়ক, কারখানা সহায়ক, পরিষ্কার-পরিচ্ছন্নতা, কৃষিকাজ এবং অনুষ্ঠান সেটআপের মতো কাজ পেতে পারেন।',
      '',
      'প্রতিটি কাজের জন্য আপনি তারিখ, সময়, কাজের বিবরণ, কাজের জায়গা/গ্রাহকের যোগাযোগ নম্বর এবং অবস্থানের তথ্য পাবেন।',
      '',
      'কাজ শেষ করার পরে গ্রাহকের কাছ থেকে পেমেন্ট নেওয়া যাবে।',
      '',
      'আপনি দিনে প্রায় ₹1000 থেকে ₹1200 পর্যন্ত উপার্জন করতে পারেন।'
    ].join('\n'),
    interested: 'আপনি কি Atithy-তে শ্রমিক হিসেবে যোগ দিতে চান?',
    yes: 'হ্যাঁ',
    no: 'এখন নয়',
    notNow: 'ঠিক আছে। Atithy-তে যোগ দিতে চাইলে পরে আবার বার্তা পাঠাতে পারেন।',
    chooseOption: 'অনুগ্রহ করে নিচের বিকল্পটি বেছে নিন।',
    name: 'অনুগ্রহ করে আপনার পুরো নাম পাঠান।',
    gender: 'অনুগ্রহ করে আপনার লিঙ্গ নির্বাচন করুন।',
    male: 'পুরুষ',
    female: 'মহিলা',
    districtIntro: 'কেরালায় আপনার বর্তমান জেলা নির্বাচন করুন।',
    districtList1: 'কেরালার জেলা - তালিকা 1',
    districtList2: 'কেরালার জেলা - তালিকা 2',
    districtButton: 'জেলা বেছে নিন',
    districtSection1: 'জেলা 1-7',
    districtSection2: 'জেলা 8-14',
    aadhaarConsent: [
      'Aadhaar যাচাইয়ের সম্মতি',
      '',
      'সম্মতি দিলে, শ্রমিক পরিচয় যাচাই এবং নিবন্ধন অনুমোদনের জন্য Atithy আপনার Aadhaar কার্ড সংগ্রহ ও নিরাপদে সংরক্ষণ করতে পারবে।'
    ].join('\n'),
    consentYes: 'আমি রাজি',
    consentNo: 'আমি রাজি নই',
    aadhaarUpload: 'আপনার Aadhaar কার্ড পরিষ্কার ছবি বা PDF হিসেবে পাঠান।',
    aadhaarFrontUpload: 'আপনার Aadhaar কার্ডের সামনের দিক পরিষ্কার ছবি বা PDF হিসেবে পাঠান।',
    aadhaarBackUpload: 'এখন আপনার Aadhaar কার্ডের পিছনের দিক পরিষ্কার ছবি বা PDF হিসেবে পাঠান।',
    aadhaarRequired: 'শ্রমিক নিবন্ধন সম্পূর্ণ করতে Aadhaar সম্মতি প্রয়োজন।',
    aadhaarReceived: 'ধন্যবাদ। আপনার Aadhaar পাওয়া গেছে এবং যাচাইয়ের জন্য পাঠানো হয়েছে।',
    aadhaarBothReceived: 'ধন্যবাদ। আপনার Aadhaar কার্ডের সামনের ও পিছনের দিক পাওয়া গেছে এবং যাচাইয়ের জন্য পাঠানো হয়েছে।',
    aadhaarPending: 'আপনার Aadhaar এখনও যাচাইয়ের মধ্যে আছে। আমরা শীঘ্রই জানাব।',
    approvedAlready: 'আপনার Atithy শ্রমিক নিবন্ধন ইতিমধ্যে সম্পূর্ণ হয়েছে। আপনি Atithy কাজের জন্য সক্রিয় আছেন।',
    complete: 'আপনার Atithy শ্রমিক নিবন্ধন সম্পূর্ণ হয়েছে। আপনার প্রোফাইল এখন সক্রিয়। উপলব্ধ কাজের বিবরণ Atithy-এর মাধ্যমে পাবেন।',
    appVideoCaption: 'Atithy অ্যাপে কীভাবে কাজ গ্রহণ করবেন তা জানতে এই ভিডিওটি দেখুন।',
    appInstallPrompt: 'কাজ পেতে এবং গ্রহণ করতে অনুগ্রহ করে Atithy অ্যাপ ডাউনলোড ও ইনস্টল করুন।',
    appInstallQuestion: 'আপনি কি Atithy অ্যাপ ইনস্টল করেছেন?',
    installedYes: 'ইনস্টল করেছি',
    installedNo: 'এখনও না',
    appInstallReminder: 'উপরের লিঙ্ক ব্যবহার করে Atithy অ্যাপ ইনস্টল করুন। ইনস্টল করার পরে ইনস্টল করেছি বেছে নিন।',
    appReady: 'ভালো। আপনি এখন Atithy-এর মাধ্যমে কাজ পেতে এবং গ্রহণ করতে প্রস্তুত।',
    appInstallChooseOption: 'Atithy অ্যাপ ইনস্টল করার পরে ইনস্টল করেছি বেছে নিন, অথবা লিঙ্ক আবার চাইলে এখনও না বেছে নিন।',
    clearer: 'Aadhaar-এর আরও পরিষ্কার ছবি বা PDF পাঠান। সব তথ্য পড়া যায় এমন হতে হবে।',
    clearerFront: 'Aadhaar কার্ডের সামনের দিক আরও পরিষ্কার করে পাঠান। সব তথ্য পড়া যায় এমন হতে হবে।',
    clearerBack: 'Aadhaar কার্ডের পিছনের দিক আরও পরিষ্কার করে পাঠান। সব তথ্য পড়া যায় এমন হতে হবে।',
    clearerBoth: 'Aadhaar কার্ডের সামনের ও পিছনের দিক আরও পরিষ্কার করে পাঠান। সব তথ্য পড়া যায় এমন হতে হবে।',
    rejected: 'আপনার Aadhaar যাচাই করা যায়নি। অনুগ্রহ করে বৈধ Aadhaar কার্ড আবার পাঠান।'
  },
  [ODIA]: {
    languagePrompt: 'ଦୟାକରି ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ।',
    languageButton: 'ଭାଷା',
    languageSection: 'ଉପଲବ୍ଧ ଭାଷା',
    intro: [
      'Atithy କୁ ସ୍ୱାଗତ।',
      '',
      'Atithy କେରଳରେ ଶ୍ରମିକମାନଙ୍କୁ ପ୍ରତିଦିନ କାମର ସୁଯୋଗ ପଠାଏ।',
      '',
      'ଆପଣ ସହାୟକ କାମ, ଜିନିଷ ଚଢ଼ାଇବା/ଓହ୍ଲାଇବା, ପ୍ୟାକିଂ/ଛାଟାଇ, ଘର ସ୍ଥାନାନ୍ତର, ହୋଟେଲ/ରେଷ୍ଟୁରାଣ୍ଟ ସହାୟକ, ଦୋକାନ/ସୁପରମାର୍କେଟ ସହାୟକ, କାରଖାନା ସହାୟକ, ସଫାସୁଥା, ଚାଷ କାମ ଏବଂ କାର୍ଯ୍ୟକ୍ରମ ସଜାଣି ପରି କାମ ପାଇପାରିବେ।',
      '',
      'ପ୍ରତ୍ୟେକ କାମ ପାଇଁ ତାରିଖ, ସମୟ, କାମର ବିବରଣୀ, କାମ ସ୍ଥାନ/ଗ୍ରାହକ ସଂପର୍କ ନମ୍ବର ଏବଂ ସ୍ଥାନ ସୂଚନା ମିଳିବ।',
      '',
      'କାମ ସରିଲେ ଗ୍ରାହକଙ୍କଠାରୁ ପେମେଣ୍ଟ ନେଇପାରିବେ।',
      '',
      'ଆପଣ ଦିନକୁ ପ୍ରାୟ ₹1000 ରୁ ₹1200 ପର୍ଯ୍ୟନ୍ତ ଆୟ କରିପାରିବେ।'
    ].join('\n'),
    interested: 'ଆପଣ Atithy ରେ ଶ୍ରମିକ ଭାବରେ ଯୋଗ ଦେବାକୁ ଇଚ୍ଛୁକ କି?',
    yes: 'ହଁ',
    no: 'ଏବେ ନୁହେଁ',
    notNow: 'ଠିକ୍ ଅଛି। Atithy ରେ ଯୋଗ ଦେବାକୁ ଚାହିଁଲେ ପରେ ପୁଣି ସନ୍ଦେଶ ପଠାନ୍ତୁ।',
    chooseOption: 'ଦୟାକରି ତଳର ବିକଳ୍ପ ବାଛନ୍ତୁ।',
    name: 'ଦୟାକରି ଆପଣଙ୍କ ପୂର୍ଣ୍ଣ ନାମ ପଠାନ୍ତୁ।',
    gender: 'ଦୟାକରି ଆପଣଙ୍କ ଲିଙ୍ଗ ବାଛନ୍ତୁ।',
    male: 'ପୁରୁଷ',
    female: 'ମହିଳା',
    districtIntro: 'କେରଳରେ ଆପଣଙ୍କ ବର୍ତ୍ତମାନ ଜିଲ୍ଲା ବାଛନ୍ତୁ।',
    districtList1: 'କେରଳ ଜିଲ୍ଲା - ତାଲିକା 1',
    districtList2: 'କେରଳ ଜିଲ୍ଲା - ତାଲିକା 2',
    districtButton: 'ଜିଲ୍ଲା ବାଛନ୍ତୁ',
    districtSection1: 'ଜିଲ୍ଲା 1-7',
    districtSection2: 'ଜିଲ୍ଲା 8-14',
    aadhaarConsent: [
      'Aadhaar ଯାଞ୍ଚ ପାଇଁ ସହମତି',
      '',
      'ସହମତି ଦେଲେ, ଶ୍ରମିକ ପରିଚୟ ଯାଞ୍ଚ ଏବଂ ପଞ୍ଜିକରଣ ଅନୁମୋଦନ ପାଇଁ Atithy ଆପଣଙ୍କ Aadhaar କାର୍ଡ ସଂଗ୍ରହ କରି ସୁରକ୍ଷିତ ରଖିପାରିବ।'
    ].join('\n'),
    consentYes: 'ମୁଁ ସହମତ',
    consentNo: 'ସହମତ ନୁହେଁ',
    aadhaarUpload: 'ଦୟାକରି ଆପଣଙ୍କ Aadhaar କାର୍ଡ ସ୍ପଷ୍ଟ ଛବି କିମ୍ବା PDF ଭାବେ ପଠାନ୍ତୁ।',
    aadhaarFrontUpload: 'ଦୟାକରି ଆପଣଙ୍କ Aadhaar କାର୍ଡର ସାମ୍ନା ପାଟି ସ୍ପଷ୍ଟ ଛବି କିମ୍ବା PDF ଭାବେ ପଠାନ୍ତୁ।',
    aadhaarBackUpload: 'ଏବେ ଦୟାକରି ଆପଣଙ୍କ Aadhaar କାର୍ଡର ପଛ ପାଟି ସ୍ପଷ୍ଟ ଛବି କିମ୍ବା PDF ଭାବେ ପଠାନ୍ତୁ।',
    aadhaarRequired: 'ଶ୍ରମିକ ପଞ୍ଜିକରଣ ସମ୍ପୂର୍ଣ୍ଣ କରିବାକୁ Aadhaar ସହମତି ଆବଶ୍ୟକ।',
    aadhaarReceived: 'ଧନ୍ୟବାଦ। ଆପଣଙ୍କ Aadhaar ମିଳିଛି ଏବଂ ଯାଞ୍ଚ ପାଇଁ ପଠାଯାଇଛି।',
    aadhaarBothReceived: 'ଧନ୍ୟବାଦ। ଆପଣଙ୍କ Aadhaar କାର୍ଡର ସାମ୍ନା ଓ ପଛ ଦୁଇ ପାଟି ମିଳିଛି ଏବଂ ଯାଞ୍ଚ ପାଇଁ ପଠାଯାଇଛି।',
    aadhaarPending: 'ଆପଣଙ୍କ Aadhaar ଏଖଣି ଯାଞ୍ଚରେ ଅଛି। ଆମେ ଶୀଘ୍ର ସୂଚନା ଦେବୁ।',
    approvedAlready: 'ଆପଣଙ୍କ Atithy ଶ୍ରମିକ ପଞ୍ଜିକରଣ ପୂର୍ବରୁ ସମ୍ପୂର୍ଣ୍ଣ। ଆପଣ Atithy କାମ ପାଇଁ ସକ୍ରିୟ ଅଛନ୍ତି।',
    complete: 'ଆପଣଙ୍କ Atithy ଶ୍ରମିକ ପଞ୍ଜିକରଣ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି। ଆପଣଙ୍କ ପ୍ରୋଫାଇଲ୍ ଏବେ ସକ୍ରିୟ। ଉପଲବ୍ଧ କାମର ବିବରଣୀ Atithy ମାଧ୍ୟମରେ ମିଳିବ।',
    appVideoCaption: 'Atithy ଆପ୍‌ରେ କାମ କିପରି ଗ୍ରହଣ କରିବେ ଜାଣିବାକୁ ଏହି ଭିଡିଓ ଦେଖନ୍ତୁ।',
    appInstallPrompt: 'କାମ ପାଇବା ଏବଂ ଗ୍ରହଣ କରିବା ପାଇଁ ଦୟାକରି Atithy ଆପ୍ ଡାଉନଲୋଡ୍ ଏବଂ ଇନ୍ଷ୍ଟଲ୍ କରନ୍ତୁ।',
    appInstallQuestion: 'ଆପଣ Atithy ଆପ୍ ଇନ୍ଷ୍ଟଲ୍ କରିଛନ୍ତି କି?',
    installedYes: 'ଇନ୍ଷ୍ଟଲ୍ ହୋଇଛି',
    installedNo: 'ଏଖଣି ନୁହେଁ',
    appInstallReminder: 'ଦୟାକରି ଉପର ଲିଙ୍କ୍‌ରୁ Atithy ଆପ୍ ଇନ୍ଷ୍ଟଲ୍ କରନ୍ତୁ। ଇନ୍ଷ୍ଟଲ୍ ପରେ ଇନ୍ଷ୍ଟଲ୍ ହୋଇଛି ବାଛନ୍ତୁ।',
    appReady: 'ଭଲ। ଆପଣ Atithy ମାଧ୍ୟମରେ କାମ ପାଇବା ଏବଂ ଗ୍ରହଣ କରିବାକୁ ପ୍ରସ୍ତୁତ।',
    appInstallChooseOption: 'Atithy ଆପ୍ ଇନ୍ଷ୍ଟଲ୍ କରିବା ପରେ ଇନ୍ଷ୍ଟଲ୍ ହୋଇଛି ବାଛନ୍ତୁ, କିମ୍ବା ଲିଙ୍କ୍ ପୁଣି ଦରକାର ହେଲେ ଏଖଣି ନୁହେଁ ବାଛନ୍ତୁ।',
    clearer: 'ଦୟାକରି Aadhaar ର ଆଉ ସ୍ପଷ୍ଟ ଛବି କିମ୍ବା PDF ପଠାନ୍ତୁ। ସମସ୍ତ ସୂଚନା ପଢ଼ିହେବା ଯୋଗ୍ୟ ହେବା ଦରକାର।',
    clearerFront: 'ଦୟାକରି Aadhaar କାର୍ଡର ସାମ୍ନା ପାଟି ଆଉ ସ୍ପଷ୍ଟ ଭାବେ ପଠାନ୍ତୁ। ସମସ୍ତ ସୂଚନା ପଢ଼ିହେବା ଯୋଗ୍ୟ ହେବା ଦରକାର।',
    clearerBack: 'ଦୟାକରି Aadhaar କାର୍ଡର ପଛ ପାଟି ଆଉ ସ୍ପଷ୍ଟ ଭାବେ ପଠାନ୍ତୁ। ସମସ୍ତ ସୂଚନା ପଢ଼ିହେବା ଯୋଗ୍ୟ ହେବା ଦରକାର।',
    clearerBoth: 'ଦୟାକରି Aadhaar କାର୍ଡର ସାମ୍ନା ଓ ପଛ ଦୁଇ ପାଟି ଆଉ ସ୍ପଷ୍ଟ ଭାବେ ପଠାନ୍ତୁ। ସମସ୍ତ ସୂଚନା ପଢ଼ିହେବା ଯୋଗ୍ୟ ହେବା ଦରକାର।',
    rejected: 'ଆପଣଙ୍କ Aadhaar ଯାଞ୍ଚ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ବୈଧ Aadhaar କାର୍ଡ ପୁଣି ପଠାନ୍ତୁ।'
  },
  [ASSAMESE]: {
    languagePrompt: 'অনুগ্ৰহ কৰি আপোনাৰ ভাষা বাছনি কৰক।',
    languageButton: 'ভাষা',
    languageSection: 'উপলব্ধ ভাষা',
    intro: [
      'Atithy লৈ স্বাগতম।',
      '',
      'Atithy-এ কেৰালাত শ্ৰমিকসকললৈ দৈনিক কামৰ সুযোগ পঠায়।',
      '',
      'আপুনি সহায়ক কাম, সামগ্ৰী উঠোৱা/নমোৱা, পেকিং/বাছনি, ঘৰ সলনি কৰা, হোটেল/ৰেষ্টুৰেণ্ট সহায়ক, দোকান/সুপাৰমাৰ্কেট সহায়ক, কাৰখানা সহায়ক, চাফাই, খেতিৰ কাম আৰু অনুষ্ঠান সাজু কৰা ধৰণৰ কাম পাব পাৰে।',
      '',
      'প্ৰতিটো কামৰ বাবে তাৰিখ, সময়, কামৰ বিৱৰণ, কামৰ ঠাই/গ্ৰাহকৰ যোগাযোগ নম্বৰ আৰু স্থানৰ তথ্য পাব।',
      '',
      'কাম শেষ কৰাৰ পাছত গ্ৰাহকৰ পৰা পেমেণ্ট ল’ব পাৰিব।',
      '',
      'আপুনি দিনে প্ৰায় ₹1000 ৰ পৰা ₹1200 পৰ্যন্ত উপাৰ্জন কৰিব পাৰিব।'
    ].join('\n'),
    interested: 'আপুনি Atithy-ত শ্ৰমিক হিচাপে যোগ দিবলৈ আগ্ৰহী নে?',
    yes: 'হয়',
    no: 'এতিয়া নহয়',
    notNow: 'ঠিক আছে। Atithy-ত যোগ দিব বিচাৰিলে পাছত আকৌ বাৰ্তা পঠিয়াব পাৰে।',
    chooseOption: 'অনুগ্ৰহ কৰি তলৰ বিকল্প বাছনি কৰক।',
    name: 'অনুগ্ৰহ কৰি আপোনাৰ সম্পূৰ্ণ নাম পঠাওক।',
    gender: 'অনুগ্ৰহ কৰি আপোনাৰ লিংগ বাছনি কৰক।',
    male: 'পুৰুষ',
    female: 'মহিলা',
    districtIntro: 'কেৰালাত আপোনাৰ বৰ্তমান জিলা বাছনি কৰক।',
    districtList1: 'কেৰালা জিলা - তালিকা 1',
    districtList2: 'কেৰালা জিলা - তালিকা 2',
    districtButton: 'জিলা বাছনি',
    districtSection1: 'জিলা 1-7',
    districtSection2: 'জিলা 8-14',
    aadhaarConsent: [
      'Aadhaar পৰীক্ষাৰ সন্মতি',
      '',
      'সন্মতি দিলে, শ্ৰমিক পৰিচয় পৰীক্ষা আৰু পঞ্জীয়ন অনুমোদনৰ বাবে Atithy-এ আপোনাৰ Aadhaar কাৰ্ড সংগ্ৰহ কৰি সুৰক্ষিতভাৱে ৰাখিব পাৰিব।'
    ].join('\n'),
    consentYes: 'মই সন্মত',
    consentNo: 'সন্মত নহয়',
    aadhaarUpload: 'অনুগ্ৰহ কৰি আপোনাৰ Aadhaar কাৰ্ড স্পষ্ট ছবি বা PDF হিচাপে পঠাওক।',
    aadhaarFrontUpload: 'অনুগ্ৰহ কৰি আপোনাৰ Aadhaar কাৰ্ডৰ সন্মুখভাগ স্পষ্ট ছবি বা PDF হিচাপে পঠাওক।',
    aadhaarBackUpload: 'এতিয়া অনুগ্ৰহ কৰি আপোনাৰ Aadhaar কাৰ্ডৰ পিছভাগ স্পষ্ট ছবি বা PDF হিচাপে পঠাওক।',
    aadhaarRequired: 'শ্ৰমিক পঞ্জীয়ন সম্পূৰ্ণ কৰিবলৈ Aadhaar সন্মতি আৱশ্যক।',
    aadhaarReceived: 'ধন্যবাদ। আপোনাৰ Aadhaar পোৱা গৈছে আৰু পৰীক্ষাৰ বাবে পঠোৱা হৈছে।',
    aadhaarBothReceived: 'ধন্যবাদ। আপোনাৰ Aadhaar কাৰ্ডৰ সন্মুখ আৰু পিছ দুয়োটা ভাগ পোৱা গৈছে আৰু পৰীক্ষাৰ বাবে পঠোৱা হৈছে।',
    aadhaarPending: 'আপোনাৰ Aadhaar এতিয়াও পৰীক্ষাত আছে। আমি সোনকালে জনাম।',
    approvedAlready: 'আপোনাৰ Atithy শ্ৰমিক পঞ্জীয়ন ইতিমধ্যে সম্পূৰ্ণ। আপুনি Atithy কামৰ বাবে সক্ৰিয়।',
    complete: 'আপোনাৰ Atithy শ্ৰমিক পঞ্জীয়ন সম্পূৰ্ণ হৈছে। আপোনাৰ প্ৰোফাইল এতিয়া সক্ৰিয়। উপলব্ধ কামৰ বিৱৰণ Atithy-ৰ জৰিয়তে পাব।',
    appVideoCaption: 'Atithy এপত কাম কেনেকৈ গ্ৰহণ কৰিব লাগে জানিবলৈ এই ভিডিঅ’টো চাওক।',
    appInstallPrompt: 'কাম পাবলৈ আৰু গ্ৰহণ কৰিবলৈ অনুগ্ৰহ কৰি Atithy এপ ডাউনলোড আৰু ইনষ্টল কৰক।',
    appInstallQuestion: 'আপুনি Atithy এপ ইনষ্টল কৰিছে নে?',
    installedYes: 'ইনষ্টল হৈছে',
    installedNo: 'এতিয়া নহয়',
    appInstallReminder: 'অনুগ্ৰহ কৰি ওপৰৰ লিংক ব্যৱহাৰ কৰি Atithy এপ ইনষ্টল কৰক। ইনষ্টল কৰাৰ পাছত ইনষ্টল হৈছে বাছনি কৰক।',
    appReady: 'ভাল। আপুনি এতিয়া Atithy-ৰ জৰিয়তে কাম পাবলৈ আৰু গ্ৰহণ কৰিবলৈ সাজু।',
    appInstallChooseOption: 'Atithy এপ ইনষ্টল কৰাৰ পাছত ইনষ্টল হৈছে বাছনি কৰক, অথবা লিংক আকৌ লাগে যদি এতিয়া নহয় বাছনি কৰক।',
    clearer: 'অনুগ্ৰহ কৰি Aadhaar-ৰ আৰু স্পষ্ট ছবি বা PDF পঠাওক। সকলো তথ্য পঢ়িব পৰা হ’ব লাগিব।',
    clearerFront: 'অনুগ্ৰহ কৰি Aadhaar কাৰ্ডৰ সন্মুখভাগ আৰু স্পষ্টকৈ পঠাওক। সকলো তথ্য পঢ়িব পৰা হ’ব লাগিব।',
    clearerBack: 'অনুগ্ৰহ কৰি Aadhaar কাৰ্ডৰ পিছভাগ আৰু স্পষ্টকৈ পঠাওক। সকলো তথ্য পঢ়িব পৰা হ’ব লাগিব।',
    clearerBoth: 'অনুগ্ৰহ কৰি Aadhaar কাৰ্ডৰ সন্মুখ আৰু পিছ দুয়োটা ভাগ আৰু স্পষ্টকৈ পঠাওক। সকলো তথ্য পঢ়িব পৰা হ’ব লাগিব।',
    rejected: 'আপোনাৰ Aadhaar পৰীক্ষা কৰিব পৰা নগ’ল। অনুগ্ৰহ কৰি বৈধ Aadhaar কাৰ্ড আকৌ পঠাওক।'
  }
};

const YES_WORDS = [
  'yes',
  'continue',
  'start',
  'agree',
  'i agree',
  'हाँ',
  'हां',
  'मैं सहमत हूँ',
  'सहमत',
  'சரி',
  'ஆம்',
  'ஒப்புக்கொள்கிறேன்',
  'হ্যাঁ',
  'হ্যা',
  'আমি রাজি',
  'ରାଜି',
  'ହଁ',
  'ମୁଁ ସହମତ',
  'হয়',
  'হয়',
  'মই সন্মত',
  'সন্মত'
];
const NO_WORDS = [
  'no',
  'not now',
  'i do not agree',
  'नहीं',
  'नही',
  'अभी नहीं',
  'सहमत नहीं',
  'இல்லை',
  'இப்போது வேண்டாம்',
  'ஒப்புக்கொள்ளவில்லை',
  'না',
  'এখন নয়',
  'এখন নয়',
  'আমি রাজি নই',
  'ନା',
  'ଏବେ ନୁହେଁ',
  'ସହମତ ନୁହେଁ',
  'নহয়',
  'নহয়',
  'এতিয়া নহয়',
  'সন্মত নহয়'
];
const GENDER_MALE_WORDS = ['male', 'man', 'पुरुष', 'ஆண்', 'পুরুষ', 'ପୁରୁଷ', 'পুৰুষ'];
const GENDER_FEMALE_WORDS = ['female', 'woman', 'महिला', 'பெண்', 'মহিলা', 'ମହିଳା'];

function normalizeInput(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeLocale(locale) {
  const raw = normalizeInput(locale);
  if (raw.startsWith('hi')) return HINDI;
  if (raw.startsWith('ta')) return TAMIL;
  if (raw.startsWith('bn')) return BENGALI;
  if (raw.startsWith('or') || raw.startsWith('od')) return ODIA;
  if (raw.startsWith('as')) return ASSAMESE;
  return ENGLISH;
}

function localeForWorker(worker) {
  return normalizeLocale((worker && (worker.locale || worker.language)) || ENGLISH);
}

function localeFromLanguageSelection(replyId, text) {
  const language = SUPPORTED_LANGUAGES.find((entry) => entry.id === replyId);
  if (language) return language.locale;

  const normalized = normalizeInput(text);
  if (!normalized) return null;
  const numberedChoice = Number.parseInt(normalized, 10);
  if (
    String(numberedChoice) === normalized &&
    numberedChoice >= 1 &&
    numberedChoice <= SUPPORTED_LANGUAGES.length
  ) {
    return SUPPORTED_LANGUAGES[numberedChoice - 1].locale;
  }
  for (const [locale, aliases] of Object.entries(LANGUAGE_ALIASES)) {
    if (aliases.some((alias) => normalizeInput(alias) === normalized)) return locale;
  }
  return null;
}

function textFor(locale, key) {
  const normalized = normalizeLocale(locale);
  return (TEXT[normalized] && TEXT[normalized][key]) || TEXT[ENGLISH][key];
}

function districtLabel(district, locale) {
  const normalized = normalizeLocale(locale);
  return (DISTRICT_LABELS[normalized] && DISTRICT_LABELS[normalized][district]) || district;
}

function normalizeDistrictInput(value) {
  return normalizeInput(value).replace(/[\s._-]+/g, '');
}

function districtFromText(text, locale) {
  const normalized = normalizeDistrictInput(text);
  if (!normalized) return null;

  const raw = normalizeInput(text);
  const numberedChoice = Number.parseInt(raw, 10);
  if (
    String(numberedChoice) === raw &&
    numberedChoice >= 1 &&
    numberedChoice <= DISTRICTS.length
  ) {
    return DISTRICTS[numberedChoice - 1];
  }

  const localesToCheck = [
    normalizeLocale(locale),
    ENGLISH,
    HINDI,
    TAMIL,
    BENGALI,
    ODIA,
    ASSAMESE
  ].filter((entry, index, entries) => entries.indexOf(entry) === index);

  return (
    DISTRICTS.find((district) => {
      const labels = [district, ...localesToCheck.map((entry) => districtLabel(district, entry))];
      return labels.some((label) => normalizeDistrictInput(label) === normalized);
    }) || null
  );
}

function isAffirmativeText(text) {
  const normalized = normalizeInput(text);
  return YES_WORDS.some((word) => normalizeInput(word) === normalized);
}

function isNegativeText(text) {
  const normalized = normalizeInput(text);
  return NO_WORDS.some((word) => normalizeInput(word) === normalized);
}

function genderFromText(text) {
  const normalized = normalizeInput(text);
  if (GENDER_MALE_WORDS.some((word) => normalizeInput(word) === normalized)) return 'male';
  if (GENDER_FEMALE_WORDS.some((word) => normalizeInput(word) === normalized)) return 'female';
  return null;
}

module.exports = {
  ENGLISH,
  SUPPORTED_LANGUAGES,
  DISTRICTS,
  normalizeLocale,
  localeForWorker,
  localeFromLanguageSelection,
  textFor,
  districtLabel,
  districtFromText,
  isAffirmativeText,
  isNegativeText,
  genderFromText
};
