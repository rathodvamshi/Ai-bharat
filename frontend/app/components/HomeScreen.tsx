"use client";
import { useState, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WeatherSky, { WeatherData } from "./WeatherSky";
import { useWeather } from "../hooks/useWeather";
import WeatherDetailView from "./WeatherDetailView";
import CropExplorerView from "./CropExplorerView";
import { Language, t } from "../lib/translations";
import LanguageSelector from "./LanguageSelector";

// ─────────────────────────────────────────────
// TOP 5 SCHEMES DATA
// ─────────────────────────────────────────────
const TOP_SCHEMES = [
    {
        id: "pmkisan", name: "PM-KISAN", nameHi: "पीएम-किसान", icon: "🌾",
        benefit: "₹6,000/year", benefitHi: "₹6,000/वर्ष",
        desc: "Direct income support", descHi: "सीधी आय सहायता",
        color: "#E8F5E9", gradient: "linear-gradient(135deg, #E8F5E9, #C8E6C9)", tag: "#2E7D32"
    },
    {
        id: "pmfby", name: "PM Fasal Bima", nameHi: "पीएम फसल बीमा", icon: "🛡️",
        benefit: "Crop Insurance", benefitHi: "फसल बीमा",
        desc: "Coverage for crop loss", descHi: "फसल नुकसान पर मुआवजा",
        color: "#E3F2FD", gradient: "linear-gradient(135deg, #E3F2FD, #BBDEFB)", tag: "#1565C0"
    },
    {
        id: "kcc", name: "KCC", nameHi: "केसीसी", icon: "💳",
        benefit: "4% Loan", benefitHi: "4% ब्याज लोन",
        desc: "Easy credit access", descHi: "आसान ऋण सुविधा",
        color: "#FFF3E0", gradient: "linear-gradient(135deg, #FFF3E0, #FFE0B2)", tag: "#E65100"
    },
    {
        id: "pmay", name: "PM Awas", nameHi: "पीएम आवास", icon: "🏠",
        benefit: "₹2.5 Lakh", benefitHi: "₹2.5 लाख",
        desc: "House subsidy", descHi: "घर बनाने की सहायता",
        color: "#FFF8E1", gradient: "linear-gradient(135deg, #FFF8E1, #FFECB3)", tag: "#F57F17"
    },
    {
        id: "ayushman", name: "Ayushman", nameHi: "आयुष्मान", icon: "🏥",
        benefit: "₹5L Health", benefitHi: "₹5 लाख स्वास्थ्य",
        desc: "Free health cover", descHi: "मुफ्त स्वास्थ्य बीमा",
        color: "#FFEBEE", gradient: "linear-gradient(135deg, #FFEBEE, #FFCDD2)", tag: "#C62828"
    },
];

// ─────────────────────────────────────────────
// QUICK TOOLS
// ─────────────────────────────────────────────

const QUICK_TOOLS = [
    { id: "crop", icon: "🌱", label: "Crop Help", labelHi: "फसल सहायता", labelBn: "ফসল সহায়তা", labelTe: "పంట సహాయం", labelMr: "पीक मदत", labelTa: "பயிர் உதவி", color: "#E8F5E9", accent: "#2E7D32" },
    { id: "weather", icon: "🌤️", label: "Weather", labelHi: "मौसम", labelBn: "আবহাওয়া", labelTe: "వాతావరణం", labelMr: "हवामान", labelTa: "வானிலை", color: "#E3F2FD", accent: "#1565C0" },
    { id: "market", icon: "📊", label: "Market Price", labelHi: "बाजार भाव", labelBn: "বাজার দর", labelTe: "మార్కెట్ ధర", labelMr: "बाजार भाव", labelTa: "சந்தை விலை", color: "#FFF3E0", accent: "#E65100" },
    { id: "ai", icon: "🤖", label: "AI Advice", labelHi: "AI सलाह", labelBn: "AI পরামর্শ", labelTe: "AI సలహా", labelMr: "AI सल्ला", labelTa: "AI ஆலோசனை", color: "#EDE7F6", accent: "#4527A0" },
];

function getToolLabel(tool: typeof QUICK_TOOLS[0], lang: Language) {
    switch (lang) {
        case "hi": return tool.labelHi;
        case "bn": return tool.labelBn;
        case "te": return tool.labelTe;
        case "mr": return tool.labelMr;
        case "ta": return tool.labelTa;
        default: return tool.label;
    }
}

function getGreeting(lang: Language) {
    const h = new Date().getHours();
    if (h < 12) return t("home.greetingMorning", lang);
    if (h < 17) return t("home.greetingAfternoon", lang);
    return t("home.greetingEvening", lang);
}

// ─────────────────────────────────────────────
// SCHEME CARD COMPONENT (Memoized)
// ─────────────────────────────────────────────
const SchemeCard = memo(function SchemeCard({ scheme, lang, index, onClick }: {
    scheme: typeof TOP_SCHEMES[0];
    lang: Language;
    index: number;
    onClick?: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.08 }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.08)" }}
            onClick={onClick}
            className="flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden shadow-md"
            style={{
                width: 150,
                background: scheme.gradient,
                border: "1px solid rgba(255,255,255,0.5)"
            }}
        >
            {/* Icon Section */}
            <div className="pt-4 pb-2 flex justify-center">
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner"
                    style={{ background: "rgba(255,255,255,0.8)" }}
                >
                    {scheme.icon}
                </div>
            </div>

            {/* Content */}
            <div className="px-3 pb-4 text-center">
                <h3 className="font-bold text-sm truncate" style={{ color: scheme.tag }}>
                    {lang === "hi" ? scheme.nameHi : scheme.name}
                </h3>
                <p className="text-xs mt-0.5 truncate" style={{ color: "#6B7280" }}>
                    {lang === "hi" ? scheme.descHi : scheme.desc}
                </p>
                <div
                    className="mt-2 px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: "rgba(255,255,255,0.7)", color: scheme.tag }}
                >
                    {lang === "hi" ? scheme.benefitHi : scheme.benefit}
                </div>
            </div>
        </motion.div>
    );
});



