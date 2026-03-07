"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mic,
    MicOff,
    Send,
    User,
    Bot,
    CheckCircle2,
    Keyboard,
    MessageSquare,
    ClipboardList,
} from "lucide-react";
import { Language } from "../lib/translations";
import { useNavigation, SchemeContext } from "../contexts/NavigationContext";

// ==========================================
// TYPES
// ==========================================
type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

type ConversationStep =
    | "greeting"
    | "collecting_name"
    | "collecting_phone"
    | "collecting_village"
    | "collecting_aadhaar"
    | "review"
    | "submitted";

interface Message {
    id: string;
    role: "user" | "ai";
    content: string;
    timestamp: Date;
    buttons?: ActionButton[];
}

interface ActionButton {
    label: string;
    value: string;
    variant?: "primary" | "secondary" | "danger";
}

interface FormData {
    name: string;
    phone: string;
    village: string;
    aadhaar: string;
    scheme: string;
}

interface ConversationState {
    step: ConversationStep;
    selectedScheme: string | null;
}

// ==========================================
// CONSTANTS
// ==========================================
const API_BASE = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    : "http://localhost:8000";

const SCHEMES = [
    { id: "pmkisan", name: "PM Kisan", nameHi: "पीएम किसान", nameTe: "పీఎం కిసాన్", emoji: "🌾", keywords: ["pm-kisan", "kisan samman", "किसान सम्मान"] },
    { id: "pmawas", name: "PM Awas", nameHi: "पीएम आवास", nameTe: "పీఎం ఆవాస్", emoji: "🏠", keywords: ["awas yojana", "housing", "आवास योजना"] },
    { id: "pmfby", name: "Fasal Bima", nameHi: "फसल बीमा", nameTe: "ఫసల్ బీమా", emoji: "🛡️", keywords: ["crop insurance", "fasal", "फसल"] },
    { id: "kcc", name: "Kisan Credit Card", nameHi: "किसान क्रेडिट कार्ड", nameTe: "కిసాన్ క్రెడిట్ కార్డ్", emoji: "💳", keywords: ["credit card", "kcc", "क्रेडिट कार्ड"] },
    { id: "ayushman", name: "Ayushman Bharat", nameHi: "आयुष्मान भारत", nameTe: "ఆయుష్మాన్ భారత్", emoji: "🏥", keywords: ["health", "pm-jay", "आयुष्मान"] },
];

