"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
    HelpCircle,
    FileCheck,
    Upload,
    Volume2,
    VolumeX,
} from "lucide-react";
import { useNavigation, SchemeContext } from "../contexts/NavigationContext";
import ApplicationSuccessCard from "./ApplicationSuccessCard";

// ==========================================
// TYPES
// ==========================================
type Language = "en" | "hi" | "te" | "bn" | "mr" | "ta";
type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

type ConversationStep =
    | "greeting"
    | "scheme_selection"
    | "eligibility_check"
    | "form_filling"
    | "document_upload"
    | "submission"
    | "completed";

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
    [key: string]: string;
}

interface EligibilityState {
    question: string;
    questionId: string;
    questionType: "yes_no" | "choice" | "number";
    options?: string[];
    currentQuestionIndex: number;
    totalQuestions: number;
}

interface FormFieldState {
    fieldId: string;
    fieldType: "text" | "number" | "select" | "email" | "phone";
    fieldLabel: string;
    options?: string[];
}

interface DocumentState {
    documentId: string;
    documentLabel: string;
    acceptTypes?: string[];
    currentDocumentIndex: number;
    totalDocuments: number;
}

interface ConversationState {
    step: ConversationStep;
    selectedScheme: string | null;
    schemeName: string | null;
    eligibility: EligibilityState | null;
    formField: FormFieldState | null;
    document: DocumentState | null;
}

interface ReviewCardData {
    schemeName: string;
    schemeId: string;
    formData: Record<string, string | null>;
    uploadedDocuments: Record<string, unknown>;
    canSubmit: boolean;
}

interface SuccessCardData {
    applicationId: string;
    schemeName: string;
    schemeIcon?: string;
    submittedAt: string;
}

// ==========================================
// CONSTANTS
// ==========================================
const API_BASE = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    : "http://localhost:8000";

const SCHEMES = [
    { id: "PMKISAN", name: "PM Kisan", nameHi: "पीएम किसान", nameTe: "పీఎం కిసాన్", emoji: "🌾", keywords: ["pm-kisan", "kisan samman", "किसान सम्मान"] },
    { id: "PMJAY", name: "Ayushman Bharat", nameHi: "आयुष्मान भारत", nameTe: "ఆయుష్మాన్ భారత్", emoji: "🏥", keywords: ["health", "pm-jay", "आयुष्मान", "ayushman"] },
    { id: "PMAYU", name: "PM Awas", nameHi: "पीएम आवास", nameTe: "పీఎం ఆవాస్", emoji: "🏠", keywords: ["awas yojana", "housing", "आवास योजना"] },
    { id: "KCC", name: "Kisan Credit Card", nameHi: "किसान क्रेडिट कार्ड", nameTe: "కిసాన్ క్రెడిట్ కార్డ్", emoji: "💳", keywords: ["credit card", "kcc", "क्रेडिट कार్ड"] },
    { id: "APY", name: "Atal Pension", nameHi: "अटल पेंशन", nameTe: "అటల్ పెన్షన్", emoji: "👴", keywords: ["pension", "apy", "पेंशन"] },
    { id: "PMFBY", name: "Fasal Bima", nameHi: "फसल बीमा", nameTe: "ఫసల్ బీమా", emoji: "🛡️", keywords: ["crop insurance", "fasal", "फसल"] },
    { id: "PMMY", name: "MUDRA Loan", nameHi: "मुद्रा लोन", nameTe: "ముద్ర లోన్", emoji: "💼", keywords: ["mudra", "business loan", "व्यापार लोन"] },
    { id: "PMSVANIDHI", name: "SVANidhi", nameHi: "स्वनिधि", nameTe: "స్వానిధి", emoji: "🛒", keywords: ["street vendor", "svanidhi", "स्ट्रीट वेंडर"] },
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

const ActionButtons = React.memo(({ buttons, onSelect }: { buttons: ActionButton[]; onSelect: (value: string) => void }) => (
    <div className="flex flex-wrap gap-2.5 mt-5 pt-4 border-t border-slate-100/50">
        {buttons.map((btn, i) => (
            <motion.button
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 400, damping: 25 }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelect(btn.value)}
                className={`px-5 py-3 rounded-2xl text-sm font-bold tracking-wide transition-all shadow-lg active:translate-y-0.5 cursor-pointer backdrop-blur-sm ${btn.variant === "primary"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200/50 ring-2 ring-emerald-400/20"
                    : btn.variant === "danger"
                        ? "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-red-200/50"
                        : "bg-white/90 text-slate-700 hover:bg-white hover:text-emerald-700 border border-slate-200/80 hover:border-emerald-300 hover:shadow-emerald-100/50"
                    }`}
            >
                {btn.label}
            </motion.button>
        ))}
    </div>
));

// Helper to render formatted AI content with better typography
const FormattedContent = ({ content }: { content: string }) => {
    // Handle null/undefined content
    if (!content) {
        return null;
    }

    // Parse content for markdown-like formatting
    const lines = content.split('\n');

    return (
        <div className="space-y-2">
            {lines.map((line, idx) => {
                // Check for bold text with **
                const boldRegex = /\*\*(.+?)\*\*/g;
                const hasBold = boldRegex.test(line);

                // Check for emoji prefixes (📋, 📝, ✓, etc.)
                const hasEmoji = /^[📋📝✓✗🎉🙏💡⚠️❌✅🌾🏥🏠💳👴🛡️💼🛒]/.test(line.trim());

                // Check for "Question X of Y" or "Field X of Y" progress indicators
                const isProgressLine = /^(Question|Field) \d+ of \d+/.test(line.trim());

                // Check for bullet/checklist items
                const isCheckItem = line.trim().startsWith('✓') || line.trim().startsWith('✗');

                if (isProgressLine) {
                    return (
                        <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100/50 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">{line}</span>
                        </div>
                    );
                }

                if (!line.trim()) {
                    return <div key={idx} className="h-1" />;
                }

                // Format the line content
                let formattedLine = line;
                if (hasBold) {
                    formattedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
                }

                return (
                    <p
                        key={idx}
                        className={`text-[13.5px] leading-relaxed ${isCheckItem ? 'flex items-start gap-2 pl-1' : ''
                            } ${hasEmoji ? 'flex items-start gap-2' : ''}`}
                        dangerouslySetInnerHTML={{ __html: formattedLine }}
                    />
                );
            })}
        </div>
    );
};

