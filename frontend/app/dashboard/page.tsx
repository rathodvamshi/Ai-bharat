"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Square,
  Loader2,
  Wheat,
  Home as HomeIcon,
  GraduationCap,
  Heart,
  Banknote,
  Shield,
  Phone,
  Globe,
  ChevronRight,
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  HelpCircle,
  Menu,
  X,
  Volume2,
  Languages,
  AlertCircle,
  MessageSquare,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { useWeather } from "../hooks/useWeather";

type AppState = "idle" | "listening" | "processing" | "speaking" | "error";

// Declare the Web Speech API types (not in default TS lib)
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

// ============================================================
// TRANSLATIONS - All UI text in Hindi, Telugu, English
// ============================================================
const translations = {
  "hi-IN": {
    // Header
    appName: "जन-सहायक",
    appNameEn: "Jan-Sahayak",
    schemes: "योजनाएं",
    features: "सुविधाएं",
    help: "मदद",

    // Hero Section
    tagline: "AI-Powered सरकारी सहायता",
    heroTitle1: "आवाज़ ही",
    heroTitle2: "आपकी ताकत है",
    heroDesc: "बोलकर जानें सरकारी योजनाओं के बारे में, बिना पढ़े-लिखे।",
    heroHighlight: "दीदी आपकी मदद के लिए हमेशा तैयार!",
    talkToDidi: "दीदी से बात करें",
    howToUse: "कैसे उपयोग करें?",

    // Stats
    statSchemes: "सरकारी योजनाएं",
    statLanguages: "भाषाएं",
    statAvailable: "उपलब्ध",

    // Voice Assistant
    statusIdle: "अपनी भाषा में बोलें",
    statusIdleSub: "माइक बटन दबाकर हिंदी में बोलें",
    statusListening: "दीदी सुन रही हैं...",
    statusListeningSub: "बोलते रहें, जब हो जाए तो बटन दबाएं",
    statusProcessing: "दीदी सोच रही हैं...",
    statusSpeaking: "दीदी बोल रही हैं...",
    buttonStop: "रोकने के लिए दबाएं",
    buttonProcessing: "प्रोसेसिंग...",
    buttonSpeak: "बोलने के लिए दबाएं",
    speaking: "बोल रही हैं...",

    // Schemes Section
    schemesTitle: "सरकारी योजनाएं",
    schemesTitleEn: "Government Schemes",
    schemesDesc: "अपनी जरूरत के हिसाब से योजना चुनें और दीदी से बात करें",
    ask: "पूछें",

    // Categories
    catAgriculture: "कृषि",
    catAgricultureEn: "Agriculture",
    catHousing: "आवास",
    catHousingEn: "Housing",
    catEducation: "शिक्षा",
    catEducationEn: "Education",
    catHealth: "स्वास्थ्य",
    catHealthEn: "Health",
    catFinance: "वित्त",
    catFinanceEn: "Finance",
    catPension: "पेंशन",
    catPensionEn: "Pension",

    // Features Section
    featuresTitle: "क्यों है खास जन-सहायक?",
    featuresTitleEn: "Why Jan-Sahayak?",
    feature1Title: "बोलकर जानें",
    feature1TitleEn: "Voice First",
    feature1Desc: "हिंदी, तेलुगु में बात करें",
    feature2Title: "फॉर्म भरवाएं",
    feature2TitleEn: "Auto Fill Forms",
    feature2Desc: "AI खुद फॉर्म भरेगा",
    feature3Title: "अपनी भाषा",
    feature3TitleEn: "Your Language",
    feature3Desc: "क्षेत्रीय भाषाओं में सहायता",
    feature4Title: "24/7 मदद",
    feature4TitleEn: "Always Available",
    feature4Desc: "कभी भी पूछें सवाल",

    // CTA Section
    ctaTitle: "आज ही शुरू करें!",
    ctaDesc: "दीदी से बात करें और जानें कौन सी सरकारी योजना आपके लिए है",
    ctaButton: "अभी बात करें",

    // Footer
    footerDesc: "AI-powered सरकारी योजना सहायक। बोलकर जानें, बिना पढ़े-लिखे।",
    quickLinks: "त्वरित लिंक",
    homepage: "होमपेज",
    contactUs: "संपर्क करें",
    copyright: "© 2025 जन-सहायक | Made with ❤️ for Bharat",

    // Form
    liveForm: "लाइव एप्लीकेशन फॉर्म",
    liveFormEn: "Live Application Form",
    pending: "बाकी है...",

    // Errors
    browserWarning: "वॉइस इनपुट के लिए Google Chrome का उपयोग करें। कृपया इस पेज को Chrome में खोलें।",
    yourLocation: "आपका स्थान",
    findingLocation: "स्थान खोज रहे हैं...",
  },

  "te-IN": {
    // Header
    appName: "జన-సహాయక్",
    appNameEn: "Jan-Sahayak",
    schemes: "పథకాలు",
    features: "ఫీచర్లు",
    help: "సహాయం",

    // Hero Section
    tagline: "AI-Powered ప్రభుత్వ సహాయం",
    heroTitle1: "మీ గొంతే",
    heroTitle2: "మీ శక్తి",
    heroDesc: "చదవకుండా ప్రభుత్వ పథకాల గురించి తెలుసుకోండి.",
    heroHighlight: "దీదీ మీకు సహాయం చేయడానికి సిద్ధంగా ఉంది!",
    talkToDidi: "దీదీతో మాట్లాడండి",
    howToUse: "ఎలా ఉపయోగించాలి?",

    // Stats
    statSchemes: "ప్రభుత్వ పథకాలు",
    statLanguages: "భాషలు",
    statAvailable: "అందుబాటులో",

    // Voice Assistant
    statusIdle: "మీ భాషలో మాట్లాడండి",
    statusIdleSub: "మైక్ బటన్ నొక్కి తెలుగులో మాట్లాడండి",
    statusListening: "దీదీ వింటోంది...",
    statusListeningSub: "మాట్లాడుతూ ఉండండి, పూర్తయిన తర్వాత బటన్ నొక్కండి",
    statusProcessing: "దీదీ ఆలోచిస్తోంది...",
    statusSpeaking: "దీదీ మాట్లాడుతోంది...",
    buttonStop: "ఆపడానికి నొక్కండి",
    buttonProcessing: "ప్రాసెసింగ్...",
    buttonSpeak: "మాట్లాడటానికి నొక్కండి",
    speaking: "మాట్లాడుతోంది...",

    // Schemes Section
    schemesTitle: "ప్రభుత్వ పథకాలు",
    schemesTitleEn: "Government Schemes",
    schemesDesc: "మీ అవసరానికి తగిన పథకాన్ని ఎంచుకుని దీదీతో మాట్లాడండి",
    ask: "అడగండి",

    // Categories
    catAgriculture: "వ్యవసాయం",
    catAgricultureEn: "Agriculture",
    catHousing: "గృహ నిర్మాణం",
    catHousingEn: "Housing",
    catEducation: "విద్య",
    catEducationEn: "Education",
    catHealth: "ఆరోగ్యం",
    catHealthEn: "Health",
    catFinance: "ఆర్థికం",
    catFinanceEn: "Finance",
    catPension: "పెన్షన్",
    catPensionEn: "Pension",

    // Features Section
    featuresTitle: "జన-సహాయక్ ఎందుకు ప్రత్యేకం?",
    featuresTitleEn: "Why Jan-Sahayak?",
    feature1Title: "మాట్లాడి తెలుసుకోండి",
    feature1TitleEn: "Voice First",
    feature1Desc: "హిందీ, తెలుగులో మాట్లాడండి",
    feature2Title: "ఫారాలు పూరించండి",
    feature2TitleEn: "Auto Fill Forms",
    feature2Desc: "AI ఫారం పూరిస్తుంది",
    feature3Title: "మీ భాష",
    feature3TitleEn: "Your Language",
    feature3Desc: "ప్రాంతీయ భాషల్లో సహాయం",
    feature4Title: "24/7 సహాయం",
    feature4TitleEn: "Always Available",
    feature4Desc: "ఎప్పుడైనా ప్రశ్నలు అడగండి",

    // CTA Section
    ctaTitle: "ఈ రోజే ప్రారంభించండి!",
    ctaDesc: "దీదీతో మాట్లాడి ఏ ప్రభుత్వ పథకం మీకు సరిపోతుందో తెలుసుకోండి",
    ctaButton: "ఇప్పుడే మాట్లాడండి",

    // Footer
    footerDesc: "AI-powered ప్రభుత్వ పథక సహాయకుడు. చదవకుండా తెలుసుకోండి.",
    quickLinks: "త్వరిత లింకులు",
    homepage: "హోమ్‌పేజ్",
    contactUs: "మమ్మల్ని సంప్రదించండి",
    copyright: "© 2025 జన-సహాయక్ | Made with ❤️ for Bharat",

    // Form
    liveForm: "లైవ్ దరఖాస్తు ఫారం",
    liveFormEn: "Live Application Form",
    pending: "పెండింగ్...",

    // Errors
    browserWarning: "వాయిస్ ఇన్‌పుట్ కోసం Google Chrome వాడండి. దయచేసి ఈ పేజీని Chrome లో తెరవండి.",
    yourLocation: "మీ స్థానం",
    findingLocation: "వెతుకుతోంది...",
  },

  "en-IN": {
    // Header
    appName: "Jan-Sahayak",
    appNameEn: "जन-सहायक",
    schemes: "Schemes",
    features: "Features",
    help: "Help",

    // Hero Section
    tagline: "AI-Powered Government Assistance",
    heroTitle1: "Your Voice",
    heroTitle2: "Is Your Power",
    heroDesc: "Learn about government schemes by speaking, no reading required.",
    heroHighlight: "Didi is always ready to help you!",
    talkToDidi: "Talk to Didi",
    howToUse: "How to use?",

    // Stats
    statSchemes: "Government Schemes",
    statLanguages: "Languages",
    statAvailable: "Available",

    // Voice Assistant
    statusIdle: "Speak in your language",
    statusIdleSub: "Press the mic button and speak in English",
    statusListening: "Didi is listening...",
    statusListeningSub: "Keep speaking, press button when done",
    statusProcessing: "Didi is thinking...",
    statusSpeaking: "Didi is speaking...",
    buttonStop: "Press to stop",
    buttonProcessing: "Processing...",
    buttonSpeak: "Press to speak",
    speaking: "Speaking...",

    // Schemes Section
    schemesTitle: "Government Schemes",
    schemesTitleEn: "सरकारी योजनाएं",
    schemesDesc: "Choose a scheme based on your need and talk to Didi",
    ask: "Ask",

    // Categories
    catAgriculture: "Agriculture",
    catAgricultureEn: "कृषि",
    catHousing: "Housing",
    catHousingEn: "आवास",
    catEducation: "Education",
    catEducationEn: "शिक्षा",
    catHealth: "Health",
    catHealthEn: "स्वास्थ्य",
    catFinance: "Finance",
    catFinanceEn: "वित्त",
    catPension: "Pension",
    catPensionEn: "पेंशन",

    // Features Section
    featuresTitle: "Why Jan-Sahayak?",
    featuresTitleEn: "क्यों है खास जन-सहायक?",
    feature1Title: "Voice First",
    feature1TitleEn: "बोलकर जानें",
    feature1Desc: "Speak in Hindi or Telugu",
    feature2Title: "Auto Fill Forms",
    feature2TitleEn: "फॉर्म भरवाएं",
    feature2Desc: "AI fills the form for you",
    feature3Title: "Your Language",
    feature3TitleEn: "अपनी भाषा",
    feature3Desc: "Support in regional languages",
    feature4Title: "Always Available",
    feature4TitleEn: "24/7 मदद",
    feature4Desc: "Ask questions anytime",

    // CTA Section
    ctaTitle: "Start Today!",
    ctaDesc: "Talk to Didi and find out which government scheme is right for you",
    ctaButton: "Talk Now",

    // Footer
    footerDesc: "AI-powered government scheme assistant. Learn by speaking, no reading required.",
    quickLinks: "Quick Links",
    homepage: "Homepage",
    contactUs: "Contact Us",
    copyright: "© 2025 Jan-Sahayak | Made with ❤️ for Bharat",

    // Form
    liveForm: "Live Application Form",
    liveFormEn: "लाइव एप्लीकेशन फॉर्म",
    pending: "Pending...",

    // Errors
    browserWarning: "Voice input requires Google Chrome. Please open this page in Chrome.",
    yourLocation: "Your Location",
    findingLocation: "Finding you...",
  },
};