const TRANSLATIONS: Record<string, any> = {
    "hi": {
        title: "दीदी से बात करें",
        greeting: "नमस्ते! मैं दीदी हूँ — आपकी सरकारी योजना सहायक।\n\nआप मुझसे बात करके या टाइप करके सरकारी योजनाओं के बारे में जान सकते हैं।\n\nआप किस योजना के लिए मदद चाहते हैं?",
        schemeGreeting: (scheme: SchemeContext) =>
            `नमस्ते! मैं दीदी हूँ। 🙏\n\nआपने **${scheme.nameHi}** योजना के लिए आवेदन करना चाहा है।\n\n📋 **योजना का लाभ:** ${scheme.benefitHi}\n📝 **विवरण:** ${scheme.descHi}\n\nक्या आप इस योजना के लिए आवेदन करना चाहते हैं? मैं आपकी मदद करूँगी!`,
        askName: "आपका पूरा नाम क्या है?",
        askPhone: "धन्यवाद! अब आपका मोबाइल नंबर बताइए।",
        askVillage: "बहुत अच्छा! आप किस गांव में रहते हैं?",
        askAadhaar: "कृपया अपना 12 अंकों का आधार नंबर बताइए।",
        submitted: "बहुत बढ़िया! 🎉\n\nआपका आवेदन सफलतापूर्वक जमा हो गया है।",
        inputPlaceholder: "दीदी से बात करें...",
        listening: "दीदी सुन रही हैं...",
        thinking: "दीदी सोच रही हैं...",
        ready: "तैयार",
        fullName: "पूरा नाम",
        phone: "फोन",
        village: "गांव",
        aadhaar: "आधार",
        scheme: "योजना",
        micInfoTitle: "क्या मैं सुन सकती हूँ?",
        micInfoDesc: "योजनाओं के बारे में बात करने के लिए मुझे माइक्रोफ़ोन की अनुमति चाहिए।",
        micInsecureWarn: "सुरक्षित कनेक्शन (HTTPS) की आवश्यकता है।",
        allowBtn: "हाँ, अनुमति दें",
        denyBtn: "अभी नहीं",
        submit: "जमा करें",
        edit: "बदलें",
        pending: "बाकी है...",
        confirmDetails: "कृपया अपनी details चेक करें:",
        startApplication: "हाँ, आवेदन शुरू करें",
        knowMore: "और जानकारी चाहिए",
    },
    "en": {
        title: "Talk to Didi",
        greeting: "Namaste! I am Didi — your government scheme assistant.\n\nYou can talk to me or type to know about government schemes.\n\nWhich scheme would you like help with?",
        schemeGreeting: (scheme: SchemeContext) =>
            `Namaste! I am Didi. 🙏\n\nYou want to apply for **${scheme.name}** scheme.\n\n📋 **Benefit:** ${scheme.benefit}\n📝 **Description:** ${scheme.desc}\n\nWould you like to apply for this scheme? I will help you!`,
        askName: "What is your full name?",
        askPhone: "Great! Now please tell me your mobile number.",
        askVillage: "Which village do you live in?",
        askAadhaar: "Please tell me your 12-digit Aadhaar number.",
        submitted: "Success! 🎉\n\nYour application has been submitted.",
        inputPlaceholder: "Talk to Didi...",
        listening: "Didi is listening...",
        thinking: "Didi is thinking...",
        ready: "Ready",
        fullName: "Full Name",
        phone: "Phone",
        village: "Village",
        aadhaar: "Aadhaar",
        scheme: "Scheme",
        micInfoTitle: "Can I listen to you?",
        micInfoDesc: "I need microphone access to understand you.",
        micInsecureWarn: "Secure connection (HTTPS) required.",
        allowBtn: "Yes, Allow Mic",
        denyBtn: "Not Now",
        submit: "Submit",
        edit: "Edit",
        pending: "Pending...",
        confirmDetails: "Please verify these details:",
        startApplication: "Yes, Start Application",
        knowMore: "Know More",
    },
    "te": {
        title: "దీదీతో మాట్లాడండి",
        greeting: "నమస్కారం! నేను దీదీని — మీ ప్రభుత్వ పథక సహాయకురాలిని.\n\nప్రభుత్వ పథకాల గురించి మాట్లాడటానికి లేదా టైప్ చేయడానికి అడగండి.\n\nమీకు ఏ పథకంలో సహాయం కావాలి?",
        schemeGreeting: (scheme: SchemeContext) =>
            `నమస్కారం! నేను దీదీని. 🙏\n\nమీరు **${scheme.name}** పథకం కోసం దరఖాస్తు చేయాలనుకుంటున్నారు.\n\n📋 **లాభం:** ${scheme.benefit}\n📝 **వివరణ:** ${scheme.desc}\n\nఈ పథకం కోసం దరఖాస్తు చేయాలనుకుంటున్నారా? నేను మీకు సహాయం చేస్తాను!`,
        askName: "మీ పూర్తి పేరు ఏమిటి?",
        askPhone: "ధన్యవాదాలు! ఇప్పుడు మీ మొబైల్ నంబర్ చెప్పండి.",
        askVillage: "మీ గ్రామం పేరు ఏమిటి?",
        askAadhaar: "దయచేసి మీ 12 అంకెల ఆధార్ నంబర్ చెప్పండి.",
        submitted: "అద్భుతం! 🎉\n\nమీ దరఖాస్తు విజయవంతంగా సమర్పించబడింది.",
        inputPlaceholder: "దీదీతో మాట్లాడండి...",
        listening: "దీదీ వింటున్నారు...",
        thinking: "దీదీ ఆలోచిస్తోంది...",
        ready: "సిద్ధంగా ఉంది",
        fullName: "పూర్తి పేరు",
        phone: "ఫోన్",
        village: "గ్రామం",
        aadhaar: "ఆధార్",
        scheme: "పథకం",
        micInfoTitle: "నేను వినవచ్చా?",
        micInfoDesc: "మీ మాటలు అర్థం చేసుకోవడానికి మైక్రోఫోన్ అనుమతి నాకు కావాలి.",
        micInsecureWarn: "సురక్షిత కనెక్షన్ (HTTPS) అవసరం.",
        allowBtn: "అనుమతించు",
        denyBtn: "వద్దు",
        submit: "సమర్పించు",
        edit: "మార్చు",
        pending: "పెండింగ్...",
        confirmDetails: "వివరాలను ధృవీకరించండి:",
        startApplication: "అవును, దరఖాస్తు ప్రారంభించండి",
        knowMore: "మరింత తెలుసుకోండి",
    }
};