const MessageBubble = React.memo(({ message, lang, onButtonClick, isSpeaking, onToggleSpeech }: {
    message: Message;
    lang: string;
    onButtonClick?: (value: string) => void;
    isSpeaking?: boolean;
    onToggleSpeech?: (id: string, content: string) => void;
}) => {
    const isAi = message.role === "ai";
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`flex w-full mb-6 ${isAi ? "justify-start" : "justify-end"}`}
        >
            <div className={`flex flex-col max-w-[92%] sm:max-w-[78%] gap-2 ${isAi ? "items-start" : "items-end"}`}>
                {/* Avatar and metadata row */}
                <div className="flex items-center gap-2.5 px-1">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center overflow-hidden shadow-md transition-all duration-300 ${isAi
                        ? "bg-gradient-to-br from-emerald-100 to-teal-50 ring-2 ring-emerald-200/50"
                        : "bg-gradient-to-br from-blue-100 to-indigo-50 ring-2 ring-blue-200/50"
                        }`}>
                        {isAi ? <img src="/live_chatbot.gif" alt="Didi" className="w-full h-full object-cover scale-150" /> : <User size={18} className="text-blue-600" />}
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] leading-none ${isAi ? "text-emerald-600" : "text-blue-600"}`}>
                            {isAi ? "🤖 AI DIDI" : (lang === "hi" ? "👤 आप" : "👤 YOU")}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {/* Message content bubble */}
                <div className={`relative px-5 py-4 rounded-3xl shadow-lg transition-all duration-300 ${isAi
                    ? "bg-gradient-to-br from-white via-white to-slate-50/50 border border-slate-100/80 text-slate-700 rounded-tl-lg shadow-slate-200/40"
                    : "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 border-none text-white rounded-tr-lg shadow-emerald-300/30"
                    }`}>
                    {/* Decorative accent */}
                    {isAi && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-teal-400 rounded-l-full" />
                    )}

                    {isAi ? (
                        <FormattedContent content={message.content} />
                    ) : (
                        <p className="text-[14px] font-semibold whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    )}

                    {message.buttons && <ActionButtons buttons={message.buttons} onSelect={onButtonClick || (() => { })} />}
                </div>

                {/* Listen button for AI messages */}
                {isAi && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.08, y: -1 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => onToggleSpeech?.(message.id, message.content)}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-md border-2 cursor-pointer ml-1 ${isSpeaking
                            ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-600 shadow-red-100/50"
                            : "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:shadow-emerald-100/50"
                            }`}
                        title={isSpeaking ? "Stop Speaking" : "Listen to Response"}
                    >
                        {isSpeaking ? (
                            <>
                                <VolumeX size={14} strokeWidth={2.5} />
                                <span>Stop</span>
                                <SmallVoiceWave />
                            </>
                        ) : (
                            <>
                                <Volume2 size={14} strokeWidth={2.5} />
                                <span>Listen</span>
                            </>
                        )}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}, (prev, next) => {
    return prev.message.id === next.message.id &&
        prev.isSpeaking === next.isSpeaking &&
        prev.lang === next.lang;
});

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
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAllow}
                        className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-200 active:translate-y-0.5 transition-all cursor-pointer"
                    >
                        {t.allowBtn}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onDeny}
                        className="flex-1 py-4 text-gray-400 hover:text-gray-600 text-sm font-black transition-all cursor-pointer"
                    >
                        {t.denyBtn}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

// Eligibility Question Card - Shows one question at a time with multiple choice or yes/no
const EligibilityCard = ({
    eligibility,
    onAnswer,
    t
}: {
    eligibility: EligibilityState;
    onAnswer: (answer: string | number | boolean) => void;
    t: any;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-md bg-gradient-to-br from-white via-white to-blue-50/30 border border-blue-100/60 rounded-[2rem] shadow-xl shadow-blue-100/30 overflow-hidden"
        >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center justify-center shadow-inner">
                        <HelpCircle size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-white font-bold text-sm tracking-wide">Eligibility Check</h4>
                        <p className="text-blue-100 text-[11px] font-semibold">
                            Question {eligibility.currentQuestionIndex + 1} of {eligibility.totalQuestions}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: eligibility.totalQuestions }).map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i <= eligibility.currentQuestionIndex
                                ? "bg-white shadow-sm"
                                : "bg-white/30"
                                }`} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <motion.div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${((eligibility.currentQuestionIndex + 1) / eligibility.totalQuestions) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>

                {/* Question */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100/50">
                    <p className="text-slate-800 font-semibold text-[15px] leading-relaxed">{eligibility.question}</p>
                </div>

                {/* Answer options */}
                <div className="space-y-2.5">
                    {eligibility.questionType === "yes_no" ? (
                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.03, y: -2, boxShadow: "0 8px 25px -5px rgba(16, 185, 129, 0.25)" }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => onAnswer(true)}
                                className="flex-1 py-4 px-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 text-emerald-700 font-bold hover:border-emerald-400 hover:from-emerald-100 transition-all cursor-pointer shadow-md shadow-emerald-100/30"
                            >
                                <span className="text-lg mr-2">✓</span> Yes / हाँ / అవును
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.03, y: -2, boxShadow: "0 8px 25px -5px rgba(239, 68, 68, 0.25)" }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => onAnswer(false)}
                                className="flex-1 py-4 px-4 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 text-red-700 font-bold hover:border-red-400 hover:from-red-100 transition-all cursor-pointer shadow-md shadow-red-100/30"
                            >
                                <span className="text-lg mr-2">✗</span> No / नहीं / కాదు
                            </motion.button>
                        </div>
                    ) : eligibility.questionType === "choice" && eligibility.options ? (
                        <div className="space-y-2.5">
                            {eligibility.options.map((option, idx) => (
                                <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ scale: 1.02, x: 5, boxShadow: "0 8px 20px -5px rgba(99, 102, 241, 0.2)" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onAnswer(option)}
                                    className="w-full py-3.5 px-5 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-semibold hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:text-blue-700 transition-all text-left cursor-pointer shadow-sm flex items-center gap-3"
                                >
                                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-sm text-slate-500 font-bold">
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    {option}
                                </motion.button>
                            ))}
                        </div>
                    ) : (
                        <input
                            type="number"
                            placeholder="Enter value..."
                            className="w-full py-4 px-5 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-semibold focus:bg-blue-50/30 focus:border-blue-400 transition-all outline-none shadow-sm text-lg"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onAnswer(parseFloat((e.target as HTMLInputElement).value));
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Dynamic Form Card - Shows current field being collected
const FormCard = ({
    formField,
    formData,
    onFieldSubmit,
    t
}: {
    formField: FormFieldState | null;
    formData: FormData;
    onFieldSubmit: (fieldId: string, value: string) => void;
    t: any;
}) => {
    const [inputValue, setInputValue] = useState("");
    const filledCount = Object.values(formData).filter(v => v).length;
    const totalFields = filledCount + 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-md bg-gradient-to-br from-white via-white to-emerald-50/30 border border-emerald-100/60 rounded-[2rem] shadow-xl shadow-emerald-100/30 overflow-hidden"
        >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center justify-center shadow-inner">
                        <ClipboardList size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-white font-bold text-sm tracking-wide">Application Form</h4>
                        <p className="text-emerald-100 text-[11px] font-semibold">
                            {filledCount} field{filledCount !== 1 ? 's' : ''} completed
                        </p>
                    </div>
                    {filledCount > 0 && (
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{filledCount}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Filled fields summary - show ALL completed fields with scroll */}
                {filledCount > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">✅ Completed Fields ({filledCount})</p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {Object.entries(formData).filter(([_, v]) => v).map(([key, value], idx) => (
                                <motion.div
                                    key={key}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100/50"
                                >
                                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                                    <span className="text-xs text-slate-500 capitalize font-medium">{key.replace(/_/g, ' ')}:</span>
                                    <span className="text-xs text-slate-800 font-bold truncate ml-auto max-w-[150px]">
                                        {key.toLowerCase().includes('aadhaar') ? `XXXX XXXX ${String(value).slice(-4)}` : String(value)}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current field input */}
                {formField && (
                    <div className="bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5 shadow-inner">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <p className="text-emerald-800 font-bold text-sm">Current Field</p>
                        </div>
                        <p className="text-slate-700 font-semibold text-[15px] mb-4">{formField.fieldLabel}</p>

                        {formField.fieldType === "select" && formField.options ? (
                            <div className="space-y-2">
                                {formField.options.map((option, idx) => (
                                    <motion.button
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onFieldSubmit(formField.fieldId, option)}
                                        className="w-full py-3 px-4 rounded-xl bg-white border-2 border-emerald-200 text-slate-700 font-medium hover:bg-emerald-100 hover:border-emerald-400 transition-all text-left text-sm cursor-pointer shadow-sm flex items-center gap-3"
                                    >
                                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-sm text-emerald-600 font-bold">
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        {option}
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <input
                                    type={formField.fieldType === "number" ? "number" : "text"}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={`Enter ${formField.fieldLabel.toLowerCase()}...`}
                                    className="flex-1 py-3.5 px-4 rounded-xl bg-white border-2 border-emerald-200 text-slate-700 font-semibold focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all outline-none text-sm shadow-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && inputValue.trim()) {
                                            onFieldSubmit(formField.fieldId, inputValue.trim());
                                            setInputValue("");
                                        }
                                    }}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.08, rotate: 5 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => {
                                        if (inputValue.trim()) {
                                            onFieldSubmit(formField.fieldId, inputValue.trim());
                                            setInputValue("");
                                        }
                                    }}
                                    className="py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm cursor-pointer shadow-lg shadow-emerald-200/50 hover:shadow-xl transition-all"
                                >
                                    →
                                </motion.button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Document Upload Card
const DocumentUploadCard = ({
    document,
    uploadedDocuments,
    onFileUpload,
    t
}: {
    document: DocumentState;
    uploadedDocuments: { [key: string]: File };
    onFileUpload: (docId: string, file: File) => void;
    t: any;
}) => {
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            onFileUpload(document.documentId, file);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileUpload(document.documentId, file);
        }
    };

    const uploadedCount = Object.keys(uploadedDocuments).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-md bg-gradient-to-br from-white via-white to-purple-50/30 border border-purple-100/60 rounded-[2rem] shadow-xl shadow-purple-100/30 overflow-hidden"
        >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-500 to-violet-500 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center justify-center shadow-inner">
                        <FileCheck size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-white font-bold text-sm tracking-wide">Document Upload</h4>
                        <p className="text-purple-100 text-[11px] font-semibold">
                            {uploadedCount} of {document.totalDocuments} uploaded
                        </p>
                    </div>
                    {uploadedCount > 0 && (
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{uploadedCount}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <motion.div
                        className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(uploadedCount / document.totalDocuments) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>

                {/* Uploaded documents */}
                {uploadedCount > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">✅ Uploaded</p>
                        {Object.entries(uploadedDocuments).map(([docId, file], idx) => (
                            <motion.div
                                key={docId}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100/50"
                            >
                                <CheckCircle2 size={16} className="text-purple-500 flex-shrink-0" />
                                <span className="text-xs text-purple-800 font-semibold truncate">{file.name}</span>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Current document upload */}
                <div className="bg-gradient-to-br from-purple-50 via-purple-50/50 to-violet-50 border-2 border-purple-200 rounded-2xl p-5 shadow-inner">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                        <p className="text-purple-800 font-bold text-sm">{document.documentLabel}</p>
                    </div>
                    {document.acceptTypes && (
                        <p className="text-purple-400 text-xs mb-3 font-medium">
                            Accepted: {document.acceptTypes.join(", ")}
                        </p>
                    )}

                    <motion.div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        whileHover={{ scale: 1.01, y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        className={`border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all shadow-sm ${dragOver
                            ? "border-purple-500 bg-purple-100 shadow-purple-200/50"
                            : "border-purple-300 hover:border-purple-400 hover:bg-purple-50 bg-white/50"
                            }`}
                    >
                        <div className="w-14 h-14 mx-auto bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
                            <Upload size={28} className="text-purple-500" />
                        </div>
                        <p className="text-sm text-purple-700 font-bold mb-1">
                            Drop file here or click to browse
                        </p>
                        <p className="text-xs text-purple-400 font-medium">
                            Max 5MB
                        </p>
                    </motion.div>

                    <input
                        ref={inputRef}
                        type="file"
                        accept={document.acceptTypes?.join(",")}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            </div>
        </motion.div>
    );
};

// ==========================================
// REVIEW CARD — Shows all filled details before submission
// ==========================================
const ReviewCard = ({
    reviewData,
    onSubmit,
    onEdit,
    isSubmitting,
}: {
    reviewData: ReviewCardData;
    onSubmit: () => void;
    onEdit: () => void;
    isSubmitting: boolean;
}) => {
    const formEntries = Object.entries(reviewData.formData).filter(([_, v]) => v && !String(v).startsWith('http'));
    const docEntries = Object.entries(reviewData.uploadedDocuments);
    const docUrlEntries = Object.entries(reviewData.formData).filter(([_, v]) => v && String(v).startsWith('http'));

    const schemeEmoji: Record<string, string> = {
        PMKISAN: '🌾', PMJAY: '🏥', PMAYU: '🏠', KCC: '💳', PMSVNIDHI: '🏪', PM_KISAN: '🌾'
    };
    const emoji = schemeEmoji[reviewData.schemeId] || '📋';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-md bg-gradient-to-br from-white via-white to-emerald-50/20 border border-emerald-100/60 rounded-[2rem] shadow-2xl shadow-emerald-100/40 overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 py-5 text-white relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                        {emoji}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-base tracking-wide">Review Your Application</h3>
                        <p className="text-emerald-100 text-sm font-medium">{reviewData.schemeName}</p>
                    </div>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="bg-white/25 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-inner flex items-center gap-1.5"
                    >
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        READY
                    </motion.div>
                </div>
            </div>

            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Form Data Section */}
                {formEntries.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-7 h-7 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center shadow-sm">
                                <ClipboardList size={14} className="text-emerald-600" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Personal Details</span>
                            <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                {formEntries.length} fields
                            </span>
                        </div>
                        <div className="space-y-2">
                            {formEntries.map(([key, value], idx) => (
                                <motion.div
                                    key={key}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 + idx * 0.03 }}
                                    className="flex items-start justify-between bg-gradient-to-r from-slate-50 to-slate-50/50 rounded-xl px-4 py-3 gap-3 border border-slate-100/50"
                                >
                                    <span className="text-xs text-slate-500 capitalize flex-shrink-0 font-medium" style={{ minWidth: '38%' }}>
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs text-slate-800 font-bold text-right break-all">
                                        {key.toLowerCase().includes('aadhaar') || key.toLowerCase().includes('aadhar')
                                            ? `•••• •••• ${String(value).slice(-4)}`
                                            : value}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Uploaded Documents Section */}
                {(docEntries.length > 0 || docUrlEntries.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-7 h-7 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg flex items-center justify-center shadow-sm">
                                <FileCheck size={14} className="text-purple-600" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Documents Uploaded</span>
                            <span className="ml-auto text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                {docEntries.length + docUrlEntries.length} files
                            </span>
                        </div>
                        <div className="space-y-2">
                            {docEntries.map(([docId], idx) => (
                                <motion.div
                                    key={docId}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 + idx * 0.03 }}
                                    className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-violet-50/50 rounded-xl px-4 py-3 border border-purple-100/50"
                                >
                                    <CheckCircle2 size={16} className="text-purple-500 flex-shrink-0" />
                                    <span className="text-xs text-purple-800 font-semibold capitalize">
                                        {docId.replace(/_/g, ' ')}
                                    </span>
                                    <span className="ml-auto text-[10px] text-purple-500 font-bold bg-purple-100/50 px-2 py-0.5 rounded-full">✓</span>
                                </motion.div>
                            ))}
                            {docUrlEntries.map(([docId], idx) => (
                                <motion.div
                                    key={docId}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 + (docEntries.length + idx) * 0.03 }}
                                    className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-violet-50/50 rounded-xl px-4 py-3 border border-purple-100/50"
                                >
                                    <CheckCircle2 size={16} className="text-purple-500 flex-shrink-0" />
                                    <span className="text-xs text-purple-800 font-semibold capitalize">
                                        {docId.replace(/_/g, ' ')}
                                    </span>
                                    <span className="ml-auto text-[10px] text-purple-500 font-bold bg-purple-100/50 px-2 py-0.5 rounded-full">✓</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Confirmation Banner */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-r from-emerald-50 via-emerald-50 to-teal-50 border-2 border-emerald-200/60 rounded-2xl p-4 flex items-center gap-3"
                >
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center shadow-md">
                        <CheckCircle2 size={20} className="text-white" />
                    </div>
                    <p className="text-sm text-emerald-800 font-semibold leading-snug">
                        All information verified. Ready to submit to government portal.
                    </p>
                </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="px-5 pb-5 flex gap-3 pt-2">
                <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onEdit}
                    disabled={isSubmitting}
                    className="flex-1 py-4 px-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                    ✏️ Edit
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.03, y: -2, boxShadow: "0 15px 30px -5px rgba(16, 185, 129, 0.4)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="flex-2 py-4 px-7 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-bold text-sm shadow-xl shadow-emerald-300/40 hover:shadow-2xl transition-all disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
                >
                    {isSubmitting ? (
                        <>
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                ⟳
                            </motion.span>
                            Submitting...
                        </>
                    ) : (
                        <>
                            <span>🚀</span>
                            Submit Application
                        </>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
};


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
        schemeName: null,
        eligibility: null,
        formField: null,
        document: null,
    });
    const [showTextInput, setShowTextInput] = useState(false);
    /** Form shows ONLY when AI confirmed user wants to apply and is asking for details */
    const [showForm, setShowForm] = useState(false);
    const [showEligibilityCard, setShowEligibilityCard] = useState(false);
    const [showDocumentUpload, setShowDocumentUpload] = useState(false);

    const [formData, setFormData] = useState<FormData>({});
    const [eligibilityAnswers, setEligibilityAnswers] = useState<{ [key: string]: string | number | boolean }>({});
    const [uploadedDocuments, setUploadedDocuments] = useState<{ [key: string]: File }>({});
    const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Review + Success card state
    const [showReviewCard, setShowReviewCard] = useState(false);
    const [reviewCardData, setReviewCardData] = useState<ReviewCardData | null>(null);
    const [successCardData, setSuccessCardData] = useState<SuccessCardData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const deviceIdRef = useRef<string>("");

    // Always generate a new session ID on page load to start fresh chat
    if (typeof window !== "undefined" && !deviceIdRef.current) {
        // Create a new unique ID for each session (page refresh = new chat)
        const newSessionId = typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        deviceIdRef.current = newSessionId;
    }

    const recognitionRef = useRef<any>(null);
    const isListeningRef = useRef<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Preload speech synthesis voices (Chrome bug workaround)
    useEffect(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            // Load voices immediately
            const loadVoices = () => {
                window.speechSynthesis.getVoices();
            };
            loadVoices();
            
            // Also load when voiceschanged fires (async loading in Chrome)
            window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
            
            // Chrome workaround: cancel any stuck synthesis
            window.speechSynthesis.cancel();
            
            return () => {
                window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
            };
        }
    }, []);

    const handleStartNew = async () => {
        try {
            await fetch(`${API_BASE}/api/v1/reset-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: deviceIdRef.current })
            });
        } catch (e) {
            console.error("Failed to reset session:", e);
        }
        setMessages([]);
        setConvState({
            step: "greeting",
            selectedScheme: null,
            schemeName: null,
            eligibility: null,
            formField: null,
            document: null,
        });
        setFormData({});
        setShowForm(false);
        setShowEligibilityCard(false);
        setShowDocumentUpload(false);
        setInitializedWithScheme(false);

        // Add greeting - the setMessages + manual speak approach since addMessage isn't available here yet
        const initialId = "initial-greeting-" + Date.now();
        setMessages([{
            id: initialId,
            role: "ai",
            content: t.greeting,
            timestamp: new Date()
        }]);
        
        // Trigger speech manually after a delay with female voice
        setTimeout(() => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(t.greeting);
                const targetLang = lang === "hi" ? "hi-IN" : lang === "te" ? "te-IN" : "en-IN";
                utterance.lang = targetLang;
                
                // Select female voice
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    const langCode = targetLang.split('-')[0];
                    const femaleVoice = voices.find(v => 
                        v.lang.startsWith(langCode) && 
                        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('heera'))
                    ) || voices.find(v => v.lang.startsWith(langCode)) || voices[0];
                    if (femaleVoice) utterance.voice = femaleVoice;
                }
                
                utterance.rate = 0.95;
                utterance.pitch = 1.1;
                utterance.onstart = () => setCurrentlySpeakingId(initialId);
                utterance.onend = () => setCurrentlySpeakingId(null);
                utterance.onerror = () => setCurrentlySpeakingId(null);
                try {
                    window.speechSynthesis.speak(utterance);
                } catch (e) {
                    console.warn("Speech failed:", e);
                }
            }
        }, 300);
    };

    // Initial Greeting was here, moved down

    // Clean up speech recognition on unmount
    useEffect(() => {
        return () => {
            isListeningRef.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.onend = null;
                    recognitionRef.current.stop();
                } catch (e) { }
                recognitionRef.current = null;
            }
            window.speechSynthesis.cancel();
        };
    }, []);

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

    const handleToggleSpeech = useCallback((messageId: string, content: string) => {
        // If clicking same message that's speaking, stop it
        if (currentlySpeakingId === messageId) {
            window.speechSynthesis.cancel();
            setCurrentlySpeakingId(null);
            return;
        }

        // Don't speak if user is listening (mic is on)
        if (isListeningRef.current || voiceState === "listening") {
            return;
        }

        // Cancel any ongoing speech first
        window.speechSynthesis.cancel();
        setCurrentlySpeakingId(null);

        // Optimized cleaning: one-pass regex for all markdown symbols and emojis
        const cleanContent = content
            .replace(/[*#]/g, '')
            .replace(/📋/g, 'Note: ')
            .replace(/📝/g, 'Details: ')
            .replace(/[✓✗]/g, m => m === '✓' ? 'Check: ' : 'Cross: ')
            .replace(/[\u{1f300}-\u{1f9ff}\u{2600}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f18e}]/gu, '')
            .trim();

        if (!cleanContent) return;

        const utterance = new SpeechSynthesisUtterance(cleanContent);

        // Set language
        let targetLang = "en-IN";
        if (lang === "hi") targetLang = "hi-IN";
        else if (lang === "te") targetLang = "te-IN";
        else if (lang === "ta") targetLang = "ta-IN";
        else if (lang === "bn") targetLang = "bn-IN";
        else if (lang === "mr") targetLang = "mr-IN";
        
        utterance.lang = targetLang;

        // Select FEMALE voice (Didi = sister = female)
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const langCode = targetLang.split('-')[0];
            const femaleVoice = voices.find(v => 
                v.lang.startsWith(langCode) && 
                (v.name.toLowerCase().includes('female') || 
                 v.name.toLowerCase().includes('woman') ||
                 v.name.toLowerCase().includes('zira') ||
                 v.name.toLowerCase().includes('heera') ||
                 v.name.toLowerCase().includes('priya') ||
                 v.name.toLowerCase().includes('lekha'))
            );
            const anyLangVoice = voices.find(v => v.lang.startsWith(langCode));
            const anyFemaleVoice = voices.find(v => 
                v.name.toLowerCase().includes('female') || 
                v.name.toLowerCase().includes('zira')
            );
            const selectedVoice = femaleVoice || anyLangVoice || anyFemaleVoice || voices[0];
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }

        utterance.rate = 0.95;
        utterance.pitch = 1.1; // Slightly higher for female voice
        utterance.volume = 1.0;

        utterance.onstart = () => {
            if (!isListeningRef.current) {
                setCurrentlySpeakingId(messageId);
            } else {
                window.speechSynthesis.cancel();
            }
        };
        utterance.onend = () => setCurrentlySpeakingId(null);
        utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
            if (e.error && e.error !== 'interrupted' && e.error !== 'canceled') {
                console.warn("Speech error:", e.error);
            }
            setCurrentlySpeakingId(null);
        };

        try {
            window.speechSynthesis.speak(utterance);
        } catch (err) {
            console.warn("Speech synthesis failed:", err);
            setCurrentlySpeakingId(null);
        }
    }, [currentlySpeakingId, lang, voiceState]);

    // Dedicated auto-speak function (no toggle behavior) - ROBUST VERSION with Female Voice
    const speakMessageAuto = useCallback((messageId: string, content: string) => {
        // Cancel any ongoing speech first
        window.speechSynthesis.cancel();

        // Optimized cleaning
        const cleanContent = content
            .replace(/[*#]/g, '')
            .replace(/📋/g, 'Note: ')
            .replace(/📝/g, 'Details: ')
            .replace(/[✓✗]/g, m => m === '✓' ? 'Check: ' : 'Cross: ')
            .replace(/[\u{1f300}-\u{1f9ff}\u{2600}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f18e}]/gu, '')
            .trim();

        if (!cleanContent) return;

        const speak = (retryCount = 0) => {
            // Don't speak if user is currently listening
            if (isListeningRef.current) {
                return;
            }

            // Check if speech synthesis is available
            if (!window.speechSynthesis) {
                console.warn("Speech synthesis not available");
                return;
            }

            const utterance = new SpeechSynthesisUtterance(cleanContent);

            // Set language
            let targetLang = "en-IN";
            if (lang === "hi") targetLang = "hi-IN";
            else if (lang === "te") targetLang = "te-IN";
            else if (lang === "ta") targetLang = "ta-IN";
            else if (lang === "bn") targetLang = "bn-IN";
            else if (lang === "mr") targetLang = "mr-IN";
            
            utterance.lang = targetLang;

            // Try to select a FEMALE voice for the target language (Didi = sister = female)
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                // Priority: Female voice for target language > Any female voice > Any voice for target language
                const langCode = targetLang.split('-')[0];
                const femaleVoice = voices.find(v => 
                    v.lang.startsWith(langCode) && 
                    (v.name.toLowerCase().includes('female') || 
                     v.name.toLowerCase().includes('woman') ||
                     v.name.toLowerCase().includes('zira') ||
                     v.name.toLowerCase().includes('heera') ||
                     v.name.toLowerCase().includes('priya') ||
                     v.name.toLowerCase().includes('lekha') ||
                     v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('hindi'))
                );
                const anyLangVoice = voices.find(v => v.lang.startsWith(langCode));
                const anyFemaleVoice = voices.find(v => 
                    v.name.toLowerCase().includes('female') || 
                    v.name.toLowerCase().includes('woman') ||
                    v.name.toLowerCase().includes('zira')
                );
                const indianVoice = voices.find(v => v.lang.includes('IN'));
                
                const selectedVoice = femaleVoice || anyLangVoice || anyFemaleVoice || indianVoice || voices[0];
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }

            utterance.rate = 0.95;
            utterance.pitch = 1.1; // Slightly higher pitch for female-like voice
            utterance.volume = 1.0;

            utterance.onstart = () => {
                if (!isListeningRef.current) {
                    setCurrentlySpeakingId(messageId);
                } else {
                    window.speechSynthesis.cancel();
                }
            };
            
            utterance.onend = () => setCurrentlySpeakingId(null);
            
            utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
                // Only log actual errors, not interruptions or cancellations
                if (e.error && e.error !== 'interrupted' && e.error !== 'canceled') {
                    console.warn("Speech synthesis error:", e.error);
                }
                setCurrentlySpeakingId(null);
                // Retry on actual errors (not cancellations)
                if (retryCount < 1 && e.error && e.error !== 'interrupted' && e.error !== 'canceled') {
                    setTimeout(() => speak(retryCount + 1), 300);
                }
            };

            // Resume if paused (Chrome bug workaround)
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }

            try {
                window.speechSynthesis.speak(utterance);
            } catch (err) {
                console.warn("Speech synthesis speak() failed:", err);
                setCurrentlySpeakingId(null);
            }
        };

        // Wait for voices to be loaded, then speak
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            // Voices not loaded yet, wait for them
            const onVoicesChanged = () => {
                window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
                setTimeout(speak, 100);
            };
            window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
            // Fallback if voiceschanged never fires
            setTimeout(() => {
                window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
                speak();
            }, 500);
        } else {
            // Voices ready, speak with small delay
            setTimeout(speak, 150);
        }
    }, [lang]);

    const addMessage = useCallback((role: "user" | "ai", content: string, buttons?: ActionButton[]) => {
        const id = Math.random().toString(36).substr(2, 9);
        setMessages(prev => [...prev.slice(-49), { // Keep list performant by limiting to last 50 messages
            id,
            role, content, timestamp: new Date(), buttons
        }]);

        // Auto-speak AI messages immediately
        if (role === "ai") {
            // Use dedicated auto-speak function (no toggle behavior)
            speakMessageAuto(id, content);
        }
    }, [speakMessageAuto]);

    const startSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            addMessage("ai", "Speech recognition not supported.");
            return;
        }

        // Stop any existing recognition first
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onend = null; // Remove handler to prevent restart
                recognitionRef.current.stop();
            } catch (e) { }
        }

        const recognition = new SpeechRecognition();
        recognition.lang = lang === "hi" ? "hi-IN" : lang === "te" ? "te-IN" : "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3; // Get more alternatives for better accuracy

        // Store accumulated transcript across recognition restarts
        let accumulatedTranscript = "";

        recognition.onstart = () => {
            console.log("🎤 Speech recognition started");
            isListeningRef.current = true;
            setVoiceState("listening");
            window.speechSynthesis.cancel();
            setCurrentlySpeakingId(null);
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = "";
            let interimTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const result = event.results[i];
                // Get the best transcript (highest confidence)
                const transcript = result[0].transcript;

                if (result.isFinal) {
                    finalTranscript += transcript + " ";
                    // Add to accumulated for persistence across restarts
                    accumulatedTranscript += transcript + " ";
                } else {
                    interimTranscript += transcript;
                }
            }

            // Show accumulated + current interim for seamless experience
            const fullTranscript = (accumulatedTranscript + interimTranscript).trim();
            if (fullTranscript) {
                setTranscript(fullTranscript);
            }
        };

        recognition.onerror = (e: any) => {
            const errorType = e.error || 'unknown';
            console.log("🎤 Speech error:", errorType);

            // These errors are expected and should not stop listening
            if (errorType === 'no-speech' || errorType === 'aborted') {
                // Don't do anything - onend will handle restart if needed
                return;
            }

            // For other errors, only stop if it's a serious error
            if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
                console.error("Microphone access denied");
                isListeningRef.current = false;
                setVoiceState("idle");
                addMessage("ai", "Microphone access denied. Please allow microphone access.");
            }
            // For network or audio-capture errors, let onend handle restart
        };

        // This fires when recognition stops for ANY reason
        recognition.onend = () => {
            console.log("🎤 Speech recognition ended, isListening:", isListeningRef.current);

            // Only restart if user hasn't manually stopped
            if (isListeningRef.current) {
                console.log("🎤 Auto-restarting recognition...");
                // Small delay to prevent rapid restart loops
                setTimeout(() => {
                    if (isListeningRef.current) {
                        try {
                            // Create fresh recognition instance for reliability
                            startSpeechRecognition();
                        } catch (e) {
                            console.error("Failed to restart recognition:", e);
                            isListeningRef.current = false;
                            setVoiceState("idle");
                        }
                    }
                }, 100);
            } else {
                setVoiceState("idle");
            }
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
            console.log("🎤 Recognition.start() called");
        } catch (e) {
            console.error("Failed to start recognition:", e);
            isListeningRef.current = false;
            setVoiceState("idle");
        }
    };

    const toggleMic = async () => {
        if (voiceState === "listening" || isListeningRef.current) {
            // User pressed stop - stop listening and submit
            console.log("🎤 User stopped listening");
            isListeningRef.current = false;

            // Get transcript before stopping
            const final = transcript.trim();

            // Stop recognition
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.onend = null; // Prevent auto-restart
                    recognitionRef.current.stop();
                } catch (e) { }
                recognitionRef.current = null;
            }

            setVoiceState("idle");

            // Submit if we have text
            if (final) {
                processUserInput(final);
            }
            setTranscript("");
        } else {
            // Start listening - stop any speech first
            window.speechSynthesis.cancel();
            setCurrentlySpeakingId(null);

            if (typeof navigator !== "undefined" && (navigator as any).permissions) {
                try {
                    const result = await (navigator as any).permissions.query({ name: "microphone" });
                    if (result.state === "granted") {
                        setTranscript(""); // Clear any old transcript
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
        // Stop any speech before starting to listen
        window.speechSynthesis.cancel();
        setCurrentlySpeakingId(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setTranscript(""); // Clear any old transcript
            startSpeechRecognition();
        } catch (e: any) {
            addMessage("ai", "Microphone access denied.");
        }
    };

    const processUserInput = useCallback(async (text: string, extraData?: { eligibility_answer?: string | number | boolean; form_field_value?: string; document_id?: string }) => {
        if ((!text.trim() && !extraData) || voiceState === "processing") return;

        // Add user message only if there's text (not for button clicks with extraData)
        if (text.trim()) {
            addMessage("user", text);
        }
        setInputText("");
        setTranscript("");
        setVoiceState("processing");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const userId = deviceIdRef.current;
            const langCode = lang === "hi" ? "hi-IN" : lang === "te" ? "te-IN" : "en-IN";

            // Build request body with any extra data
            const requestBody: any = {
                text,
                user_id: userId,
                language: langCode,
            };

            if (extraData?.eligibility_answer !== undefined) {
                requestBody.eligibility_answer = extraData.eligibility_answer;
            }
            if (extraData?.form_field_value !== undefined) {
                requestBody.form_field_value = extraData.form_field_value;
            }
            // ── Document upload: tell backend which doc was uploaded ──
            if (extraData?.document_id !== undefined) {
                requestBody.document_id = extraData.document_id;
                requestBody.document_uploaded = true;
            }

            const res = await fetch(`${API_BASE}/api/v1/process-text`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const data = await res.json();
            const aiResponse = data.ai_response || "";
            const aiData = data.ai_data || {};
            const action = aiData.action;

            setVoiceState("idle");

            // Handle different actions from backend
            if (action === "eligibility_question") {
                // Phase 2-4: Render eligibility question conversationally in chat with inline buttons
                const eligibilityState: EligibilityState = {
                    question: aiData.question,
                    questionId: aiData.question_id,
                    questionType: aiData.question_type || "yes_no",
                    options: aiData.options,
                    currentQuestionIndex: aiData.current_question_index || 0,
                    totalQuestions: aiData.total_questions || 1,
                };

                // Add AI response message with buttons baked into the message
                const questionButtons: ActionButton[] = [];

                if (eligibilityState.questionType === "yes_no") {
                    questionButtons.push(
                        { label: "✓ Yes", value: "yes", variant: "primary" },
                        { label: "✗ No", value: "no", variant: "secondary" }
                    );
                } else if (eligibilityState.questionType === "choice" && eligibilityState.options) {
                    questionButtons.push(
                        ...eligibilityState.options.map(opt => ({
                            label: opt,
                            value: opt,
                            variant: "secondary" as const
                        }))
                    );
                }

                // Show progress context: "Question 2 of 4"
                const progressContext = `Question ${eligibilityState.currentQuestionIndex + 1} of ${eligibilityState.totalQuestions}`;
                const fullMessage = `${progressContext}\n\n${aiData.speech_response}`;

                addMessage("ai", fullMessage, questionButtons);

                setConvState(prev => ({
                    ...prev,
                    step: "eligibility_check",
                    schemeName: aiData.scheme_name || prev.schemeName,
                    eligibility: eligibilityState,
                    formField: null,
                    document: null,
                }));
                setShowEligibilityCard(false);
                setShowForm(false);
                setShowDocumentUpload(false);

            } else if (action === "form_field") {
                // Phase 2-4: Render form fields conversationally in chat
                const formFieldState: FormFieldState = {
                    fieldId: aiData.field_id,
                    fieldType: aiData.field_type || "text",
                    fieldLabel: aiData.field_label,
                    options: aiData.options,
                };

                // Sync form data from backend - this captures all values including spoken input
                if (aiData.collected_form_data) {
                    setFormData(prev => ({
                        ...prev,
                        ...aiData.collected_form_data,
                    }));
                }

                // Auto-fill from eligibility if provided
                if (aiData.auto_filled) {
                    setFormData(prev => ({
                        ...prev,
                        ...aiData.auto_filled,
                    }));
                }

                // Phase 5: Form-filling distinction - show progress (e.g., "Field 3 of 11")
                // Backend sends field_index (1-based), so use it directly
                const currentFieldNum = aiData.field_index || 1;
                const totalFields = aiData.total_fields || 1;
                const progressContext = `Field ${currentFieldNum} of ${totalFields}`;

                // Phase 3: Show previous answers context
                const previousAnswers = Object.entries(formData)
                    .filter(([_, v]) => v)
                    .slice(0, 3) // Show last 3 answers for context
                    .map(([key, value]) => `✓ ${key}: ${value}`)
                    .join('\n');

                const contextMessage = previousAnswers ? `\n\n📋 Previous answers:\n${previousAnswers}\n` : '';
                const fullMessage = `${progressContext}\n\n${aiData.speech_response}${contextMessage}`;

                // Phase 2: Question-type-specific rendering
                const formButtons: ActionButton[] = [];
                if (formFieldState.fieldType === "select" && formFieldState.options) {
                    formButtons.push(
                        ...formFieldState.options.map(opt => ({
                            label: opt,
                            value: opt,
                            variant: "secondary" as const
                        }))
                    );
                }

                addMessage("ai", fullMessage, formFieldState.fieldType !== "select" ? undefined : formButtons);

                setConvState(prev => ({
                    ...prev,
                    step: "form_filling",
                    eligibility: null,
                    formField: formFieldState,
                    document: null,
                }));
                setShowEligibilityCard(false);
                setShowForm(formFieldState.fieldType !== "select"); // Show input for non-select fields
                setShowDocumentUpload(false);

            } else if (action === "document_upload") {
                // Sync form data from backend
                if (aiData.collected_form_data) {
                    setFormData(prev => ({
                        ...prev,
                        ...aiData.collected_form_data,
                    }));
                }

                // Show document upload
                const documentState: DocumentState = {
                    documentId: aiData.document_id,
                    documentLabel: aiData.document_label,
                    acceptTypes: aiData.accept_types || [".pdf", ".jpg", ".png"],
                    currentDocumentIndex: aiData.current_document_index || 0,
                    totalDocuments: aiData.total_documents || 1,
                };
                setConvState(prev => ({
                    ...prev,
                    step: "document_upload",
                    eligibility: null,
                    formField: null,
                    document: documentState,
                }));
                setShowEligibilityCard(false);
                setShowForm(false);
                setShowDocumentUpload(true);
                addMessage("ai", aiResponse);

            } else if (action === "eligible") {
                // User is eligible, moving to form
                setConvState(prev => ({
                    ...prev,
                    step: "form_filling",
                    eligibility: null,
                }));
                setShowEligibilityCard(false);
                addMessage("ai", aiResponse, [
                    { label: "Continue / जारी रखें / కొనసాగించు", value: "continue", variant: "primary" }
                ]);

            } else if (action === "not_eligible") {
                // User is not eligible
                setConvState(prev => ({
                    ...prev,
                    step: "completed",
                    eligibility: null,
                    formField: null,
                    document: null,
                }));
                setShowEligibilityCard(false);
                setShowForm(false);
                setShowDocumentUpload(false);
                addMessage("ai", aiResponse, [
                    { label: "Try Another Scheme / दूसरी योजना / మరొక పథకం", value: "start over", variant: "secondary" }
                ]);

            } else if (action === "review_confirmation") {
                // ── REVIEW CARD: Show all filled data + Submit/Edit buttons ──
                const rd: ReviewCardData = {
                    schemeName: aiData.scheme_name || convState.schemeName || "Application",
                    schemeId: aiData.scheme_id || convState.selectedScheme || "",
                    formData: aiData.form_data || {},
                    uploadedDocuments: aiData.uploaded_documents || {},
                    canSubmit: aiData.can_submit !== false,
                };
                setReviewCardData(rd);
                setShowReviewCard(true);
                setShowEligibilityCard(false);
                setShowForm(false);
                setShowDocumentUpload(false);
                setConvState(prev => ({ ...prev, step: "submission" }));
                addMessage("ai", aiResponse);

            } else if (action === "application_card" || action === "submitted") {
                // ── SUCCESS: Application saved, show the success card ──
                const appId = data.application_id || aiData.application_id || aiData.reference_number || "APP-" + Date.now();
                const schemeEmojis: Record<string, string> = { PMKISAN: '🌾', PM_KISAN: '🌾', PMJAY: '🏥', PMAYU: '🏠', KCC: '💳' };
                const sId = aiData.scheme_id || convState.selectedScheme || "";
                setSuccessCardData({
                    applicationId: appId,
                    schemeName: aiData.scheme_name || convState.schemeName || "Application",
                    schemeIcon: schemeEmojis[sId] || "📋",
                    submittedAt: new Date().toISOString(),
                });
                setShowReviewCard(false);
                setReviewCardData(null);
                setShowEligibilityCard(false);
                setShowForm(false);
                setShowDocumentUpload(false);
                setConvState(prev => ({ ...prev, step: "completed" }));
                addMessage("ai", aiResponse);

            } else if (action === "scheme_selected") {
                // Scheme was selected, start eligibility
                setConvState(prev => ({
                    ...prev,
                    step: "scheme_selection",
                    selectedScheme: aiData.scheme_id,
                    schemeName: aiData.scheme_name,
                }));
                addMessage("ai", aiResponse);

            } else {
                // Default: just show response (greeting, general query, etc.)
                addMessage("ai", aiResponse);
            }

        } catch (err: any) {
            clearTimeout(timeoutId);
            setVoiceState("idle");
            if (err.name === 'AbortError') {
                addMessage("ai", "Response took too long. Please try again.");
            } else {
                console.error("Process Error:", err);
                addMessage("ai", "Connection error. Please check your internet.");
            }
        }
    }, [lang, voiceState, addMessage, deviceIdRef, setConvState, setShowEligibilityCard, setShowForm, setShowDocumentUpload, setFormData]);

    // ── Submit application from Review Card ──
    const handleSubmitApplication = useCallback(async () => {
        setIsSubmitting(true);
        try {
            await processUserInput("submit confirm");
        } finally {
            setIsSubmitting(false);
        }
    }, [processUserInput]);

    // ── Edit: go back to form filling ──
    const handleEditApplication = useCallback(() => {
        setShowReviewCard(false);
        setReviewCardData(null);
        setConvState(prev => ({ ...prev, step: "form_filling" }));
        addMessage("ai", "Sure! Which field would you like to update? Just type or say the field name and new value.");
    }, [addMessage]);


    // Handler for eligibility answers
    const handleEligibilityAnswer = (answer: string | number | boolean) => {
        const questionId = convState.eligibility?.questionId;
        setEligibilityAnswers(prev => ({
            ...prev,
            [questionId || '']: answer,
        }));
        // Send answer to backend
        processUserInput(String(answer), { eligibility_answer: answer });
    };

    // Handler for form field submissions
    const handleFormFieldSubmit = (fieldId: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value,
        }));
        // Send value to backend
        processUserInput(value, { form_field_value: value });
    };

    // Handler for document uploads
    const handleDocumentUpload = async (docId: string, file: File) => {
        setUploadedDocuments(prev => ({
            ...prev,
            [docId]: file,
        }));

        // Upload file to backend
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('document_id', docId);
            formDataUpload.append('user_id', deviceIdRef.current);

            const res = await fetch(`${API_BASE}/api/v1/upload`, {
                method: "POST",
                body: formDataUpload,
            });

            const data = await res.json();
            if (data.status === 'success' && data.file_url) {
                // Store the URL so it can be sent to backend via process-text
                const fileUrl = `${API_BASE}${data.file_url}`;
                // Notify backend the document was uploaded, passing the file URL
                processUserInput("document_uploaded", {
                    document_id: docId,
                    form_field_value: fileUrl,
                });
            } else {
                throw new Error(data.detail || 'Upload failed');
            }
        } catch (err) {
            console.error("Document upload error:", err);
            addMessage("ai", "Failed to upload document. Please try again.");
        }
    };

    const handleSend = () => {
        if (inputText.trim()) processUserInput(inputText);
    };

    // Initial Greeting - handles both regular and scheme-based greetings, and restores history
    useEffect(() => {
        const initChat = async () => {
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

                // Process through the new eligibility flow in a deferred manner
                setTimeout(() => processUserInput(applyText), 0);
            } else if (!schemeContext && !initializedWithScheme && messages.length === 0) {
                try {
                    const res = await fetch(`${API_BASE}/api/v1/conversation-history/${deviceIdRef.current}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.history && data.history.length > 0) {
                            // Restore conversation history
                            const restoredMessages = data.history.map((msg: any) => ({
                                id: Math.random().toString(36).substr(2, 9),
                                role: msg.role === "assistant" ? "ai" : "user",
                                content: msg.content,
                                timestamp: new Date()
                            }));
                            setMessages(restoredMessages);
                            setInitializedWithScheme(true);
                            return; // Don't show initial greeting if history exists
                        }
                    }
                } catch (e) {
                    console.error("Failed to load history", e);
                }

                const initialId = "initial-greeting";
                setMessages([{
                    id: initialId,
                    role: "ai",
                    content: t.greeting,
                    timestamp: new Date()
                }]);
                setTimeout(() => speakMessageAuto(initialId, t.greeting), 500);
                setInitializedWithScheme(true);
            }
        };

        if (deviceIdRef.current) {
            initChat();
        }
    }, [schemeContext, initializedWithScheme, messages.length, setSchemeContext, lang, t, addMessage, processUserInput, speakMessageAuto]);

    // Clean up speech when component unmounts
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

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
            {/* Header / Actions Menu */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-100/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        🤖
                    </div>
                    <span className="font-bold text-sm text-slate-700">AI Didi</span>
                    {/* Speaking indicator with stop button */}
                    <AnimatePresence>
                        {currentlySpeakingId && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                                onClick={() => {
                                    window.speechSynthesis.cancel();
                                    setCurrentlySpeakingId(null);
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 hover:bg-red-500 text-white rounded-full text-[10px] font-bold transition-colors cursor-pointer"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                    className="w-1.5 h-1.5 bg-white rounded-full"
                                />
                                {lang === "hi" ? "बोल रहा है... (रोकें)" : lang === "te" ? "మాట్లాడుతోంది... (ఆపు)" : "Speaking... (tap to stop)"}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.document.getElementById('desk-nav-history')?.click()}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all shadow-sm"
                    >
                        {lang === "hi" ? "सभी देखें" : "View All"}
                    </button>
                    <button
                        onClick={handleStartNew}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full hover:bg-emerald-200 transition-all shadow-sm"
                    >
                        {lang === "hi" ? "नया शुरू करें" : "+ Start New"}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-hide">
                <AnimatePresence mode="popLayout" initial={false}>
                    {messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            lang={lang}
                            isSpeaking={currentlySpeakingId === msg.id}
                            onToggleSpeech={handleToggleSpeech}
                            onButtonClick={(val) => {
                                // Phase 3: Context-aware button handling - determine answer type based on current step
                                if (convState.step === "eligibility_check") {
                                    processUserInput(val, { eligibility_answer: val });
                                } else if (convState.step === "form_filling") {
                                    processUserInput(val, { form_field_value: val });
                                } else {
                                    processUserInput(val);
                                }
                            }}
                        />
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
                        <FormCard
                            formField={convState.formField}
                            formData={formData}
                            onFieldSubmit={handleFormFieldSubmit}
                            t={t}
                        />
                    </motion.div>
                )}

                {showEligibilityCard && convState.eligibility && (
                    <motion.div layout className="flex justify-start py-4">
                        <EligibilityCard
                            eligibility={convState.eligibility}
                            onAnswer={handleEligibilityAnswer}
                            t={t}
                        />
                    </motion.div>
                )}

                {showDocumentUpload && convState.document && (
                    <motion.div layout className="flex justify-start py-4">
                        <DocumentUploadCard
                            document={convState.document}
                            uploadedDocuments={uploadedDocuments}
                            onFileUpload={handleDocumentUpload}
                            t={t}
                        />
                    </motion.div>
                )}

                {showReviewCard && reviewCardData && (
                    <motion.div layout className="flex justify-start py-4">
                        <ReviewCard
                            reviewData={reviewCardData}
                            onSubmit={handleSubmitApplication}
                            onEdit={handleEditApplication}
                            isSubmitting={isSubmitting}
                        />
                    </motion.div>
                )}

                {successCardData && (
                    <motion.div layout className="flex justify-start py-4">
                        <ApplicationSuccessCard
                            applicationId={successCardData.applicationId}
                            schemeName={successCardData.schemeName}
                            schemeIcon={successCardData.schemeIcon}
                            submittedAt={successCardData.submittedAt}
                            onViewDetails={() => window.location.href = '/user/history'}
                            onDownloadReceipt={() => alert("Receipt downloading...")}
                        />
                    </motion.div>
                )}

                {voiceState === "processing" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start pl-4"
                    >
                        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-4 rounded-3xl border border-emerald-200/60 shadow-lg shadow-emerald-100/30 flex items-center gap-4">
                            {/* Animated AI avatar */}
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
                                    <img src="/live_chatbot.gif" alt="Didi" className="w-full h-full object-cover scale-150" />
                                </div>
                                <motion.div
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="absolute inset-0 rounded-2xl border-2 border-emerald-400/40"
                                />
                            </div>

                            {/* Typing dots animation */}
                            <div className="flex items-center gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            y: [0, -8, 0],
                                            backgroundColor: ["#10b981", "#14b8a6", "#10b981"],
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 0.8,
                                            delay: i * 0.15,
                                            ease: "easeInOut"
                                        }}
                                        className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-md shadow-emerald-400/30"
                                    />
                                ))}
                            </div>

                            {/* Status text */}
                            <motion.span
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest"
                            >
                                {t.thinking}
                            </motion.span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} className="h-8 sm:h-12" />
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
                                className="w-full relative mb-1"
                            >
                                <div className="flex justify-center w-full">
                                    <div className="flex gap-2 overflow-x-auto pb-4 pt-1 px-4 md:px-8 no-scrollbar scroll-smooth w-full justify-start">
                                        {SCHEMES.map(s => (
                                            <motion.button
                                                key={s.id}
                                                whileHover={{ y: -3, scale: 1.05, boxShadow: "0 8px 20px -5px rgba(16, 185, 129, 0.2)" }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => processUserInput(s.name)}
                                                className="flex-shrink-0 whitespace-nowrap bg-white border border-slate-200 px-3 py-1.5 rounded-2xl text-[11px] font-black text-slate-800 shadow-sm hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center gap-2 cursor-pointer"
                                            >
                                                <span className="text-base">{s.emoji}</span>
                                                {lang === 'hi' ? s.nameHi : lang === 'te' ? s.nameTe : s.name}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
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
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    onClick={() => setShowTextInput(false)}
                                    className="w-14 h-14 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-3xl flex items-center justify-center transition-all active:scale-90 border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-sm cursor-pointer"
                                >
                                    <Mic size={22} />
                                </motion.button>
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
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleSend}
                                    disabled={!inputText.trim()}
                                    className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all shadow-xl cursor-pointer ${inputText.trim() ? "bg-emerald-600 text-white shadow-emerald-200" : "bg-slate-100 text-slate-300"}`}
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
                                className="relative flex flex-col items-center gap-1 w-full"
                            >
                                <div className="relative flex items-center justify-center h-24 sm:h-28 w-full lg:mt-0">
                                    <VoiceWaves isListening={isListening} />


                                    <motion.button
                                        layoutId="mic-button"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={toggleMic}
                                        className={`relative z-10 w-20 h-20 sm:w-22 sm:h-22 rounded-[2.8rem] flex items-center justify-center transition-all shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] ${isListening
                                            ? "bg-red-500 text-white ring-[14px] ring-red-50 shadow-red-200"
                                            : "bg-emerald-600 text-white ring-[14px] ring-emerald-50 shadow-emerald-200"
                                            }`}
                                    >
                                        <AnimatePresence mode="wait">
                                            {isListening ? (
                                                <motion.div key="stop" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                    <MicOff size={28} strokeWidth={2.5} />
                                                </motion.div>
                                            ) : (
                                                <motion.div key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                    <Mic size={32} strokeWidth={2.5} />
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
                                        whileHover={{ scale: 1.1 }}
                                        onClick={() => setShowTextInput(true)}
                                        className="absolute right-0 sm:right-[15%] lg:right-[25%] w-14 h-14 bg-white text-slate-400 hover:text-emerald-600 rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 active:scale-90 transition-all group cursor-pointer"
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
                                        {isListening ? t.listening : (lang === "hi" ? "बात करने के लिए बटन दबाएं" : lang === "te" ? "మాట్లాడటానికి నొక్కండి" : "TAP TO SPEAK")}
                                    </motion.p>



                                    <AnimatePresence>
                                        {isListening && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className="bg-white/95 backdrop-blur-md border-2 border-emerald-200 px-6 py-4 rounded-[2rem] max-w-md text-center shadow-xl shadow-emerald-500/10 mt-3"
                                            >
                                                {transcript ? (
                                                    <div className="space-y-3">
                                                        <p className="text-base font-bold text-slate-800 leading-relaxed">
                                                            "{transcript}"
                                                        </p>
                                                        <div className="flex items-center justify-center gap-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                                                <span className="text-xs text-emerald-600 font-semibold">
                                                                    {lang === "hi" ? "सुन रहा हूं..." : "Listening..."}
                                                                </span>
                                                            </div>
                                                            <span className="text-slate-300">|</span>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={toggleMic}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-full hover:bg-emerald-700 transition-colors"
                                                            >
                                                                <Send size={12} />
                                                                {lang === "hi" ? "भेजें" : "Send"}
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="flex gap-1">
                                                                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                                <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                                            </div>
                                                            <span className="text-sm text-slate-600 font-semibold">
                                                                {lang === "hi" ? "बोलना शुरू करें..." : "Start speaking..."}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400">
                                                            {lang === "hi" ? "मैं सुन रहा हूं, जब बोल लें तो माइक दबाएं" : "I'm listening, tap mic when done"}
                                                        </p>
                                                    </div>
                                                )}
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
                .mask-fade-edges {
                    mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
                    -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none; /* IE and Edge */
                    scrollbar-width: none; /* Firefox */
                }
            `}</style>
        </div>
    );
}