type LanguageCode = "hi-IN" | "te-IN" | "en-IN";

const getSchemeCategories = (lang: LanguageCode) => [
  { id: 1, name: translations[lang].catAgriculture, nameEn: translations[lang].catAgricultureEn, icon: Wheat, color: "from-green-500 to-emerald-600", hint: lang === "te-IN" ? "Rythu Bandhu, PM-KISAN gurinchi cheppandi" : lang === "en-IN" ? "Tell me about PM-KISAN and agriculture schemes" : "Rythu Bandhu, PM-KISAN ke baare mein batao" },
  { id: 2, name: translations[lang].catHousing, nameEn: translations[lang].catHousingEn, icon: HomeIcon, color: "from-blue-500 to-indigo-600", hint: lang === "te-IN" ? "PMAY housing scheme gurinchi cheppandi" : lang === "en-IN" ? "Tell me about PMAY housing scheme" : "PMAY housing scheme ke baare mein batao" },
  { id: 3, name: translations[lang].catEducation, nameEn: translations[lang].catEducationEn, icon: GraduationCap, color: "from-purple-500 to-violet-600", hint: lang === "te-IN" ? "Scholarship yojana gurinchi cheppandi" : lang === "en-IN" ? "Tell me about scholarship schemes" : "Scholarship yojana ke baare mein batao" },
  { id: 4, name: translations[lang].catHealth, nameEn: translations[lang].catHealthEn, icon: Heart, color: "from-red-500 to-rose-600", hint: lang === "te-IN" ? "Ayushman Bharat yojana gurinchi cheppandi" : lang === "en-IN" ? "Tell me about Ayushman Bharat health scheme" : "Ayushman Bharat yojana ke baare mein batao" },
  { id: 5, name: translations[lang].catFinance, nameEn: translations[lang].catFinanceEn, icon: Banknote, color: "from-amber-500 to-orange-600", hint: lang === "te-IN" ? "PM SVANidhi loan scheme gurinchi cheppandi" : lang === "en-IN" ? "Tell me about PM SVANidhi loan scheme" : "PM SVANidhi loan scheme ke baare mein batao" },
  { id: 6, name: translations[lang].catPension, nameEn: translations[lang].catPensionEn, icon: Shield, color: "from-teal-500 to-cyan-600", hint: lang === "te-IN" ? "Aasara pension scheme gurinchi cheppandi" : lang === "en-IN" ? "Tell me about Atal Pension Yojana" : "Aasara pension scheme ke baare mein batao" },
];