// ==========================================
// SUB-COMPONENTS
// ==========================================

const SmallVoiceWave = () => (
    <div className="flex items-center gap-1 h-5 px-1">
        {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
                key={i}
                animate={{
                    height: [6, 16, 6],
                }}
                transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                }}
                className="w-0.5 bg-emerald-500 rounded-full"
            />
        ))}
    </div>
);

const VoiceWaves = ({ isListening }: { isListening: boolean }) => (
    <div className="absolute inset-0 flex justify-center items-center pointer-events-none overflow-hidden">
        <AnimatePresence>
            {isListening && (
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Concentric Pulsing Rings */}
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={`ring-${i}`}
                            initial={{ opacity: 0, scale: 1 }}
                            animate={{
                                opacity: [0, 0.4, 0],
                                scale: [1, 2.2],
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: i * 0.8,
                                ease: "easeOut"
                            }}
                            className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-[2.8rem] border border-emerald-400/30 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
                        />
                    ))}

                    {/* Neat Side Arcs */}
                    <div className="absolute flex gap-32 sm:gap-40 items-center justify-center">
                        <motion.div
                            animate={{
                                x: [-5, -15, -5],
                                opacity: [0.4, 1, 0.4],
                                scaleY: [0.8, 1.1, 0.8]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="w-12 h-24 sm:w-16 sm:h-32 border-l-2 border-emerald-400/40 rounded-l-[5rem] bg-gradient-to-r from-emerald-400/5 to-transparent blur-[0.5px]"
                        />
                        <motion.div
                            animate={{
                                x: [5, 15, 5],
                                opacity: [0.4, 1, 0.4],
                                scaleY: [0.8, 1.1, 0.8]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                            className="w-12 h-24 sm:w-16 sm:h-32 border-r-2 border-emerald-400/40 rounded-r-[5rem] bg-gradient-to-l from-emerald-400/5 to-transparent blur-[0.5px]"
                        />
                    </div>
                </div>
            )}
        </AnimatePresence>
    </div>
);

const ActionButtons = ({ buttons, onSelect }: { buttons: ActionButton[]; onSelect: (value: string) => void }) => (
    <div className="flex flex-wrap gap-2 mt-4">
        {buttons.map((btn, i) => (
            <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(btn.value)}
                className={`px-6 py-2.5 rounded-2xl text-sm font-black tracking-wide transition-all shadow-md active:translate-y-0.5 ${btn.variant === "primary"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-100"
                    }`}
            >
                {btn.label}
            </motion.button>
        ))}
    </div>
);