export default function HomeScreen({
    phone, lang, onToolClick, onLangChange,
}: {
    phone: string;
    lang: Language;
    onToolClick: (tool: string) => void;
    onLangChange: (lang: Language) => void;
}) {
    const { weatherData, locationGranted, loading, requestLocation } = useWeather();
    const [showWeatherDetail, setShowWeatherDetail] = useState(false);
    const [showCropExplorer, setShowCropExplorer] = useState(false);
    
    // Memoize greeting to avoid recalculation on every render
    const greeting = useMemo(() => getGreeting(lang), [lang]);

    // Memoize section labels
    const topSchemesLabel = useMemo<Record<Language, string>>(() => ({
        en: "🏛️ Top Government Schemes",
        hi: "🏛️ प्रमुख सरकारी योजनाएं",
        bn: "🏛️ শীর্ষ সরকারি প্রকল্প",
        te: "🏛️ ప్రముఖ ప్రభుత్వ పథకాలు",
        mr: "🏛️ प्रमुख सरकारी योजना",
        ta: "🏛️ முக்கிய அரசு திட்டங்கள்",
    }), []);

    const viewAllLabel = useMemo<Record<Language, string>>(() => ({
        en: "View All →",
        hi: "सभी देखें →",
        bn: "সব দেখুন →",
        te: "అన్నీ చూడండి →",
        mr: "सर्व पहा →",
        ta: "அனைத்தும் காண் →",
    }), []);

    // Handle Quick Tool clicks - memoized for performance
    const handleToolClick = useCallback((toolId: string) => {
        if (toolId === "weather" && weatherData) {
            setShowWeatherDetail(true);
        } else if (toolId === "crop") {
            setShowCropExplorer(true);
        } else if (toolId === "schemes") {
            onToolClick("schemes");
        } else {
            onToolClick(toolId);
        }
    }, [weatherData, onToolClick]);

    // Memoized back handlers
    const handleWeatherBack = useCallback(() => setShowWeatherDetail(false), []);
    const handleCropBack = useCallback(() => setShowCropExplorer(false), []);
    const handleLocationRequest = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("HomeScreen: Location request triggered");
        requestLocation();
    }, [requestLocation]);
    const handleWeatherCardClick = useCallback(() => setShowWeatherDetail(true), []);
    const handleViewAllSchemes = useCallback(() => onToolClick("schemes"), [onToolClick]);

    return (
        <AnimatePresence mode="wait">
            {showWeatherDetail && weatherData ? (
                <WeatherDetailView
                    key="weather-detail"
                    weather={weatherData}
                    onBack={handleWeatherBack}
                    lang={lang}
                />
            ) : showCropExplorer ? (
                <CropExplorerView
                    key="crop-explorer"
                    lang={lang}
                    onBack={handleCropBack}
                />
            ) : (
                <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Weather Sky - Full width edge-to-edge */}
                    <div className="w-full">
                        {weatherData && (
                            <WeatherSky
                                weather={weatherData.current}
                                locationGranted={locationGranted}
                                loading={loading}
                                lang={lang}
                                onRequestLocation={handleLocationRequest}
                                onClick={handleWeatherCardClick}
                            />
                        )}
                    </div>

                    {/* Content area - Center-contained for large screens */}
                    <div className="mx-auto" style={{ maxWidth: 1000 }}>
                        {/* Welcome + Notification */}
                        <div className="flex items-center justify-between px-4 py-4 lg:py-6">
                            <div className="flex-1 min-w-0 mr-3">
                                <p className="text-base lg:text-xl font-bold truncate" style={{ color: "#1B5E20" }}>
                                    {greeting} 👨‍🌾
                                </p>
                                <p className="text-xs lg:text-sm mt-1 truncate" style={{ color: "#6B7280" }}>
                                    {t("home.farmQuestion", lang)}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <LanguageSelector
                                    currentLanguage={lang}
                                    onLanguageChange={onLangChange}
                                    variant="button"
                                />
                                <button id="notif-btn"
                                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center relative shadow-sm flex-shrink-0"
                                    style={{ background: "#E8F5E9", border: "1px solid #C8E6C9" }}>
                                    <span className="text-xl lg:text-2xl">🔔</span>
                                    <span className="notif-badge absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 rounded-full text-white text-xs flex items-center justify-center border-2 border-white"
                                        style={{ background: "#C62828", fontSize: 10 }}>3</span>
                                </button>
                            </div>
                        </div>

                        {/* Quick Tools */}
                        <div className="px-4 mb-6 lg:mb-8">
                            <p className="section-title mb-4 lg:text-lg">
                                {t("home.quickTools", lang)}
                            </p>
                            <div className="grid grid-cols-4 gap-3 lg:gap-5">
                                {QUICK_TOOLS.map((tool, idx) => (
                                    <motion.button
                                        key={tool.id}
                                        whileTap={{ scale: 0.92 }}
                                        whileHover={{ y: -3, boxShadow: "0 8px 16px rgba(0,0,0,0.06)" }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => handleToolClick(tool.id)}
                                        id={`tool-${tool.id}`}
                                        className="tool-card lg:p-4"
                                        style={{ background: `linear-gradient(135deg,#fff,${tool.color})`, borderRadius: 16 }}
                                    >
                                        <span className="text-3xl lg:text-4xl mb-1">{tool.icon}</span>
                                        <span className="text-xs lg:text-sm font-bold leading-tight" style={{ color: tool.accent }}>
                                            {getToolLabel(tool, lang)}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Top 5 Government Schemes */}
                        <div className="mb-6 lg:mb-8">
                            <div className="flex items-center justify-between px-4 mb-4">
                                <p className="section-title lg:text-lg">
                                    {topSchemesLabel[lang]}
                                </p>
                                <button
                                    className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                                    style={{ background: "#E8F5E9", color: "#2E7D32" }}
                                    onClick={handleViewAllSchemes}
                                >
                                    {viewAllLabel[lang]}
                                </button>
                            </div>

                            {/* Horizontal Scroll Schemes */}
                            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-2">
                                {TOP_SCHEMES.map((scheme, idx) => (
                                    <SchemeCard
                                        key={scheme.id}
                                        scheme={scheme}
                                        lang={lang}
                                        index={idx}
                                        onClick={handleViewAllSchemes}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Tip of the day */}
                        <div className="px-4 mb-6 lg:mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="rounded-2xl lg:rounded-3xl p-5 lg:p-6 flex items-start lg:items-center gap-4 shadow-md overflow-hidden relative"
                                style={{ background: "linear-gradient(135deg,#2E7D32,#43A047)" }}
                            >
                                {/* Decorative circles */}
                                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20" style={{ background: "white" }} />
                                <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full opacity-10" style={{ background: "white" }} />

                                <span className="text-3xl lg:text-4xl flex-shrink-0 drop-shadow-sm relative z-10">💡</span>
                                <div className="relative z-10">
                                    <p className="text-white font-bold text-sm lg:text-base mb-1.5">
                                        {t("home.tipOfDay", lang)}
                                    </p>
                                    <p className="text-white/90 text-sm lg:text-[15px] leading-relaxed">
                                        {t("home.tipText", lang)}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
