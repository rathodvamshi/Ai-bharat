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

const VoiceWave = () => (
    <div className="flex items-center gap-1.5 h-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <motion.div
                key={i}
                animate={{
                    height: [12, 32, 12],
                    opacity: [0.6, 1, 0.6],
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                }}
                className="w-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            />
        ))}
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl border border-emerald-50 overflow-hidden"
        >
            <div className="bg-emerald-600 px-6 py-5 flex items-center justify-between">
                <div>
                    <h3 className="text-white font-black text-lg tracking-tight">Application Live</h3>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Status Tracking</p>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full border border-white/20">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest animate-pulse">Live</span>
                </div>
            </div>
            <div className="p-5 space-y-4 bg-gray-50/50">
                {fields.map((f) => {
                    const isActive = currentField === f.key;
                    return (
                        <div key={f.key} className={`flex items-center gap-4 p-4 rounded-3xl transition-all duration-500 ${isActive ? "bg-white border-2 border-emerald-500 shadow-xl shadow-emerald-600/5 -translate-y-1 scale-[1.02]" : "bg-white border border-gray-100 shadow-sm opacity-60"}`}>
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-colors ${isActive ? "bg-emerald-100 text-emerald-600" : "bg-gray-100"}`}>
                                {f.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">{f.label}</p>
                                <p className={`text-sm font-black truncate transition-colors ${f.value ? "text-gray-900" : "text-gray-300 italic"}`}>{f.value || t.pending}</p>
                            </div>
                            {f.value && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={14} />
                                </motion.div>
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

    const [formData, setFormData] = useState<FormData>({
        name: "", phone: "", village: "", aadhaar: "", scheme: ""
    });

    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Greeting - handles both regular and scheme-based greetings
    useEffect(() => {
        // If we have a scheme context and haven't initialized with it yet
        if (schemeContext && !initializedWithScheme) {
            const schemeName = lang === "hi" ? schemeContext.nameHi : schemeContext.name;
            const schemeBenefit = lang === "hi" ? schemeContext.benefitHi : schemeContext.benefit;
            const schemeDesc = lang === "hi" ? schemeContext.descHi : schemeContext.desc;
            
            // Set the scheme in form data
            setFormData(prev => ({
                ...prev,
                scheme: schemeName
            }));
            
            setConvState(prev => ({
                ...prev,
                selectedScheme: schemeContext.id
            }));
            
            // Auto-send user message and Didi's response
            const userMessage: Message = {
                id: "auto-user-apply",
                role: "user",
                content: lang === "hi" 
                    ? `मुझे ${schemeName} योजना के लिए आवेदन करना है`
                    : `I want to apply for ${schemeName} scheme`,
                timestamp: new Date()
            };
            
            const didiResponse: Message = {
                id: "auto-didi-response",
                role: "ai",
                content: lang === "hi"
                    ? `बहुत अच्छा! 🎉 आप **${schemeName}** के लिए आवेदन करना चाहते हैं।\n\n📋 **लाभ:** ${schemeBenefit}\n📝 **विवरण:** ${schemeDesc}\n\nचलिए आवेदन शुरू करते हैं! 📝\n\n${t.askName}`
                    : `Great! 🎉 You want to apply for **${schemeName}**.\n\n📋 **Benefit:** ${schemeBenefit}\n📝 **Description:** ${schemeDesc}\n\nLet's start the application! 📝\n\n${t.askName}`,
                timestamp: new Date()
            };
            
            setMessages([userMessage, didiResponse]);
            setConvState(prev => ({ ...prev, step: "collecting_name" }));
            setInitializedWithScheme(true);
            
            // Clear scheme context after using it
            setSchemeContext(null);
        } else if (!schemeContext && !initializedWithScheme && messages.length === 0) {
            // Regular greeting without scheme
            setMessages([{
                id: "initial-greeting",
                role: "ai",
                content: t.greeting,
                timestamp: new Date()
            }]);
        }
    }, [schemeContext, lang, t, initializedWithScheme, messages.length, setSchemeContext]);

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

    const processUserInput = (text: string) => {
        if (!text.trim()) return;
        addMessage("user", text);
        setInputText("");
        setTranscript("");
        setVoiceState("processing");

        setTimeout(() => {
            setVoiceState("idle");
            const lowerText = text.toLowerCase();

            // Handle start application button from scheme context
            if (text === "start_application") {
                setConvState(prev => ({ ...prev, step: "collecting_name" }));
                const schemeName = schemeContext
                    ? (lang === "hi" ? schemeContext.nameHi : schemeContext.name)
                    : formData.scheme;
                addMessage("ai", lang === 'hi'
                    ? `बहुत अच्छा! चलिए ${schemeName} के लिए आवेदन शुरू करते हैं। 📝\n\n${t.askName}`
                    : lang === 'te'
                        ? `చాలా మంచిది! ${schemeName} కోసం దరఖాస్తు ప్రారంభిద్దాం. 📝\n\n${t.askName}`
                        : `Great! Let's start the application for ${schemeName}. 📝\n\n${t.askName}`);
                return;
            }

            // Handle know more button from scheme context
            if (text === "know_more") {
                const schemeName = schemeContext
                    ? (lang === "hi" ? schemeContext.nameHi : schemeContext.name)
                    : formData.scheme;
                const schemeBenefit = schemeContext
                    ? (lang === "hi" ? schemeContext.benefitHi : schemeContext.benefit)
                    : "";
                const schemeDesc = schemeContext
                    ? (lang === "hi" ? schemeContext.descHi : schemeContext.desc)
                    : "";

                addMessage("ai", lang === 'hi'
                    ? `**${schemeName}** के बारे में अधिक जानकारी:\n\n🎯 **लाभ:** ${schemeBenefit}\n📋 **विवरण:** ${schemeDesc}\n\n**पात्रता:**\n• भारतीय नागरिक होना चाहिए\n• आधार कार्ड अनिवार्य\n• बैंक खाता होना चाहिए\n\n**आवश्यक दस्तावेज:**\n• आधार कार्ड\n• बैंक पासबुक\n• मोबाइल नंबर\n\nक्या आप अभी आवेदन करना चाहते हैं?`
                    : lang === 'te'
                        ? `**${schemeName}** గురించి మరింత సమాచారం:\n\n🎯 **లాభం:** ${schemeBenefit}\n📋 **వివరణ:** ${schemeDesc}\n\n**అర్హత:**\n• భారతీయ పౌరుడు అయి ఉండాలి\n• ఆధార్ కార్డు తప్పనిసరి\n• బ్యాంకు ఖాతా ఉండాలి\n\n**అవసరమైన పత్రాలు:**\n• ఆధార్ కార్డు\n• బ్యాంకు పాస్‌బుక్\n• మొబైల్ నంబర్\n\nమీరు ఇప్పుడు దరఖాస్తు చేయాలనుకుంటున్నారా?`
                        : `More information about **${schemeName}**:\n\n🎯 **Benefit:** ${schemeBenefit}\n📋 **Description:** ${schemeDesc}\n\n**Eligibility:**\n• Must be Indian citizen\n• Aadhaar card mandatory\n• Must have bank account\n\n**Required Documents:**\n• Aadhaar Card\n• Bank Passbook\n• Mobile Number\n\nWould you like to apply now?`,
                    [
                        { label: t.startApplication || "Start Application", value: "start_application", variant: "primary" },
                    ]);
                return;
            }

            if (convState.step === "greeting") {
                const foundScheme = SCHEMES.find(s =>
                    lowerText.includes(s.name.toLowerCase()) ||
                    s.keywords.some(k => lowerText.includes(k.toLowerCase()))
                );
                if (foundScheme) {
                    setFormData(prev => ({ ...prev, scheme: foundScheme.name }));
                    setConvState(prev => ({ ...prev, step: "collecting_name" }));
                    addMessage("ai", lang === 'hi' ? `अरे वाह! आप ${foundScheme.name} के लिए आवेदन करना चाहते हैं। ${t.askName}` : lang === 'te' ? `చాలా మంచిది! మీరు ${foundScheme.name} కోసం దరఖాస్తు చేయాలనుకుంటున్నారు. ${t.askName}` : `Great! You want to apply for ${foundScheme.name}. ${t.askName}`);
                } else {
                    setConvState(prev => ({ ...prev, step: "collecting_name" }));
                    addMessage("ai", t.askName);
                }
            } else if (convState.step === "collecting_name") {
                setFormData(prev => ({ ...prev, name: text }));
                setConvState(prev => ({ ...prev, step: "collecting_phone" }));
                addMessage("ai", t.askPhone);
            } else if (convState.step === "collecting_phone") {
                setFormData(prev => ({ ...prev, phone: text }));
                setConvState(prev => ({ ...prev, step: "collecting_village" }));
                addMessage("ai", t.askVillage);
            } else if (convState.step === "collecting_village") {
                setFormData(prev => ({ ...prev, village: text }));
                setConvState(prev => ({ ...prev, step: "collecting_aadhaar" }));
                addMessage("ai", t.askAadhaar);
            } else if (convState.step === "collecting_aadhaar") {
                setFormData(prev => ({ ...prev, aadhaar: text }));
                setConvState(prev => ({ ...prev, step: "review" }));
                addMessage("ai", t.confirmDetails, [
                    { label: t.submit, value: "submit_now", variant: "primary" },
                    { label: t.edit, value: "edit_form", variant: "secondary" }
                ]);
            } else if (text.toLowerCase().includes("submit") || text === "submit_now") {
                setConvState(prev => ({ ...prev, step: "submitted" }));
                addMessage("ai", t.submitted);
            } else {
                addMessage("ai", lang === 'hi' ? "ठीक है। क्या आप कुछ और पूछना चाहते हैं?" : lang === 'te' ? "సరే. మీరు ఇంకేదైనా అడగాలనుకుంటున్నారా?" : "Okay. Do you want to ask anything else?");
            }
        }, 1200);
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
            <div className="flex-1 overflow-y-auto px-6 py-10 space-y-8 scrollbar-hide">
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

                {convState.step !== "greeting" && convState.step !== "submitted" && (
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
                <div ref={messagesEndRef} className="h-40" />
            </div>

            {/* Bottom Input Area */}
            <div className="bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-4 pt-4 pb-8 shadow-[0_-15px_50px_rgba(0,0,0,0.05)] z-50 relative">
                {/* Listening Glow Line */}
                <AnimatePresence>
                    {isListening && (
                        <motion.div
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            exit={{ opacity: 0, scaleX: 0 }}
                            className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-white to-emerald-500 origin-center"
                        />
                    )}
                </AnimatePresence>

                {/* Suggestions Carousel */}
                {convState.step === "greeting" && messages.length <= 1 && !isListening && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 mb-4 overflow-x-auto pb-2 no-scrollbar px-1"
                    >
                        {SCHEMES.map(s => (
                            <motion.button
                                key={s.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                onClick={() => processUserInput(s.name)}
                                className="whitespace-nowrap bg-white border-2 border-gray-100 px-5 py-3 rounded-xl text-[13px] font-black text-gray-800 shadow-md hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-emerald-50 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <span className="text-base">{s.emoji}</span>
                                {lang === 'hi' ? s.nameHi : lang === 'te' ? s.nameTe : s.name}
                            </motion.button>
                        ))}
                    </motion.div>
                )}

                <div className="flex items-end gap-3 max-w-5xl mx-auto min-h-[4rem]">
                    {/* Microphone Button (Compact) */}
                    <motion.button
                        layout
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleMic}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl flex-shrink-0 z-20 relative overflow-hidden mb-0.5 ${isListening ? "bg-red-500 text-white shadow-red-200 ring-4 ring-red-50" : "bg-emerald-600 text-white shadow-emerald-200 ring-4 ring-emerald-50"}`}
                    >
                        {isListening ? <MicOff size={24} strokeWidth={2.5} /> : <Mic size={26} strokeWidth={2.5} />}
                    </motion.button>

                    {/* Integrated Input Area (Flex height) */}
                    <motion.div
                        layout
                        className={`flex-1 relative group min-h-[3.5rem] rounded-2xl border-2 transition-all duration-500 flex items-end px-4 gap-3 py-1 ${isListening ? "bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/5 pulse-subtle" : "bg-gray-50 border-transparent shadow-inner"}`}
                    >
                        {/* Didi Icon + Frequency (Sticky to bottom of input) */}
                        <AnimatePresence>
                            {isListening && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10, scale: 0.5 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -10, scale: 0.5 }}
                                    className="flex items-center gap-2 flex-shrink-0 mb-3"
                                >
                                    <div className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md">
                                        <Bot size={18} />
                                    </div>
                                    <SmallVoiceWave />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={isListening ? transcript : inputText}
                            onChange={(e) => {
                                if (!isListening) {
                                    setInputText(e.target.value);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (!isListening && e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={isListening ? "" : t.inputPlaceholder}
                            readOnly={isListening}
                            className={`flex-1 bg-transparent text-[16px] font-black focus:outline-none transition-all resize-none py-3.5 scrollbar-hide block ${isListening ? "text-emerald-900 placeholder:text-emerald-300" : "text-gray-900 placeholder:text-gray-300"}`}
                        />

                        {/* Send Button (Floating on bottom right) */}
                        <AnimatePresence>
                            {!isListening && inputText.trim() !== "" && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={handleSend}
                                    className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-xl shadow-lg active:scale-95 flex-shrink-0 mb-1.5"
                                >
                                    <Send size={18} />
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* Stop Label (Floating in pod) */}
                        <AnimatePresence>
                            {isListening && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={toggleMic}
                                    className="bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-red-600 active:scale-95 mb-3"
                                >
                                    Stop
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>
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