const MessageBubble = ({ message, lang, onButtonClick }: {
    message: Message;
    lang: string;
    onButtonClick?: (value: string) => void;
}) => {
    const isAi = message.role === "ai";
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex w-full mb-8 ${isAi ? "justify-start" : "justify-end"}`}
        >
            <div className={`flex flex-col max-w-[90%] sm:max-w-[75%] gap-1.5 ${isAi ? "items-start" : "items-end"}`}>
                <div className="flex items-center gap-2 px-2 mb-0.5">
                    <div className={`w-7 h-7 rounded-2xl flex items-center justify-center shadow-sm ${isAi ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                        }`}>
                        {isAi ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        {isAi ? "AI DIDI" : (lang === "hi" ? "आप" : "YOU")}
                    </span>
                    <span className="text-[10px] text-gray-300 font-bold ml-1 opacity-60">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className={`px-5 py-4 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border transition-all duration-300 ${isAi
                    ? "bg-white border-gray-50 text-gray-800 rounded-tl-none leading-relaxed"
                    : "bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-500 text-white rounded-tr-none font-bold shadow-emerald-200/50"
                    }`}>
                    <p className="text-[16px] whitespace-pre-wrap">{message.content}</p>
                    {message.buttons && <ActionButtons buttons={message.buttons} onSelect={onButtonClick || (() => { })} />}
                </div>
            </div>
        </motion.div>
    );
};

const MicPermissionCard = ({ onAllow, onDeny, t }: { onAllow: () => void; onDeny: () => void; t: any }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white border border-emerald-50 rounded-[2rem] shadow-2xl p-6 overflow-hidden relative"
        >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-50 rounded-full opacity-40" />
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4 transform -rotate-3">
                    <Mic size={32} />
                </div>
                <h4 className="text-gray-900 font-black text-xl mb-2">{t.micInfoTitle}</h4>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 px-4">
                    {t.micInfoDesc}
                </p>
                <div className="flex gap-3 w-full">
                    <button
                        onClick={onAllow}
                        className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-200 active:translate-y-0.5 transition-all"
                    >
                        {t.allowBtn}
                    </button>
                    <button
                        onClick={onDeny}
                        className="flex-1 py-4 text-gray-400 hover:text-gray-600 text-sm font-black transition-all"
                    >
                        {t.denyBtn}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const FormCard = ({ data, currentField, t }: { data: FormData; currentField?: string; t: any }) => {
    const fields = [
        { label: t.fullName, key: "name", value: data.name, icon: "👤" },
        { label: t.phone, key: "phone", value: data.phone, icon: "📞" },
        { label: t.village, key: "village", value: data.village, icon: "🏠" },
        { label: t.aadhaar, key: "aadhaar", value: data.aadhaar ? `XXXX XXXX ${data.aadhaar.slice(-4)}` : "", icon: "🆔" },
        { label: t.scheme, key: "scheme", value: data.scheme, icon: "🌾" }
    ];

    const filledFields = fields.filter(f => f.value);
    const activeField = fields.find(f => f.key === currentField);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-lg p-5 overflow-hidden"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <ClipboardList size={20} />
                </div>
                <div>
                    <h4 className="text-slate-900 font-black text-sm">Application Progress</h4>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{filledFields.length} of {fields.length} completed</p>
                </div>
            </div>

            <div className="space-y-2">
                {fields.map((f) => {
                    const isActive = currentField === f.key;
                    const hasValue = !!f.value;
                    return (
                        <div
                            key={f.key}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive
                                ? "bg-emerald-50 border border-emerald-200"
                                : hasValue
                                    ? "bg-slate-50 border border-transparent"
                                    : "bg-slate-50/50 border border-transparent opacity-50"
                                }`}
                        >
                            <span className="text-lg">{f.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{f.label}</p>
                                <p className={`text-sm font-bold truncate ${f.value ? "text-slate-800" : "text-slate-300"}`}>
                                    {f.value || t.pending}
                                </p>
                            </div>
                            {hasValue && (
                                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                            )}
                            {isActive && !hasValue && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="w-2 h-2 bg-emerald-500 rounded-full"
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function VoiceAssistantScreen({ lang }: { lang: Language }) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    const { schemeContext, setSchemeContext } = useNavigation();

    const [voiceState, setVoiceState] = useState<VoiceState>("idle");
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [transcript, setTranscript] = useState("");
    const [showMicGuard, setShowMicGuard] = useState(false);
    const [initializedWithScheme, setInitializedWithScheme] = useState(false);

    const [convState, setConvState] = useState<ConversationState>({
        step: "greeting",
        selectedScheme: null,
    });
    const [showTextInput, setShowTextInput] = useState(false);
    /** Form shows ONLY when AI confirmed user wants to apply and is asking for details */
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        name: "", phone: "", village: "", aadhaar: "", scheme: ""
    });

    const deviceIdRef = useRef<string>(
        typeof window !== "undefined" && typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `device-${Date.now()}`
    );

    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Greeting - handles both regular and scheme-based greetings
    useEffect(() => {
        if (schemeContext && !initializedWithScheme) {
            const schemeName = lang === "hi" ? schemeContext.nameHi : schemeContext.name;
            setFormData(prev => ({ ...prev, scheme: schemeName }));
            setConvState(prev => ({ ...prev, selectedScheme: schemeContext.id }));
            setInitializedWithScheme(true);
            setSchemeContext(null);
            const applyText = lang === "hi"
                ? `मुझे ${schemeName} योजना के लिए आवेदन करना है`
                : `I want to apply for ${schemeName} scheme`;
            addMessage("user", applyText);
            setVoiceState("processing");
            (async () => {
                try {
                    const res = await fetch(`${API_BASE}/api/v1/process-text`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            text: applyText,
                            user_id: deviceIdRef.current,
                            language: lang === "hi" ? "hi-IN" : lang === "te" ? "te-IN" : "en-IN",
                        }),
                    });
                    const data = await res.json();
                    const extracted = data.extracted_data || {};
                    setFormData(prev => ({
                        name: extracted.name ?? prev.name,
                        phone: extracted.phone ?? prev.phone,
                        village: extracted.village ?? prev.village,
                        aadhaar: extracted.aadhaar ?? prev.aadhaar,
                        scheme: extracted.scheme ?? prev.scheme,
                    }));
                    if (data.show_form) setShowForm(true);
                    const filled = [extracted.name, extracted.phone, extracted.village, extracted.aadhaar, extracted.scheme].filter(Boolean).length;
                    const nextStep = filled >= 5 ? "review" : filled >= 4 ? "collecting_aadhaar" : filled >= 3 ? "collecting_village" : filled >= 2 ? "collecting_phone" : filled >= 1 ? "collecting_phone" : "collecting_name";
                    setConvState(prev => ({ ...prev, step: nextStep }));
                    addMessage("ai", data.ai_response || t.askName);
                } catch {
                    addMessage("ai", t.askName);
                } finally {
                    setVoiceState("idle");
                }
            })();
        } else if (!schemeContext && !initializedWithScheme && messages.length === 0) {
            setMessages([{
                id: "initial-greeting",
                role: "ai",
                content: t.greeting,
                timestamp: new Date()
            }]);
        }
    }, [schemeContext, initializedWithScheme, messages.length, setSchemeContext, lang, t]);

    useEffect(() => {
        // Use setTimeout to ensure DOM is fully rendered before scrolling
        const timer = setTimeout(() => {
            if (messagesEndRef.current && document.body.contains(messagesEndRef.current)) {
                try {
                    messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
                } catch (e) {
                    // Silently handle scroll errors
                }
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, transcript]);

    const addMessage = (role: "user" | "ai", content: string, buttons?: ActionButton[]) => {
        setMessages(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            role, content, timestamp: new Date(), buttons
        }]);
    };

    const startSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            addMessage("ai", "Speech recognition not supported.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = lang === "hi" ? "hi-IN" : lang === "te" ? "te-IN" : "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setVoiceState("listening");
            setTranscript("");
        };

        recognition.onresult = (event: any) => {
            let fullContent = "";
            for (let i = 0; i < event.results.length; ++i) {
                fullContent += event.results[i][0].transcript;
            }
            setTranscript(fullContent);
        };

        recognition.onerror = (e: any) => {
            if (e.error !== 'no-speech') {
                console.error("Speech Error:", e);
                setVoiceState("idle");
            }
        };

        recognition.onend = () => { };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const toggleMic = async () => {
        if (voiceState === "listening") {
            const final = transcript.trim();
            recognitionRef.current?.stop();
            setVoiceState("idle");
            if (final) {
                processUserInput(final);
            } else {
                setTranscript("");
            }
        } else {
            if (typeof navigator !== "undefined" && (navigator as any).permissions) {
                try {
                    const result = await (navigator as any).permissions.query({ name: "microphone" });
                    if (result.state === "granted") {
                        startSpeechRecognition();
                        return;
                    }
                } catch (e) { }
            }
            setShowMicGuard(true);
        }
    };

    const handleAllowMic = async () => {
        setShowMicGuard(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            startSpeechRecognition();
        } catch (e: any) {
            addMessage("ai", "Microphone access denied.");
        }
    };

    const processUserInput = async (text: string) => {
        if (!text.trim()) return;

        // Edit button: reset to name collection (frontend-only)
        if (text === "edit_form") {
            setFormData({ name: "", phone: "", village: "", aadhaar: "", scheme: formData.scheme || "" });
            setConvState(prev => ({ ...prev, step: "collecting_name" }));
            addMessage("ai", t.askName);
            return;
        }

        addMessage("user", text);
        setInputText("");
        setTranscript("");
        setVoiceState("processing");

        try {
            const userId = deviceIdRef.current;
            const langCode = lang === "hi" ? "hi-IN" : lang === "te" ? "te-IN" : "en-IN";

            const res = await fetch(`${API_BASE}/api/v1/process-text`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: text === "submit_now" ? "submit" : text,
                    user_id: userId,
                    language: langCode,
                }),
            });

            const data = await res.json();
            const aiResponse = data.ai_response || (data.status === "error" ? "Something went wrong. Please try again." : "");
            const extracted = data.extracted_data || {};
            const appStatus = data.application_status || "In Progress";

            setFormData(prev => ({
                name: extracted.name ?? prev.name,
                phone: extracted.phone ?? prev.phone,
                village: extracted.village ?? prev.village,
                aadhaar: extracted.aadhaar ?? prev.aadhaar,
                scheme: extracted.scheme ?? prev.scheme,
            }));

            const merged = { ...formData, ...extracted };
            const filled = [merged.name, merged.phone, merged.village, merged.aadhaar, merged.scheme].filter(Boolean).length;
            if (appStatus === "Submitted") {
                setConvState(prev => ({ ...prev, step: "submitted" }));
                addMessage("ai", aiResponse || t.submitted);
            } else if (filled >= 5) {
                setConvState(prev => ({ ...prev, step: "review" }));
                addMessage("ai", aiResponse || t.confirmDetails, [
                    { label: t.submit, value: "submit_now", variant: "primary" },
                    { label: t.edit, value: "edit_form", variant: "secondary" }
                ]);
            } else {
                const nextStep = !merged.name ? "collecting_name" : !merged.phone ? "collecting_phone" : !merged.village ? "collecting_village" : !merged.aadhaar ? "collecting_aadhaar" : "collecting_scheme";
                setConvState(prev => ({ ...prev, step: nextStep }));
                addMessage("ai", aiResponse);
            }
        } catch (err) {
            console.error("process-text error:", err);
            addMessage("ai", lang === "hi" ? "कनेक्शन में समस्या। कृपया फिर से कोशिश करें।" : "Connection error. Please try again.");
        } finally {
            setVoiceState("idle");
        }
    };

    const handleSend = () => {
        if (inputText.trim()) processUserInput(inputText);
    };

    const isListening = voiceState === "listening";

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-adjust height for textarea
    useEffect(() => {
        if (textareaRef.current && document.body.contains(textareaRef.current)) {
            try {
                textareaRef.current.style.height = 'auto'; // Reset for recalculation
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
            } catch (e) {
                // Silently handle resize errors
            }
        }
    }, [inputText, transcript, isListening]);

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden font-sans selection:bg-emerald-100">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 scrollbar-hide">
                <AnimatePresence mode="popLayout" initial={false}>
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} lang={lang} onButtonClick={(val) => processUserInput(val)} />
                    ))}
                </AnimatePresence>

                <AnimatePresence>
                    {showMicGuard && (
                        <div className="flex justify-center py-6">
                            <MicPermissionCard onAllow={handleAllowMic} onDeny={() => setShowMicGuard(false)} t={t} />
                        </div>
                    )}
                </AnimatePresence>

                {showForm && (
                    <motion.div layout className="flex justify-start py-4">
                        <FormCard data={formData} currentField={convState.step.replace("collecting_", "")} t={t} />
                    </motion.div>
                )}

                {voiceState === "processing" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start pl-4">
                        <div className="bg-emerald-50 px-6 py-4 rounded-3xl border border-emerald-100 flex gap-2 items-center">
                            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2.5 h-2.5 bg-emerald-600 rounded-full shadow-[0_0_10px_rgba(5,150,105,0.4)]" />
                            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-2.5 h-2.5 bg-emerald-600 rounded-full shadow-[0_0_10px_rgba(5,150,105,0.4)]" />
                            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-2.5 h-2.5 bg-emerald-600 rounded-full shadow-[0_0_10px_rgba(5,150,105,0.4)]" />
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">{t.thinking}</span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} className="h-12 sm:h-20" />
            </div>

            {/* Centered Voice/Text Interface */}
            <div className="bg-white/95 backdrop-blur-xl px-6 pt-2 pb-6 z-50 relative border-t border-slate-100/50">
                <div className="max-w-4xl mx-auto flex flex-col items-center">

                    {/* Suggestions (Only in Home/Greeting state) */}
                    <AnimatePresence>
                        {!showForm && messages.length <= 2 && !isListening && !showTextInput && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full flex gap-2 overflow-x-auto pb-4 no-scrollbar justify-start md:justify-center mb-1 px-6"
                            >
                                {SCHEMES.map(s => (
                                    <motion.button
                                        key={s.id}
                                        whileHover={{ y: -2, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => processUserInput(s.name)}
                                        className="flex-shrink-0 whitespace-nowrap bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-[11px] font-black text-slate-800 shadow-sm hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-emerald-500/10 transition-all flex items-center gap-2"
                                    >
                                        <span className="text-sm">{s.emoji}</span>
                                        {lang === 'hi' ? s.nameHi : lang === 'te' ? s.nameTe : s.name}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        {showTextInput ? (
                            <motion.div
                                key="text-input"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="w-full flex items-end gap-3 bg-white border border-slate-200 rounded-[2.5rem] p-3 shadow-2xl shadow-slate-200/50 group focus-within:border-emerald-500 focus-within:shadow-xl focus-within:shadow-emerald-500/5 transition-all"
                            >
                                <button
                                    onClick={() => setShowTextInput(false)}
                                    className="w-14 h-14 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-3xl flex items-center justify-center transition-all active:scale-90 border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm"
                                >
                                    <MessageSquare size={22} />
                                </button>
                                <textarea
                                    ref={textareaRef}
                                    rows={1}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder={t.inputPlaceholder}
                                    className="flex-1 bg-transparent text-base font-black text-slate-800 focus:outline-none resize-none py-4 px-2 custom-scrollbar"
                                />
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleSend}
                                    disabled={!inputText.trim()}
                                    className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all shadow-xl ${inputText.trim() ? "bg-emerald-600 text-white shadow-emerald-200" : "bg-slate-100 text-slate-300"}`}
                                >
                                    <Send size={22} />
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="voice-input"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative flex flex-col items-center gap-3 w-full"
                            >
                                <div className="relative flex items-center justify-center h-32 sm:h-40 w-full lg:-mt-6">
                                    <VoiceWaves isListening={isListening} />

                                    <motion.button
                                        layoutId="mic-button"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={toggleMic}
                                        className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-[2.8rem] flex items-center justify-center transition-all shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] ${isListening
                                            ? "bg-red-500 text-white ring-[14px] ring-red-50 shadow-red-200"
                                            : "bg-emerald-600 text-white ring-[14px] ring-emerald-50 shadow-emerald-200"
                                            }`}
                                    >
                                        <AnimatePresence mode="wait">
                                            {isListening ? (
                                                <motion.div key="stop" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                    <MicOff size={36} strokeWidth={2.5} />
                                                </motion.div>
                                            ) : (
                                                <motion.div key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                    <Mic size={40} strokeWidth={2.5} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Listening Pulsing Core */}
                                        {isListening && (
                                            <motion.div
                                                className="absolute inset-0 rounded-[2.8rem] border-4 border-white/30"
                                                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                            />
                                        )}
                                    </motion.button>

                                    {/* Text Toggle Button */}
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => setShowTextInput(true)}
                                        className="absolute right-0 sm:right-[15%] lg:right-[25%] w-14 h-14 bg-white text-slate-400 hover:text-emerald-600 rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 active:scale-90 transition-all group"
                                        title="Switch to Typing"
                                    >
                                        <Keyboard size={28} className="group-hover:rotate-12 transition-transform" />
                                        <span className="absolute bottom-full mb-3 bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">TYPE NOW</span>
                                    </motion.button>
                                </div>

                                <div className="flex flex-col items-center gap-1.5">
                                    <motion.p
                                        animate={isListening ? { opacity: [0.5, 1, 0.5] } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]"
                                    >
                                        {isListening ? t.listening : (lang === "hi" ? "बात करने के लिए बटन दबाएं" : "TAP TO SPEAK")}
                                    </motion.p>

                                    <AnimatePresence>
                                        {isListening && transcript && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className="bg-white/80 backdrop-blur-md border border-emerald-100 px-8 py-4 rounded-[2rem] max-w-lg text-center shadow-xl shadow-emerald-500/5 mt-2"
                                            >
                                                <p className="text-base font-black text-slate-900 leading-relaxed italic">
                                                    "{transcript}"
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style jsx>{`
                .pulse-subtle {
                    animation: pulse-border 2s infinite;
                }
                @keyframes pulse-border {
                    0% { border-color: rgba(16, 185, 129, 0.5); }
                    50% { border-color: rgba(16, 185, 129, 1); }
                    100% { border-color: rgba(16, 185, 129, 0.5); }
                }
            `}</style>
        </div>
    );
}
