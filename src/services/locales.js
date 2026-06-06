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
  [HINDI]: ['hi', 'hi-in', 'hindi', 'हिंदी', 'हिन्दी'],
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
    aadhaarRequired: 'Aadhaar consent is required to complete worker onboarding.',
    aadhaarReceived: 'Thank you. Your Aadhaar has been received and is now under verification.',
    aadhaarPending: 'Your Aadhaar is still under verification. We will update you soon.',
    approvedAlready: 'Your Atithy worker onboarding is already complete. You are active for Atithy jobs.',
    complete: 'Your Atithy worker onboarding is complete. Your profile is now active. You will receive available job details through Atithy.',
    clearer: 'Please upload a clearer Aadhaar image or PDF. Make sure all details are readable.',
    rejected: 'Your Aadhaar could not be verified. Please upload a valid Aadhaar card again.'
  },
  [HINDI]: {
    languagePrompt: 'कृपया अपनी भाषा चुनें।',
    languageButton: 'भाषा',
    languageSection: 'उपलब्ध भाषाएँ',
    intro: [
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
    ].join('\n'),
    interested: 'क्या आप Atithy में worker के रूप में जुड़ना चाहते हैं?',
    yes: 'हाँ',
    no: 'अभी नहीं',
    notNow: 'ठीक है। Atithy से जुड़ना हो तो बाद में फिर message करें।',
    chooseOption: 'कृपया नीचे दिया गया option चुनें।',
    name: 'कृपया अपना पूरा नाम भेजें।',
    gender: 'कृपया अपना लिंग चुनें।',
    male: 'पुरुष',
    female: 'महिला',
    districtIntro: 'कृपया Kerala में अपना वर्तमान जिला चुनें।',
    districtList1: 'Kerala जिले - सूची 1',
    districtList2: 'Kerala जिले - सूची 2',
    districtButton: 'जिला चुनें',
    districtSection1: 'जिले 1-7',
    districtSection2: 'जिले 8-14',
    aadhaarConsent: [
      'Aadhaar verification की सहमति',
      '',
      'I agree चुनने पर आप Atithy को worker identity verification और onboarding approval के लिए Aadhaar card collect और store करने की अनुमति देते हैं।'
    ].join('\n'),
    consentYes: 'मैं सहमत हूँ',
    consentNo: 'सहमत नहीं',
    aadhaarUpload: 'कृपया अपना Aadhaar card clear image या PDF के रूप में upload करें।',
    aadhaarRequired: 'Worker onboarding पूरा करने के लिए Aadhaar consent ज़रूरी है।',
    aadhaarReceived: 'धन्यवाद। आपका Aadhaar मिल गया है और verification के लिए भेज दिया गया है।',
    aadhaarPending: 'आपका Aadhaar अभी verification में है। हम जल्द update देंगे।',
    approvedAlready: 'आपका Atithy worker onboarding पहले से पूरा है। आप Atithy काम के लिए active हैं।',
    complete: 'आपका Atithy worker onboarding पूरा हो गया है। आपकी profile अब active है। उपलब्ध काम की जानकारी आपको Atithy के through मिलेगी।',
    clearer: 'कृपया Aadhaar की clearer image या PDF upload करें। सभी details readable होनी चाहिए।',
    rejected: 'आपका Aadhaar verify नहीं हो पाया। कृपया valid Aadhaar card फिर से upload करें।'
  },
  [TAMIL]: {
    languagePrompt: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்.',
    languageButton: 'மொழி',
    languageSection: 'கிடைக்கும் மொழிகள்',
    intro: [
      'Atithy-க்கு வரவேற்கிறோம்.',
      '',
      'Atithy, Kerala-வில் workers-க்கு தினசரி வேலை வாய்ப்புகளை அனுப்புகிறது.',
      '',
      'Helper work, loading/unloading, packing/sorting, house shifting, hotel/restaurant helper, shop/supermarket helper, factory helper, cleaning, farm work, event setup போன்ற வேலைகள் கிடைக்கலாம்.',
      '',
      'ஒவ்வொரு வேலைக்கும் தேதி, நேரம், வேலை விவரம், workplace/customer contact number, location details கிடைக்கும்.',
      '',
      'வேலை முடிந்த பிறகு payment-ஐ customer-இடம் collect செய்யலாம்.',
      '',
      'நீங்கள் ஒரு நாளுக்கு சுமார் Rs 1000 முதல் Rs 1200 வரை சம்பாதிக்கலாம்.'
    ].join('\n'),
    interested: 'Atithy-யில் worker ஆக சேர விருப்பமா?',
    yes: 'ஆம்',
    no: 'இப்போது வேண்டாம்',
    notNow: 'சரி. Atithy-யில் சேர விரும்பினால் பிறகு மீண்டும் message செய்யலாம்.',
    chooseOption: 'கீழே உள்ள option-ஐத் தேர்ந்தெடுக்கவும்.',
    name: 'உங்கள் முழு பெயரை அனுப்பவும்.',
    gender: 'உங்கள் பாலினத்தைத் தேர்ந்தெடுக்கவும்.',
    male: 'ஆண்',
    female: 'பெண்',
    districtIntro: 'Kerala-வில் உங்கள் தற்போதைய மாவட்டத்தைத் தேர்ந்தெடுக்கவும்.',
    districtList1: 'Kerala மாவட்டங்கள் - பட்டியல் 1',
    districtList2: 'Kerala மாவட்டங்கள் - பட்டியல் 2',
    districtButton: 'மாவட்டம்',
    districtSection1: 'மாவட்டங்கள் 1-7',
    districtSection2: 'மாவட்டங்கள் 8-14',
    aadhaarConsent: [
      'Aadhaar verification consent',
      '',
      'I agree தேர்ந்தெடுத்தால், worker identity verification மற்றும் onboarding approval-க்காக Atithy உங்கள் Aadhaar card-ஐ collect செய்து store செய்ய அனுமதிக்கிறீர்கள்.'
    ].join('\n'),
    consentYes: 'ஒப்புக்கொள்கிறேன்',
    consentNo: 'ஒப்புக்கொள்ளவில்லை',
    aadhaarUpload: 'உங்கள் Aadhaar card-ஐ clear image அல்லது PDF ஆக upload செய்யவும்.',
    aadhaarRequired: 'Worker onboarding முடிக்க Aadhaar consent அவசியம்.',
    aadhaarReceived: 'நன்றி. உங்கள் Aadhaar பெறப்பட்டது, verification-க்கு அனுப்பப்பட்டுள்ளது.',
    aadhaarPending: 'உங்கள் Aadhaar இன்னும் verification-ல் உள்ளது. விரைவில் update தருகிறோம்.',
    approvedAlready: 'உங்கள் Atithy worker onboarding ஏற்கனவே முடிந்துள்ளது. நீங்கள் Atithy வேலைகளுக்கு active ஆக உள்ளீர்கள்.',
    complete: 'உங்கள் Atithy worker onboarding முடிந்தது. உங்கள் profile இப்போது active. கிடைக்கும் வேலை விவரங்கள் Atithy மூலம் அனுப்பப்படும்.',
    clearer: 'Aadhaar-ன் இன்னும் தெளிவான image அல்லது PDF upload செய்யவும். எல்லா விவரங்களும் readable ஆக இருக்க வேண்டும்.',
    rejected: 'உங்கள் Aadhaar verify ஆகவில்லை. valid Aadhaar card-ஐ மீண்டும் upload செய்யவும்.'
  },
  [BENGALI]: {
    languagePrompt: 'অনুগ্রহ করে আপনার ভাষা বেছে নিন।',
    languageButton: 'ভাষা',
    languageSection: 'উপলব্ধ ভাষা',
    intro: [
      'Atithy-তে আপনাকে স্বাগতম।',
      '',
      'Atithy Kerala-তে workers-দের প্রতিদিনের কাজের সুযোগ পাঠায়।',
      '',
      'আপনি helper work, loading/unloading, packing/sorting, house shifting, hotel/restaurant helper, shop/supermarket helper, factory helper, cleaning, farm work এবং event setup-এর মতো কাজ পেতে পারেন।',
      '',
      'প্রতিটি কাজের জন্য আপনি তারিখ, সময়, কাজের বিবরণ, workplace/customer contact number এবং location details পাবেন।',
      '',
      'কাজ শেষ করার পরে payment customer-এর কাছ থেকে collect করা যাবে।',
      '',
      'আপনি দিনে প্রায় Rs 1000 থেকে Rs 1200 পর্যন্ত উপার্জন করতে পারেন।'
    ].join('\n'),
    interested: 'আপনি কি Atithy-তে worker হিসেবে যোগ দিতে চান?',
    yes: 'হ্যাঁ',
    no: 'এখন নয়',
    notNow: 'ঠিক আছে। Atithy-তে যোগ দিতে চাইলে পরে আবার message করতে পারেন।',
    chooseOption: 'অনুগ্রহ করে নিচের option বেছে নিন।',
    name: 'অনুগ্রহ করে আপনার পুরো নাম পাঠান।',
    gender: 'অনুগ্রহ করে আপনার লিঙ্গ নির্বাচন করুন।',
    male: 'পুরুষ',
    female: 'মহিলা',
    districtIntro: 'Kerala-তে আপনার বর্তমান জেলা নির্বাচন করুন।',
    districtList1: 'Kerala জেলা - তালিকা 1',
    districtList2: 'Kerala জেলা - তালিকা 2',
    districtButton: 'জেলা বেছে নিন',
    districtSection1: 'জেলা 1-7',
    districtSection2: 'জেলা 8-14',
    aadhaarConsent: [
      'Aadhaar verification consent',
      '',
      'I agree নির্বাচন করলে, worker identity verification এবং onboarding approval-এর জন্য Atithy আপনার Aadhaar card collect ও store করতে পারবে।'
    ].join('\n'),
    consentYes: 'আমি রাজি',
    consentNo: 'আমি রাজি নই',
    aadhaarUpload: 'আপনার Aadhaar card clear image বা PDF হিসেবে upload করুন।',
    aadhaarRequired: 'Worker onboarding সম্পূর্ণ করতে Aadhaar consent প্রয়োজন।',
    aadhaarReceived: 'ধন্যবাদ। আপনার Aadhaar পাওয়া গেছে এবং verification-এর জন্য পাঠানো হয়েছে।',
    aadhaarPending: 'আপনার Aadhaar এখনও verification-এ আছে। আমরা শীঘ্রই update দেব।',
    approvedAlready: 'আপনার Atithy worker onboarding ইতিমধ্যে সম্পূর্ণ হয়েছে। আপনি Atithy কাজের জন্য active আছেন।',
    complete: 'আপনার Atithy worker onboarding সম্পূর্ণ হয়েছে। আপনার profile এখন active। উপলব্ধ কাজের বিবরণ Atithy-এর মাধ্যমে পাবেন।',
    clearer: 'Aadhaar-এর আরও clear image বা PDF upload করুন। সব details readable হতে হবে।',
    rejected: 'আপনার Aadhaar verify করা যায়নি। অনুগ্রহ করে valid Aadhaar card আবার upload করুন।'
  },
  [ODIA]: {
    languagePrompt: 'ଦୟାକରି ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ।',
    languageButton: 'ଭାଷା',
    languageSection: 'ଉପଲବ୍ଧ ଭାଷା',
    intro: [
      'Atithy କୁ ସ୍ୱାଗତ।',
      '',
      'Atithy Kerala ରେ workers ମାନଙ୍କୁ ପ୍ରତିଦିନ କାମର ସୁଯୋଗ ପଠାଏ।',
      '',
      'ଆପଣ helper work, loading/unloading, packing/sorting, house shifting, hotel/restaurant helper, shop/supermarket helper, factory helper, cleaning, farm work ଏବଂ event setup ପରି କାମ ପାଇପାରିବେ।',
      '',
      'ପ୍ରତ୍ୟେକ କାମ ପାଇଁ ତାରିଖ, ସମୟ, କାମର ବିବରଣୀ, workplace/customer contact number ଏବଂ location details ମିଳିବ।',
      '',
      'କାମ ସରିଲେ payment customer ଠାରୁ collect କରିପାରିବେ।',
      '',
      'ଆପଣ ଦିନକୁ ପ୍ରାୟ Rs 1000 ରୁ Rs 1200 ପର୍ଯ୍ୟନ୍ତ ଆୟ କରିପାରିବେ।'
    ].join('\n'),
    interested: 'ଆପଣ Atithy ରେ worker ଭାବରେ ଯୋଗ ଦେବାକୁ ଇଚ୍ଛୁକ କି?',
    yes: 'ହଁ',
    no: 'ଏବେ ନୁହେଁ',
    notNow: 'ଠିକ୍ ଅଛି। Atithy ରେ ଯୋଗ ଦେବାକୁ ଚାହିଁଲେ ପରେ ପୁଣି message କରନ୍ତୁ।',
    chooseOption: 'ଦୟାକରି ତଳର option ବାଛନ୍ତୁ।',
    name: 'ଦୟାକରି ଆପଣଙ୍କ ପୂର୍ଣ୍ଣ ନାମ ପଠାନ୍ତୁ।',
    gender: 'ଦୟାକରି ଆପଣଙ୍କ ଲିଙ୍ଗ ବାଛନ୍ତୁ।',
    male: 'ପୁରୁଷ',
    female: 'ମହିଳା',
    districtIntro: 'Kerala ରେ ଆପଣଙ୍କ ବର୍ତ୍ତମାନ ଜିଲ୍ଲା ବାଛନ୍ତୁ।',
    districtList1: 'Kerala ଜିଲ୍ଲା - ତାଲିକା 1',
    districtList2: 'Kerala ଜିଲ୍ଲା - ତାଲିକା 2',
    districtButton: 'ଜିଲ୍ଲା ବାଛନ୍ତୁ',
    districtSection1: 'ଜିଲ୍ଲା 1-7',
    districtSection2: 'ଜିଲ୍ଲା 8-14',
    aadhaarConsent: [
      'Aadhaar verification consent',
      '',
      'I agree ବାଛିଲେ, worker identity verification ଏବଂ onboarding approval ପାଇଁ Atithy ଆପଣଙ୍କ Aadhaar card collect ଓ store କରିପାରିବ।'
    ].join('\n'),
    consentYes: 'ମୁଁ ସହମତ',
    consentNo: 'ସହମତ ନୁହେଁ',
    aadhaarUpload: 'ଦୟାକରି ଆପଣଙ୍କ Aadhaar card clear image କିମ୍ବା PDF ଭାବେ upload କରନ୍ତୁ।',
    aadhaarRequired: 'Worker onboarding ସମ୍ପୂର୍ଣ୍ଣ କରିବାକୁ Aadhaar consent ଆବଶ୍ୟକ।',
    aadhaarReceived: 'ଧନ୍ୟବାଦ। ଆପଣଙ୍କ Aadhaar ମିଳିଛି ଏବଂ verification ପାଇଁ ପଠାଯାଇଛି।',
    aadhaarPending: 'ଆପଣଙ୍କ Aadhaar ଏଖଣି verification ରେ ଅଛି। ଆମେ ଶୀଘ୍ର update ଦେବୁ।',
    approvedAlready: 'ଆପଣଙ୍କ Atithy worker onboarding ପୂର୍ବରୁ ସମ୍ପୂର୍ଣ୍ଣ। ଆପଣ Atithy କାମ ପାଇଁ active ଅଛନ୍ତି।',
    complete: 'ଆପଣଙ୍କ Atithy worker onboarding ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି। ଆପଣଙ୍କ profile ଏବେ active। ଉପଲବ୍ଧ କାମର ବିବରଣୀ Atithy ମାଧ୍ୟମରେ ମିଳିବ।',
    clearer: 'ଦୟାକରି Aadhaar ର clearer image କିମ୍ବା PDF upload କରନ୍ତୁ। ସମସ୍ତ details readable ହେବା ଦରକାର।',
    rejected: 'ଆପଣଙ୍କ Aadhaar verify ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି valid Aadhaar card ପୁଣି upload କରନ୍ତୁ।'
  },
  [ASSAMESE]: {
    languagePrompt: 'অনুগ্ৰহ কৰি আপোনাৰ ভাষা বাছনি কৰক।',
    languageButton: 'ভাষা',
    languageSection: 'উপলব্ধ ভাষা',
    intro: [
      'Atithy লৈ স্বাগতম।',
      '',
      'Atithy-এ Kerala-ত workers সকললৈ দৈনিক কামৰ সুযোগ পঠায়।',
      '',
      'আপুনি helper work, loading/unloading, packing/sorting, house shifting, hotel/restaurant helper, shop/supermarket helper, factory helper, cleaning, farm work আৰু event setup ধৰণৰ কাম পাব পাৰে।',
      '',
      'প্ৰতিটো কামৰ বাবে তাৰিখ, সময়, কামৰ বিৱৰণ, workplace/customer contact number আৰু location details পাব।',
      '',
      'কাম শেষ কৰাৰ পাছত payment customer-ৰ পৰা collect কৰিব পাৰিব।',
      '',
      'আপুনি দিনে প্ৰায় Rs 1000 ৰ পৰা Rs 1200 পৰ্যন্ত উপাৰ্জন কৰিব পাৰিব।'
    ].join('\n'),
    interested: 'আপুনি Atithy-ত worker হিচাপে যোগ দিবলৈ আগ্ৰহী নে?',
    yes: 'হয়',
    no: 'এতিয়া নহয়',
    notNow: 'ঠিক আছে। Atithy-ত যোগ দিব বিচাৰিলে পাছত আকৌ message কৰিব পাৰে।',
    chooseOption: 'অনুগ্ৰহ কৰি তলৰ option বাছনি কৰক।',
    name: 'অনুগ্ৰহ কৰি আপোনাৰ সম্পূৰ্ণ নাম পঠাওক।',
    gender: 'অনুগ্ৰহ কৰি আপোনাৰ লিংগ বাছনি কৰক।',
    male: 'পুৰুষ',
    female: 'মহিলা',
    districtIntro: 'Kerala-ত আপোনাৰ বৰ্তমান জিলা বাছনি কৰক।',
    districtList1: 'Kerala জিলা - তালিকা 1',
    districtList2: 'Kerala জিলা - তালিকা 2',
    districtButton: 'জিলা বাছনি',
    districtSection1: 'জিলা 1-7',
    districtSection2: 'জিলা 8-14',
    aadhaarConsent: [
      'Aadhaar verification consent',
      '',
      'I agree বাছনি কৰিলে, worker identity verification আৰু onboarding approval-ৰ বাবে Atithy-এ আপোনাৰ Aadhaar card collect আৰু store কৰিব পাৰিব।'
    ].join('\n'),
    consentYes: 'মই সন্মত',
    consentNo: 'সন্মত নহয়',
    aadhaarUpload: 'অনুগ্ৰহ কৰি আপোনাৰ Aadhaar card clear image বা PDF হিচাপে upload কৰক।',
    aadhaarRequired: 'Worker onboarding সম্পূৰ্ণ কৰিবলৈ Aadhaar consent আৱশ্যক।',
    aadhaarReceived: 'ধন্যবাদ। আপোনাৰ Aadhaar পোৱা গৈছে আৰু verification-লৈ পঠোৱা হৈছে।',
    aadhaarPending: 'আপোনাৰ Aadhaar এতিয়াও verification-ত আছে। আমি সোনকালে update দিম।',
    approvedAlready: 'আপোনাৰ Atithy worker onboarding ইতিমধ্যে সম্পূৰ্ণ। আপুনি Atithy কামৰ বাবে active।',
    complete: 'আপোনাৰ Atithy worker onboarding সম্পূৰ্ণ হৈছে। আপোনাৰ profile এতিয়া active। উপলব্ধ কামৰ বিৱৰণ Atithy-ৰ জৰিয়তে পাব।',
    clearer: 'অনুগ্ৰহ কৰি Aadhaar-ৰ clearer image বা PDF upload কৰক। সকলো details readable হ’ব লাগিব।',
    rejected: 'আপোনাৰ Aadhaar verify কৰিব পৰা নগ’ল। অনুগ্ৰহ কৰি valid Aadhaar card আকৌ upload কৰক।'
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
  isAffirmativeText,
  isNegativeText,
  genderFromText
};