const getFeatures = (lang: LanguageCode) => [
  { icon: Volume2, title: translations[lang].feature1Title, titleEn: translations[lang].feature1TitleEn, desc: translations[lang].feature1Desc },
  { icon: FileText, title: translations[lang].feature2Title, titleEn: translations[lang].feature2TitleEn, desc: translations[lang].feature2Desc },
  { icon: Languages, title: translations[lang].feature3Title, titleEn: translations[lang].feature3TitleEn, desc: translations[lang].feature3Desc },
  { icon: HelpCircle, title: translations[lang].feature4Title, titleEn: translations[lang].feature4TitleEn, desc: translations[lang].feature4Desc },
];

const BACKEND_URL = "http://localhost:8000";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [extractedData, setExtractedData] = useState<Record<string, string | null> | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("hi-IN");
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [aiResponseText, setAiResponseText] = useState<string>("");
  const [sttSupported, setSttSupported] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<string>("");

  // Location and Weather integration
  const { weatherData, locationGranted, loading: locationLoading, error: locationError, requestLocation } = useWeather();

  // Get translations for current language
  const t = translations[selectedLanguage];
  const schemeCategories = getSchemeCategories(selectedLanguage);
  const features = getFeatures(selectedLanguage);

  // Dynamic status text based on language
  const [statusText, setStatusText] = useState(t.statusIdle);
  const [statusSubtext, setStatusSubtext] = useState(t.statusIdleSub);

  // Update status text when language changes
  useEffect(() => {
    if (appState === "idle") {
      setStatusText(t.statusIdle);
      setStatusSubtext(t.statusIdleSub);
    }
  }, [selectedLanguage, appState, t]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const manualStopRef = useRef<boolean>(false);

  // Floating particles - initialized empty to avoid hydration mismatch
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // Generate particles only on client side to prevent hydration mismatch
  useEffect(() => {
    setParticles(
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
      }))
    );
  }, []);

  // Check Web Speech API support on mount
  useEffect(() => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSttSupported(false);
      console.warn("Web Speech API not supported in this browser. Use Chrome.");
    }
  }, []);

  // ============================================================
  // CORE FUNCTION: Send transcribed text to backend
  // ============================================================
  const sendTextToBackend = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setTranscribedText(text);
    setAppState("processing");
    setStatusText(t.statusProcessing);
    setStatusSubtext(`"${text}"`);

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/process-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          user_id: "9876543210",
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`API ${response.status}: ${errBody}`);
      }

      const data = await response.json();

      setAiResponseText(data.ai_response || "");
      setStatusText(data.ai_response || (selectedLanguage === "te-IN" ? "సమాధానం సిద్ధం!" : selectedLanguage === "en-IN" ? "Response ready!" : "जवाब तैयार है!"));
      setStatusSubtext(data.transcribed_text ? `${selectedLanguage === "te-IN" ? "మీరు చెప్పారు" : selectedLanguage === "en-IN" ? "You said" : "आपने कहा"}: "${data.transcribed_text}"` : "");

      if (data.extracted_data && Object.keys(data.extracted_data).length > 0) {
        setExtractedData(data.extracted_data);
      }

      if (data.application_status) {
        setApplicationStatus(data.application_status);
      }

      // Play Polly audio if available
      if (data.audio_url) {
        setAppState("speaking");
        setIsSpeaking(true);

        // Stop any previous audio
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }

        const audio = new Audio(`${BACKEND_URL}${data.audio_url}`);
        currentAudioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          setAppState("idle");
          setStatusText(selectedLanguage === "te-IN" ? "ఇంకేమైనా అడగాలా?" : selectedLanguage === "en-IN" ? "Want to ask anything else?" : "और कुछ पूछना है?");
          setStatusSubtext(selectedLanguage === "te-IN" ? "మాట్లాడటం కొనసాగించడానికి మైక్ నొక్కండి" : selectedLanguage === "en-IN" ? "Tap the mic to continue speaking" : "माइक दबाकर बोलना जारी रखें");
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          setAppState("idle");
        };

        audio.play().catch(() => {
          // Autoplay blocked — show text response at least
          setIsSpeaking(false);
          setAppState("idle");
        });
      } else {
        // No audio — show text response
        setAppState("idle");
        setTimeout(() => {
          setStatusText(selectedLanguage === "te-IN" ? "ఇంకేమైనా అడగాలా?" : selectedLanguage === "en-IN" ? "Want to ask anything else?" : "और कुछ पूछना है?");
          setStatusSubtext(selectedLanguage === "te-IN" ? "మాట్లాడటం కొనసాగించడానికి మైక్ నొక్కండి" : selectedLanguage === "en-IN" ? "Tap the mic to continue" : "माइक दबाकर बोलना जारी रखें");
        }, 5000);
      }
    } catch (error) {
      console.error("Backend error:", error);
      setAppState("error");
      setStatusText(selectedLanguage === "te-IN" ? "కనెక్షన్ లో సమస్య" : selectedLanguage === "en-IN" ? "Connection problem" : "कनेक्शन में समस्या");
      setStatusSubtext(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsSpeaking(false);

      setTimeout(() => {
        setAppState("idle");
        setStatusText(selectedLanguage === "te-IN" ? "మళ్ళీ ప్రయత్నించండి" : selectedLanguage === "en-IN" ? "Please try again" : "दोबारा कोशिश करें");
        setStatusSubtext(selectedLanguage === "te-IN" ? "దయచేసి మళ్ళీ ప్రయత్నించండి" : selectedLanguage === "en-IN" ? "Tap the mic to try again" : "माइक दबाकर दोबारा बोलें");
      }, 4000);
    }
  }, [selectedLanguage, t]);

  // ============================================================
  // WEB SPEECH API — CONTINUOUS LISTENER
  // Stays active until user manually presses Stop.
  // Chrome forcibly ends recognition after ~60s of silence;
  // we auto-restart it to keep the mic always open.
  // ============================================================

  const startListening = useCallback(() => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setAppState("error");
      setStatusText("Browser not supported");
      setStatusSubtext("Please use Google Chrome for voice input");
      return;
    }

    // Clear accumulated transcript & mark as intentional start
    accumulatedTranscriptRef.current = "";
    manualStopRef.current = false;

    // Kill any existing session before creating a new one
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) { /* ignore */ }
      recognitionRef.current = null;
    }

    const createAndStart = () => {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec || manualStopRef.current) return;

      const recognition = new SpeechRec();
      recognitionRef.current = recognition;

      recognition.lang = selectedLanguage || "hi-IN";
      recognition.continuous = true;        // ✅ Keep listening across pauses
      recognition.interimResults = true;    // ✅ Show partial results live
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        // Only update UI if this is the very first start (not a restart)
        if (accumulatedTranscriptRef.current === "") {
          setAppState("listening");
          setStatusText(selectedLanguage === "te-IN" ? "దీదీ విన్తోంది..." : selectedLanguage === "en-IN" ? "Didi is listening..." : "दीदी सुन रही हैं...");
          setStatusSubtext(selectedLanguage === "te-IN" ? "మాట్లాడండి — ఆపడానికి మళ్ళీ బటన్ నొక్కండి" : selectedLanguage === "en-IN" ? "Speak — tap button again to stop" : "बोलें — रोकने के लिए फिर से बटन दबाएं");
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        // Build the FULL transcript: all previous finals + current chunk
        let currentChunkFinal = "";
        let currentChunkInterim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentChunkFinal += t;
          } else {
            currentChunkInterim += t;
          }
        }

        // Append newly finalized text to the running total
        if (currentChunkFinal) {
          accumulatedTranscriptRef.current += " " + currentChunkFinal;
          accumulatedTranscriptRef.current = accumulatedTranscriptRef.current.trim();
        }

        // Display: everything accumulated so far + current interim
        const display =
          (accumulatedTranscriptRef.current + " " + currentChunkInterim).trim();

        if (display) {
          setStatusText(`"${display}"`);
          setStatusSubtext(
            currentChunkInterim
              ? (selectedLanguage === "te-IN" ? "🎤 విన్తోంది..." : selectedLanguage === "en-IN" ? "🎤 Listening..." : "🎤 सुन रही हूँ...")
              : `✓ ${accumulatedTranscriptRef.current.split(" ").length} ${selectedLanguage === "te-IN" ? "పదాలు — మాట్లాడుతూ ఉండండి లేదా ఆపండి" : selectedLanguage === "en-IN" ? "words — keep speaking or stop" : "शब्द — बोलते रहें या रोकें"}`
          );
          setTranscribedText(display);
        }
      };

      recognition.onend = () => {
        // If user hasn't pressed Stop → auto-restart to keep listening
        if (!manualStopRef.current) {
          // Small delay before restart to avoid rapid looping
          setTimeout(() => {
            if (!manualStopRef.current) {
              createAndStart();
            }
          }, 200);
        }
        // If user DID press Stop → sendTextToBackend is called in stopListening()
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);

        const safeToRestart = ["no-speech", "aborted"];
        if (safeToRestart.includes(event.error) && !manualStopRef.current) {
          // These are non-fatal — just restart silently
          return;
        }

        const errorMessages: Record<string, { text: string; subtext: string }> = {
          "not-allowed": {
            text: selectedLanguage === "te-IN" ? "మైక్ అనుమతి ఇవ్వండి" : selectedLanguage === "en-IN" ? "Allow microphone" : "माइक की अनुमति दें",
            subtext: selectedLanguage === "te-IN" ? "బ్రౌజర్ సెట్టింగ్స్ లో మైక్ పర్మిషన్ ఇవ్వండి" : selectedLanguage === "en-IN" ? "Please allow microphone access in your browser settings" : "ब्राउज़र सेटिंग्स में माइक की अनुमति दें",
          },
          "audio-capture": {
            text: selectedLanguage === "te-IN" ? "మైక్ కనుగొనలేదు" : selectedLanguage === "en-IN" ? "Mic not found" : "माइक नहीं मिला",
            subtext: selectedLanguage === "te-IN" ? "మైక్రోఫోన్ కనెక్ట్ చేయండి" : selectedLanguage === "en-IN" ? "No microphone found. Please connect a microphone." : "कोई माइक्रोफोन नहीं मिला। माइक कनेक्ट करें।",
          },
          "network": {
            text: selectedLanguage === "te-IN" ? "ఇంటర్నెట్ చెక్ చేయండి" : selectedLanguage === "en-IN" ? "Check internet connection" : "इंटरनेट कनेक्शन जांचें",
            subtext: selectedLanguage === "te-IN" ? "స్పీచ్ రెకగ్నిషన్ కి ఇంటర్నెట్ అవసరం" : selectedLanguage === "en-IN" ? "Speech recognition needs internet. Check your connection." : "स्पीच रेकग्निशन के लिए इंटरनेट जरूरी हैं।",
          },
          "service-not-allowed": {
            text: selectedLanguage === "te-IN" ? "సేవ అందుబాటులో లేదు" : selectedLanguage === "en-IN" ? "Service not available" : "सेवा उपलब्ध नहीं",
            subtext: selectedLanguage === "te-IN" ? "దయచేసి Google Chrome వాడండి" : selectedLanguage === "en-IN" ? "Speech service blocked. Please use Google Chrome." : "स्पीच सर्विस ब्लॉक्ड। Google Chrome उपयोग करें।",
          },
          "language-not-supported": {
            text: selectedLanguage === "te-IN" ? "భాష సపోర్ట్ లేదు" : selectedLanguage === "en-IN" ? "Language not supported" : "भाषा समर्थित नहीं",
            subtext: selectedLanguage === "te-IN" ? `${selectedLanguage} సపోర్ట్ కాదు. హిందీకి మారండి` : selectedLanguage === "en-IN" ? `${selectedLanguage} not supported. Try switching to Hindi.` : `${selectedLanguage} समर्थित नहीं। हिंदी में बदलें।`,
          },
        };

        const msg = errorMessages[event.error] || {
          text: selectedLanguage === "te-IN" ? "మైక్ లో సమస్య" : selectedLanguage === "en-IN" ? "Mic problem" : "माइक में समस्या",
          subtext: `Mic error: ${event.error}`,
        };

        manualStopRef.current = true; // Stop restart loop on fatal errors
        setAppState("error");
        setStatusText(msg.text);
        setStatusSubtext(msg.subtext);
        setTimeout(() => {
          setAppState("idle");
          setStatusText(selectedLanguage === "te-IN" ? "మళ్ళీ ప్రయత్నించండి" : selectedLanguage === "en-IN" ? "Try again" : "दोबारा कोशिश करें");
          setStatusSubtext(selectedLanguage === "te-IN" ? "మైక్ బటన్ నొక్కండి" : selectedLanguage === "en-IN" ? "Click the mic button to try again" : "माइक बटन दबाएं");
        }, 3500);
      };

      try {
        recognition.start();
      } catch (e) {
        console.warn("Recognition start failed:", e);
      }
    };

    createAndStart();
  }, [selectedLanguage]);

  // Called when user MANUALLY presses the Stop button
  const stopListening = useCallback(() => {
    // Mark as intentional stop FIRST — prevents onend from restarting
    manualStopRef.current = true;

    const textToSend = accumulatedTranscriptRef.current.trim();

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) { /* ignore */ }
      recognitionRef.current = null;
    }

    // Send to backend only if something was captured
    if (textToSend) {
      sendTextToBackend(textToSend);
    } else {
      setAppState("idle");
      setStatusText(selectedLanguage === "te-IN" ? "ఏమీ వినిపించలేదు" : selectedLanguage === "en-IN" ? "Nothing captured" : "कुछ सुनाई नहीं दिया");
      setStatusSubtext(selectedLanguage === "te-IN" ? "దయచేసి మళ్ళీ మాట్లాడండి" : selectedLanguage === "en-IN" ? "Please try speaking again." : "कुछ रिकॉर्ड नहीं हुआ। कृपया दोबारा बोलें।");
      setTimeout(() => {
        setStatusText(selectedLanguage === "te-IN" ? "మీ భాషలో మాట్లాడండి" : selectedLanguage === "en-IN" ? "Speak in your language" : "अपनी भाषा में बोलें");
        setStatusSubtext(selectedLanguage === "te-IN" ? "మైక్ బటన్ నొక్కి మాట్లాడండి" : selectedLanguage === "en-IN" ? "Tap the mic and speak" : "माइक दबाकर बोलें");
      }, 2500);
    }
  }, [sendTextToBackend, selectedLanguage]);

  const toggleRecording = useCallback(() => {
    if (appState === "listening") {
      stopListening();
    } else if (appState === "idle" || appState === "error") {
      startListening();
    }
  }, [appState, startListening, stopListening]);

  // Click a scheme category — start listening with a hint
  const handleSchemeClick = useCallback((hint: string) => {
    // Auto-send the hint text directly (user tapped a category card)
    sendTextToBackend(hint);
  }, [sendTextToBackend]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 overflow-x-hidden hide-scrollbar">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-green-300/30 rounded-full"
            style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: particle.delay }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-green-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  जन-सहायक
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Jan-Sahayak</p>
              </div>
            </motion.div>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#schemes" className="text-gray-600 hover:text-green-600 font-medium transition-colors">{t.schemes}</a>
              <a href="#features" className="text-gray-600 hover:text-green-600 font-medium transition-colors">{t.features}</a>
              <a href="/admin" className="text-gray-600 hover:text-green-600 font-medium transition-colors">Admin</a>

              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
                className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-sm font-medium text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="hi-IN">हिंदी</option>
                <option value="te-IN">తెలుగు</option>
                <option value="en-IN">English</option>
              </select>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-orange-200 flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>{t.help}</span>
              </motion.button>
            </nav>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-green-50"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-green-100"
            >
              <div className="px-4 py-4 space-y-3">
                <a href="#schemes" className="block py-2 text-gray-600 font-medium">{t.schemes}</a>
                <a href="#features" className="block py-2 text-gray-600 font-medium">{t.features}</a>
                <a href="/admin" className="block py-2 text-gray-600 font-medium">Admin Portal</a>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
                  className="w-full bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  <option value="hi-IN">हिंदी</option>
                  <option value="te-IN">తెలుగు</option>
                  <option value="en-IN">English</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Browser Compatibility Warning */}
      {!sttSupported && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 text-amber-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Voice input requires Google Chrome. Please open this page in Chrome.</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                <span>{t.tagline}</span>
              </div>

              {/* User Detected Location Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-6"
              >
                <button
                  onClick={() => requestLocation()}
                  className="bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-black/5 dark:border-white/10 flex items-center gap-3 transition-all group"
                  title="Click to refresh location"
                >
                  <div className={`flex items-center justify-center ${locationLoading ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`}>
                    {locationLoading ? (
                      <RefreshCw className="w-4 h-4 text-green-600" />
                    ) : (
                      <MapPin className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {t.yourLocation}
                    </span>
                    <span className="text-gray-900 font-bold text-base leading-none">
                      {locationLoading ? t.findingLocation : (weatherData?.current.city || (selectedLanguage === "te-IN" ? "భారతదేశం" : selectedLanguage === "hi-IN" ? "भारत" : "India"))}
                    </span>
                  </div>
                  {locationGranted && !locationLoading && (
                    <div className="ml-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </button>
              </motion.div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  {t.heroTitle1}
                </span>
                <br />
                <span className="text-gray-800">{t.heroTitle2}</span>
              </h2>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                {t.heroDesc}
                <span className="text-green-600 font-semibold"> {t.heroHighlight}</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleRecording}
                  disabled={appState === "processing"}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-green-200 flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  <Mic className="w-6 h-6" />
                  <span>{t.talkToDidi}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendTextToBackend(selectedLanguage === "te-IN" ? "Naku government schemes gurinchi cheppandi" : selectedLanguage === "en-IN" ? "Tell me about government schemes" : "Mujhe sarkari yojanaon ke baare mein batao")}
                  className="bg-white text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-green-300 flex items-center justify-center gap-3"
                >
                  <HelpCircle className="w-6 h-6" />
                  <span>{t.howToUse}</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-200">
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-green-600">50+</div>
                  <div className="text-sm text-gray-500">{t.statSchemes}</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-orange-500">3</div>
                  <div className="text-sm text-gray-500">{t.statLanguages}</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-blue-500">24/7</div>
                  <div className="text-sm text-gray-500">{t.statAvailable}</div>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Voice Assistant Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-green-100 via-white to-orange-100 rounded-3xl p-8 shadow-2xl border border-green-200/50">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl opacity-20 blur-xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full opacity-20 blur-xl" />

                <div className="relative flex flex-col items-center">
                  {/* Didi Avatar */}
                  <motion.div
                    animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
                    className={`relative rounded-full p-2 transition-all duration-500 ${isSpeaking
                      ? "ring-8 ring-orange-400 shadow-[0_0_60px_rgba(251,146,60,0.5)]"
                      : appState === "listening"
                        ? "ring-8 ring-green-400 shadow-[0_0_60px_rgba(74,222,128,0.5)]"
                        : appState === "processing"
                          ? "ring-8 ring-blue-400 shadow-[0_0_60px_rgba(96,165,250,0.5)]"
                          : appState === "error"
                            ? "ring-8 ring-red-400 shadow-[0_0_30px_rgba(248,113,113,0.4)]"
                            : "ring-4 ring-green-200 shadow-xl"
                      }`}
                  >
                    <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white">
                      <Image
                        src="/didi.svg"
                        alt="Didi Avatar"
                        width={120}
                        height={120}
                        className={`object-cover transition-transform duration-300 ${isSpeaking ? "animate-pulse scale-110" : ""}`}
                      />
                    </div>

                    {isSpeaking && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        {t.speaking}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Status Text */}
                  <motion.div
                    key={statusText}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 text-center px-2 max-w-xs"
                  >
                    <p className={`text-lg font-bold ${appState === "error" ? "text-red-600" : "text-gray-800"} leading-snug`}>
                      {statusText}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 break-words">{statusSubtext}</p>
                  </motion.div>

                  {/* Main Mic Button */}
                  <motion.button
                    whileHover={{ scale: appState === "processing" ? 1 : 1.1 }}
                    whileTap={{ scale: appState === "processing" ? 1 : 0.9 }}
                    onClick={toggleRecording}
                    disabled={appState === "processing" || appState === "speaking"}
                    className={`mt-8 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${appState === "listening"
                      ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200"
                      : appState === "processing" || appState === "speaking"
                        ? "bg-gradient-to-br from-gray-400 to-gray-500 cursor-not-allowed"
                        : appState === "error"
                          ? "bg-gradient-to-br from-orange-500 to-red-500"
                          : "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-200 hover:shadow-green-300"
                      }`}
                  >
                    {appState === "listening" ? (
                      <Square className="w-8 h-8 text-white" fill="white" />
                    ) : appState === "processing" ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : appState === "speaking" ? (
                      <Volume2 className="w-8 h-8 text-white animate-pulse" />
                    ) : appState === "error" ? (
                      <Mic className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-10 h-10 text-white" />
                    )}
                  </motion.button>

                  <p className="mt-3 text-sm font-medium text-gray-500">
                    {appState === "listening"
                      ? t.buttonStop
                      : appState === "processing"
                        ? t.buttonProcessing
                        : appState === "speaking"
                          ? t.statusSpeaking
                          : t.buttonSpeak}
                  </p>

                  {/* Sound Wave Animation during listening */}
                  {appState === "listening" && (
                    <div className="flex items-center gap-1 mt-4">
                      {[...Array(7)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ scaleY: [0.5, 2, 0.5] }}
                          transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
                          className="w-1.5 h-8 bg-green-500 rounded-full"
                        />
                      ))}
                    </div>
                  )}

                  {/* AI Response Text Bubble */}
                  <AnimatePresence>
                    {aiResponseText && appState !== "idle" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 w-full bg-white/80 rounded-2xl p-3 border border-green-100 text-sm text-gray-700 text-center"
                      >
                        <MessageSquare className="w-4 h-4 text-green-500 inline mr-1" />
                        {aiResponseText.slice(0, 120)}{aiResponseText.length > 120 ? "..." : ""}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Application Status Badge */}
                  <AnimatePresence>
                    {applicationStatus && applicationStatus !== "In Progress" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`mt-3 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 ${applicationStatus === "Submitted"
                          ? "bg-blue-100 text-blue-700"
                          : applicationStatus === "Approved"
                            ? "bg-green-100 text-green-700"
                            : applicationStatus === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Application: {applicationStatus}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Form Section */}
      <AnimatePresence>
        {extractedData && Object.keys(extractedData).length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="py-8 px-4"
          >
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    {t.liveForm}
                  </h3>
                  <p className="text-green-100 text-sm">{t.liveFormEn}</p>
                </div>

                <div className="p-6 space-y-4">
                  {Object.entries(extractedData).map(([key, value], index) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex justify-between items-center p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-green-50 border border-gray-100"
                    >
                      <span className="font-semibold text-gray-700 capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      {value ? (
                        <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{String(value)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-xl font-medium text-sm animate-pulse">
                          <Clock className="w-4 h-4" />
                          <span>Pending...</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Scheme Categories Section */}
      <section id="schemes" className="py-16 px-4 bg-gradient-to-b from-white to-green-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.schemesTitle}
              <span className="block text-lg font-normal text-gray-500 mt-2">{t.schemesTitleEn}</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t.schemesDesc}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {schemeCategories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSchemeClick(category.hint)}
                disabled={appState === "processing" || appState === "listening"}
                className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 overflow-hidden disabled:opacity-60"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">{category.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{category.nameEn}</p>
                <div className="mt-3 flex items-center justify-center text-green-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>{t.ask}</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.featuresTitle}
              <span className="block text-lg font-normal text-gray-500 mt-2">{t.featuresTitleEn}</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{feature.titleEn}</p>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-8 sm:p-12 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t.ctaTitle}</h2>
              <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
                {t.ctaDesc}
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleRecording}
                className="bg-white text-green-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl flex items-center gap-3 mx-auto"
              >
                <Mic className="w-6 h-6" />
                <span>{t.ctaButton}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t.appName}</h3>
                  <p className="text-xs text-gray-400">Jan-Sahayak</p>
                </div>
              </div>
              <p className="text-gray-400 max-w-sm">
                {t.footerDesc}
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">{t.quickLinks}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400 transition-colors">{t.homepage}</a></li>
                <li><a href="#schemes" className="hover:text-green-400 transition-colors">{t.schemes}</a></li>
                <li><a href="#features" className="hover:text-green-400 transition-colors">{t.features}</a></li>
                <li><a href="/admin" className="hover:text-green-400 transition-colors">Admin Portal</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">{t.contactUs}</h4>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>1800-XXX-XXXX (Toll Free)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>jan-sahayak.gov.in</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>{t.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Named export so page.tsx can import this for responsive layout switching
export { Home as DesktopDashboard };
