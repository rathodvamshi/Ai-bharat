"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, CloudRain } from "lucide-react";
import { t, Language } from "../lib/translations";

// ----------- TYPES -----------
export type WeatherType = "sunny" | "rainy" | "night" | "cloudy" | "morning" | "storm";

export interface WeatherData {
    type: WeatherType;
    temp: number;
    city: string;
    condition: string;
}

function useReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        if (!mql) return;
        const onChange = () => setReduced(Boolean(mql.matches));
        onChange();
        mql.addEventListener?.("change", onChange);
        return () => mql.removeEventListener?.("change", onChange);
    }, []);
    return reduced;
}

// ----------- WEATHER ICON -----------
function WeatherIcon({ type }: { type: WeatherType }) {
    const icons: Record<WeatherType, string> = {
        sunny: "☀️", morning: "🌅", cloudy: "⛅", rainy: "🌧️", storm: "⛈️", night: "🌙",
    };
    return <span className="text-3xl lg:text-4xl drop-shadow-lg">{icons[type]}</span>;
}



// ----------- MAIN COMPONENT -----------
export default function WeatherSky({
    weather,
    locationGranted,
    onRequestLocation,
    onClick,
    loading = false,
    lang = "en",
}: {
    weather: WeatherData;
    locationGranted: boolean;
    onRequestLocation: (e: React.MouseEvent) => void;
    onClick?: () => void;
    loading?: boolean;
    lang?: string;
}) {
    const [overrideType, setOverrideType] = useState<WeatherType | null>(null);
    const baseType = overrideType || weather.type;
    const effectiveType = (baseType === "storm" || (!overrideType && weather.condition?.toLowerCase().includes("thunder")) ? "storm" : baseType) as WeatherType;
    const reducedMotion = useReducedMotion();
    const [lightning, setLightning] = useState(false);

    // Labels
    const enableLocLabel = t("home.enableLocation", lang as Language);
    const fetchingLabel = t("weather.detectingLocation", lang as Language);

    const skyClass = {
        sunny: "sky-sunny",
        rainy: "sky-rainy",
        storm: "sky-storm",
        night: "sky-night",
        cloudy: "sky-cloudy",
        morning: "sky-morning",
    }[effectiveType];

    // Lightning for storms (and occasional for rainy)
    useEffect(() => {
        if (reducedMotion) return;
        if (!(effectiveType === "storm" || effectiveType === "rainy")) return;

        let cancelled = false;
        let t1: number | null = null;
        let t2: number | null = null;
        let t3: number | null = null;

        const schedule = () => {
            const base = effectiveType === "storm" ? 3400 : 7600;
            const jitter = effectiveType === "storm" ? 2600 : 5200;
            const nextIn = base + Math.random() * jitter;

            t1 = window.setTimeout(() => {
                if (cancelled) return;
                // double-flash
                setLightning(true);
                t2 = window.setTimeout(() => {
                    setLightning(false);
                    t3 = window.setTimeout(() => {
                        setLightning(true);
                        window.setTimeout(() => setLightning(false), 90);
                    }, 140);
                }, 120);
                schedule();
            }, nextIn);
        };

        schedule();
        return () => {
            cancelled = true;
            if (t1) window.clearTimeout(t1);
            if (t2) window.clearTimeout(t2);
            if (t3) window.clearTimeout(t3);
        };
    }, [effectiveType, reducedMotion]);

    // Determine the video source based on the weather type
    const videoSource = (effectiveType === "rainy" || effectiveType === "storm")
        ? "/rainy.mp4"
        : "/sunshine.mp4";

    return (
        <motion.div
            className={`relative overflow-hidden weather-sky-container pb-4 ${skyClass} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{
                maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)"
            }}
        >
            {/* Background Video Animation */}
            <video
                key={videoSource}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
                src={videoSource}
            />
            {/* subtle film grain + depth overlay for text readability */}
            <div className="absolute inset-0 sky-atmosphere pointer-events-none z-[1] bg-black/30" aria-hidden="true" />

            {/* Lightning flash overlay */}
            {(effectiveType === "storm" || effectiveType === "rainy") && !reducedMotion && (
                <AnimatePresence>
                    {lightning && (
                        <motion.div
                            className="absolute inset-0 z-[8] pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: effectiveType === "storm" ? 0.55 : 0.28 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.08 }}
                            style={{
                                background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.25) 55%, rgba(255,255,255,0) 100%)",
                            }}
                            aria-hidden="true"
                        />
                    )}
                </AnimatePresence>
            )}

            {/* Location & Loading State UI */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading-loc"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full backdrop-blur-xl border border-white/20 flex items-center gap-2 shadow-xl pointer-events-none"
                        style={{ background: "rgba(0,0,0,0.45)" }}
                    >
                        <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-white text-[10px] lg:text-xs font-bold tracking-wide">
                            {fetchingLabel}
                        </span>
                    </motion.div>
                ) : !locationGranted && (
                    <motion.button
                        key="enable-loc"
                        type="button"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("Enable location button clicked (onClick)");
                            onRequestLocation(e);
                        }}
                        className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full text-xs font-bold z-50 flex items-center gap-2 backdrop-blur-md transition-all shadow-xl touch-manipulation select-none cursor-pointer active:scale-95"
                        style={{
                            background: "rgba(255,255,255,0.95)",
                            color: "#1B5E20",
                            border: "2px solid rgba(46, 125, 50, 0.3)",
                            minHeight: "44px", // iOS recommended touch target
                            WebkitTapHighlightColor: "transparent"
                        }}
                    >
                        <span className="text-base">📍</span>
                        <span className="tracking-tight whitespace-nowrap">{enableLocLabel}</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Weather Info Display */}
            <div
                className="absolute bottom-0 left-0 right-0 z-[10] pb-12 lg:pb-16 pt-20 lg:pt-32"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0) 100%)" }}
            >
                <div className="px-4 lg:px-8 flex items-end justify-between">
                    {/* Left: Temp & Location */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 lg:gap-4">
                            <h1 className="text-5xl lg:text-7xl font-black text-white leading-none tracking-tight"
                                style={{ textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
                                {weather.temp}°
                            </h1>
                            <div className="flex flex-col">
                                <WeatherIcon type={effectiveType} />
                                <motion.p
                                    className="text-white/90 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.15em] lg:tracking-[0.2em] mt-1"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    {locationGranted ? "LIVE" : "DEMO"}
                                </motion.p>
                            </div>
                        </div>
                        <motion.div
                            className="flex items-center gap-2 mt-3 lg:mt-4"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.12 }}
                        >
                            <div className="bg-black/25 backdrop-blur-md px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 lg:gap-2">
                                <span className="text-white/90 text-xs lg:text-sm">📍</span>
                                <span className="text-white font-bold text-sm lg:text-base tracking-wide max-w-[140px] lg:max-w-none truncate">
                                    {weather.city}
                                </span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Condition & Date */}
                    <div className="text-right flex flex-col items-end">
                        <p className="text-white font-black text-base lg:text-xl drop-shadow-xl capitalize tracking-wide mb-1">
                            {weather.condition}
                        </p>
                        <div className="bg-white/10 backdrop-blur-md px-2.5 lg:px-3 py-1 rounded-lg border border-white/5">
                            <p className="text-white/90 text-[10px] lg:text-xs font-bold tracking-wider lg:tracking-widest uppercase">
                                {new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric" })}
                            </p>
                        </div>

                        {onClick && (
                            <motion.p
                                className="text-white/70 text-[9px] lg:text-[10px] mt-3 lg:mt-4 flex items-center gap-1 lg:gap-1.5 justify-end font-bold tracking-[0.1em] lg:tracking-[0.15em] uppercase"
                                animate={{ x: [0, 3, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                Tap for details <span>→</span>
                            </motion.p>
                        )}

                        {/* Sun/Rain Toggle */}
                        <div className="mt-3 lg:mt-4 flex items-center justify-end gap-1 bg-black/40 p-1 lg:p-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg relative z-20 overflow-hidden">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); setOverrideType('sunny'); }}
                                className={`relative w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs transition-colors duration-300 z-10 ${(!overrideType && effectiveType === 'sunny') || overrideType === 'sunny' ? 'text-white' : 'text-white/60'}`}
                                title="Sunny"
                            >
                                {((!overrideType && effectiveType === 'sunny') || overrideType === 'sunny') && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <motion.div animate={{ rotate: ((!overrideType && effectiveType === 'sunny') || overrideType === 'sunny') ? 180 : 0 }} transition={{ duration: 0.5 }} className="relative z-20">
                                    <Sun size={14} strokeWidth={2.5} />
                                </motion.div>
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); setOverrideType('rainy'); }}
                                className={`relative w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs transition-colors duration-300 z-10 ${(!overrideType && effectiveType === 'rainy') || overrideType === 'rainy' ? 'text-white' : 'text-white/60'}`}
                                title="Rainy"
                            >
                                {((!overrideType && effectiveType === 'rainy') || overrideType === 'rainy') && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.6)]"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <motion.div animate={{ y: ((!overrideType && effectiveType === 'rainy') || overrideType === 'rainy') ? [0, 2, 0] : 0 }} transition={{ duration: 1, repeat: ((!overrideType && effectiveType === 'rainy') || overrideType === 'rainy') ? Infinity : 0 }} className="relative z-20">
                                    <CloudRain size={14} strokeWidth={2.5} />
                                </motion.div>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
