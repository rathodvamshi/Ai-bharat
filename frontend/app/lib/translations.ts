// Supported languages
export type Language = "en" | "hi" | "bn" | "te" | "mr" | "ta";

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
];

// Translation strings
const translations: Record<string, Record<Language, string>> = {
  // Home screen
  "home.greetingMorning": {
    en: "Good Morning",
    hi: "शुभ प्रभात",
    bn: "সুপ্রভাত",
    te: "శుభోదయం",
    mr: "शुभ प्रभात",
    ta: "காலை வணக்கம்",
  },
  "home.greetingAfternoon": {
    en: "Good Afternoon",
    hi: "शुभ दोपहर",
    bn: "শুভ অপরাহ্ণ",
    te: "శుభ మధ్యాహ్నం",
    mr: "शुभ दुपार",
    ta: "மதிய வணக்கம்",
  },
  "home.greetingEvening": {
    en: "Good Evening",
    hi: "शुभ संध्या",
    bn: "শুভ সন্ধ্যা",
    te: "శుభ సాయంత్రం",
    mr: "शुभ संध्याकाळ",
    ta: "மாலை வணக்கம்",
  },
  "home.enableLocation": {
    en: "Enable Location",
    hi: "स्थान सक्षम करें",
    bn: "অবস্থান সক্রিয় করুন",
    te: "స్థానాన్ని ప్రారంభించండి",
    mr: "स्थान सक्षम करा",
    ta: "இருப்பிடத்தை இயக்கு",
  },
  "home.farmQuestion": {
    en: "How can I help your farm today?",
    hi: "आज आपकी खेती में कैसे मदद करूं?",
    bn: "আজ আপনার চাষে কীভাবে সাহায্য করতে পারি?",
    te: "ఈ రోజు మీ వ్యవసాయంలో ఎలా సహాయం చేయగలను?",
    mr: "आज तुमच्या शेतीत कशी मदत करू?",
    ta: "இன்று உங்கள் பண்ணைக்கு எப்படி உதவ முடியும்?",
  },
  "home.quickTools": {
    en: "Quick Tools",
    hi: "त्वरित उपकरण",
    bn: "দ্রুত সরঞ্জাম",
    te: "త్వరిత సాధనాలు",
    mr: "जलद साधने",
    ta: "விரைவு கருவிகள்",
  },
  "home.tipOfDay": {
    en: "Tip of the Day",
    hi: "आज की टिप",
    bn: "আজকের টিপস",
    te: "ఈ రోజు చిట్కా",
    mr: "आजची टिप",
    ta: "இன்றைய குறிப்பு",
  },
  "home.tipText": {
    en: "Water your crops early morning for best results",
    hi: "सबसे अच्छे परिणामों के लिए सुबह जल्दी अपनी फसलों को पानी दें",
    bn: "সেরা ফলাফলের জন্য সকালে তাড়াতাড়ি আপনার ফসলে জল দিন",
    te: "ఉత్తమ ఫలితాల కోసం మీ పంటలకు ఉదయాన్నే నీరు పెట్టండి",
    mr: "सर्वोत्तम परिणामांसाठी सकाळी लवकर पिकांना पाणी द्या",
    ta: "சிறந்த முடிவுகளுக்கு காலையில் உங்கள் பயிர்களுக்கு நீர் ஊற்றுங்கள்",
  },

  // Weather
  "weather.detectingLocation": {
    en: "Detecting location...",
    hi: "स्थान का पता लगाया जा रहा है...",
    bn: "অবস্থান সনাক্ত করা হচ্ছে...",
    te: "స్థానాన్ని గుర్తిస్తోంది...",
    mr: "स्थान शोधत आहे...",
    ta: "இருப்பிடத்தைக் கண்டறிகிறது...",
  },

  // Login screen
  "login.loggingIn": {
    en: "Logging in...",
    hi: "लॉग इन हो रहा है...",
    bn: "লগ ইন হচ্ছে...",
    te: "లాగిన్ అవుతోంది...",
    mr: "लॉग इन होत आहे...",
    ta: "உள்நுழைகிறது...",
  },
  "login.errorIncorrect": {
    en: "Incorrect password. Please try again.",
    hi: "गलत पासवर्ड। कृपया पुनः प्रयास करें।",
    bn: "ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।",
    te: "తప్పు పాస్‌వర్డ్. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    mr: "चुकीचा पासवर्ड. कृपया पुन्हा प्रयत्न करा.",
    ta: "தவறான கடவுச்சொல். மீண்டும் முயற்சிக்கவும்.",
  },
  "login.errorSignup": {
    en: "Could not create account. Please try again.",
    hi: "खाता नहीं बन सका। कृपया पुनः प्रयास करें।",
    bn: "অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।",
    te: "ఖాతా సృష్టించలేకపోయింది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    mr: "खाते तयार करता आले नाही. कृपया पुन्हा प्रयत्न करा.",
    ta: "கணக்கை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  },
  "login.welcomeTo": {
    en: "Welcome to",
    hi: "आपका स्वागत है",
    bn: "স্বাগতম",
    te: "స్వాగతం",
    mr: "स्वागत आहे",
    ta: "வரவேற்கிறோம்",
  },
  "login.welcomeBack": {
    en: "Welcome Back!",
    hi: "वापस स्वागत है!",
    bn: "ফিরে আসার জন্য স্বাগতম!",
    te: "తిరిగి స్వాగతం!",
    mr: "परत स्वागत आहे!",
    ta: "மீண்டும் வரவேற்கிறோம்!",
  },
  "login.createAccount": {
    en: "Create Account",
    hi: "खाता बनाएं",
    bn: "অ্যাকাউন্ট তৈরি করুন",
    te: "ఖాతా సృష్టించండి",
    mr: "खाते तयार करा",
    ta: "கணக்கு உருவாக்கவும்",
  },
  "login.checkingNumber": {
    en: "Checking...",
    hi: "जाँच हो रही है...",
    bn: "যাচাই হচ্ছে...",
    te: "తనిఖీ చేస్తోంది...",
    mr: "तपासत आहे...",
    ta: "சரிபார்க்கிறது...",
  },
  "login.enterMobile": {
    en: "Enter your mobile number",
    hi: "अपना मोबाइल नंबर दर्ज करें",
    bn: "আপনার মোবাইল নম্বর লিখুন",
    te: "మీ మొబైల్ నంబర్ నమోదు చేయండి",
    mr: "तुमचा मोबाइल नंबर टाका",
    ta: "உங்கள் மொபைல் எண்ணை உள்ளிடவும்",
  },
  "login.accountFound": {
    en: "Account found! Enter password",
    hi: "खाता मिला! पासवर्ड दर्ज करें",
    bn: "অ্যাকাউন্ট পাওয়া গেছে! পাসওয়ার্ড দিন",
    te: "ఖాతా దొరికింది! పాస్‌వర్డ్ నమోదు చేయండి",
    mr: "खाते सापडले! पासवर्ड टाका",
    ta: "கணக்கு கண்டறியப்பட்டது! கடவுச்சொல் உள்ளிடவும்",
  },
  "login.noAccountFound": {
    en: "New user? Create your account",
    hi: "नए यूज़र? अपना खाता बनाएं",
    bn: "নতুন ব্যবহারকারী? অ্যাকাউন্ট তৈরি করুন",
    te: "కొత్త వినియోగదారు? మీ ఖాతాను సృష్టించండి",
    mr: "नवीन वापरकर्ता? तुमचे खाते तयार करा",
    ta: "புதிய பயனர்? உங்கள் கணக்கை உருவாக்கவும்",
  },
  "login.continue": {
    en: "Continue",
    hi: "जारी रखें",
    bn: "চালিয়ে যান",
    te: "కొనసాగించు",
    mr: "सुरू ठेवा",
    ta: "தொடரவும்",
  },
  "login.loginButton": {
    en: "Login",
    hi: "लॉग इन",
    bn: "লগ ইন",
    te: "లాగిన్",
    mr: "लॉग इन",
    ta: "உள்நுழை",
  },
  "login.signupButton": {
    en: "Sign Up",
    hi: "साइन अप",
    bn: "সাইন আপ",
    te: "సైన్ అప్",
    mr: "साइन अप",
    ta: "பதிவு செய்",
  },
};

/**
 * Get translated string for a given key and language
 * Falls back to English if translation not found
 */
export function t(key: string, lang: Language): string {
  const entry = translations[key];
  if (!entry) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  return entry[lang] || entry["en"] || key;
}

export default translations;
