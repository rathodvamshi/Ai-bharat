"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Language, LANGUAGES } from "../lib/translations";
import HomeScreen from "./HomeScreen";
import SchemesScreen from "./SchemesScreen";
import VoiceAssistantScreen from "./VoiceAssistantScreen";
import HistoryScreen from "./HistoryScreen";
import ProfileScreen from "./ProfileScreen";

type NavTab = "home" | "schemes" | "voice" | "history" | "profile";

const NAV_ITEMS: {
    id: NavTab;
    icon: string;
    label: string;
    labelHi: string;
    labelBn: string;
    labelTe: string;
    labelMr: string;
    labelTa: string;
}[] = [
        { id: "home", icon: "🏠", label: "Home", labelHi: "होम", labelBn: "হোম", labelTe: "హోమ్", labelMr: "होम", labelTa: "முகப்பு" },
        { id: "schemes", icon: "🏛️", label: "Schemes", labelHi: "योजनाएं", labelBn: "প্রকল্প", labelTe: "పథకాలు", labelMr: "योजना", labelTa: "திட்டங்கள்" },
        { id: "voice", icon: "🎤", label: "Talk", labelHi: "बोलें", labelBn: "কথা বলুন", labelTe: "మాట్లాడండి", labelMr: "बोला", labelTa: "பேசு" },
        { id: "history", icon: "📋", label: "History", labelHi: "इतिहास", labelBn: "ইতিহাস", labelTe: "చరిత్ర", labelMr: "इतिहास", labelTa: "வரலாறு" },
        { id: "profile", icon: "👤", label: "Profile", labelHi: "प्रोफ़ाइल", labelBn: "প্রোফাইল", labelTe: "ప్రొఫైల్", labelMr: "प्रोफाइल", labelTa: "சுயவிவரம்" },
    ];

const TAB_LABELS: Record<NavTab, Record<Language, string>> = {
    home: { en: "Janashayak", hi: "जन-सहायक", bn: "জন-সহায়ক", te: "జన్-సహాయక్", mr: "जन-सहायक", ta: "விவசாயி உதவியாளர்" },
    schemes: { en: "Government Schemes", hi: "सरकारी योजनाएं", bn: "সরকারি প্রকল্প", te: "ప్రభుత్వ పథకాలు", mr: "सरकारी योजना", ta: "அரசு திட்டங்கள்" },
    voice: { en: "Voice Assistant", hi: "वॉइस असिस्टेंट", bn: "ভয়েস অ্যাসিস্ট্যান্ট", te: "వాయిస్ అసిస్టెంట్", mr: "व्हॉइस असिस्टंट", ta: "குரல் உதவியாளர்" },
    history: { en: "My Applications", hi: "मेरे आवेदन", bn: "আমার আবেদন", te: "నా దరఖాస్తులు", mr: "माझे अर्ज", ta: "எனது விண்ணப்பங்கள்" },
    profile: { en: "My Profile", hi: "मेरी प्रोफ़ाइल", bn: "আমার প্রোফাইল", te: "నా ప్రొఫైల్", mr: "माझी प्रोफाइल", ta: "எனது சுயவிவரம்" },
};

function getNavLabel(item: typeof NAV_ITEMS[0], lang: Language): string {
    switch (lang) {
        case "hi": return item.labelHi;
        case "bn": return item.labelBn;
        case "te": return item.labelTe;
        case "mr": return item.labelMr;
        case "ta": return item.labelTa;
        default: return item.label;
    }
}

// ─── Collapsible Sidebar ─────────────────────────────────────────────────────
function SidebarNav({
    active,
    lang,
    phone,
    collapsed,
    onChange,
    onLangToggle,
}: {
    active: NavTab;
    lang: Language;
    phone: string;
    collapsed: boolean;
    onChange: (tab: NavTab) => void;
    onLangToggle: () => void;
}) {
    return (
        <motion.aside
            className="desktop-sidebar hide-scrollbar"
            animate={{ width: collapsed ? 68 : 240 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        >
            {/* Nav links */}
            <nav className="desktop-sidebar-nav hide-scrollbar">
                {NAV_ITEMS.map(item => {
                    const isActive = active === item.id;
                    const isMic = item.id === "voice";
                    return (
                        <motion.button
                            key={item.id}
                            id={`desk-nav-${item.id}`}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onChange(item.id)}
                            title={getNavLabel(item, lang)}
                            className={[
                                "desktop-nav-item",
                                isActive ? "desktop-nav-item--active" : "",
                                isMic ? "desktop-nav-item--mic" : "",
                            ].join(" ")}
                            style={{ justifyContent: collapsed ? "center" : "flex-start", marginTop: 8 }}
                        >
                            <span className="desktop-nav-icon">{item.icon}</span>

                            <AnimatePresence initial={false}>
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.18 }}
                                        style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                                        className="desktop-nav-label"
                                    >
                                        {getNavLabel(item, lang)}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {isActive && !collapsed && (
                                <motion.div
                                    layoutId="desktop-nav-indicator"
                                    className="desktop-nav-indicator"
                                />
                            )}
                        </motion.button>
                    );
                })}
            </nav>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Footer: lang + user */}
            <div className="desktop-sidebar-footer" style={{ alignItems: collapsed ? "center" : "stretch" }}>
                <button
                    id="desk-lang-toggle"
                    onClick={onLangToggle}
                    className="desktop-lang-btn"
                    title={lang === "hi" ? "Switch to EN" : "हिंदी में बदलें"}
                    style={{ justifyContent: collapsed ? "center" : "flex-start" }}
                >
                    <span>🌐</span>
                    <AnimatePresence initial={false}>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.18 }}
                                style={{ overflow: "hidden", whiteSpace: "nowrap", marginLeft: 6 }}
                            >
                                {lang === "hi" ? "Switch to EN" : "हिंदी में बदलें"}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                <div
                    className="desktop-user-pill"
                    style={{ justifyContent: collapsed ? "center" : "flex-start" }}
                >
                    <span className="desktop-user-avatar">👨‍🌾</span>
                    <AnimatePresence initial={false}>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.18 }}
                                style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                            >
                                <p className="desktop-user-name">{lang === "hi" ? "किसान" : "Farmer"}</p>
                                <p className="desktop-user-phone">+91 {phone || "XXXXXXXXXX"}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.aside>
    );
}

// ─── Desktop Top Bar ─────────────────────────────────────────────────────────
function DesktopHeader({
    lang,
    phone,
    collapsed,
    onLangToggle,
    onToggleCollapse,
}: {
    lang: Language;
    phone: string;
    collapsed: boolean;
    onLangToggle: () => void;
    onToggleCollapse: () => void;
}) {
    return (
        <header className="desktop-topbar">
            <div className="desktop-topbar-inner">
                {/* Left: hamburger + Logo + Title */}
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <button
                        onClick={onToggleCollapse}
                        className="desktop-hamburger"
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        id="desk-hamburger"
                        style={{ width: 36, height: 36 }}
                    >
                        <motion.span animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.25 }} style={{ display: 'inline-block', lineHeight: 1 }}>
                            {collapsed ? "☰" : "‹"}
                        </motion.span>
                    </button>

                    <div className="desktop-brand-logo" style={{ width: 40, height: 40, fontSize: 20 }}>🌾</div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <h1 className="desktop-brand-name">Janashayak</h1>
                        <p className="desktop-brand-sub" style={{ fontSize: 10, marginTop: "-2px" }}>जन-सहायक</p>
                    </div>
                </div>

                {/* Right: actions */}
                <div className="desktop-topbar-actions">
                    <button
                        id="desk-topbar-lang"
                        onClick={onLangToggle}
                        className="desktop-topbar-lang-btn"
                    >
                        🌐 {LANGUAGES.find(l => l.code === lang)?.nativeName || "हिंदी"}
                    </button>
                    <div className="desktop-topbar-notif">
                        <span>🔔</span>
                        <span className="desktop-notif-badge">3</span>
                    </div>
                    <div className="desktop-topbar-user">
                        <span>👨‍🌾</span>
                        <span className="desktop-topbar-phone">
                            +91 {phone ? phone.slice(0, 5) + "XXXXX" : "XXXXXXXXXX"}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}

// ─── Main Desktop Layout ─────────────────────────────────────────────────────
export default function DesktopLayout({
    phone,
    onLogout,
}: {
    phone: string;
    onLogout: () => void;
}) {
    const [tab, setTab] = useState<NavTab>("home");
    const [lang, setLang] = useState<Language>("hi");
    const [collapsed, setCollapsed] = useState(false);

    const toggleLang = () => setLang((p: Language) => {
        const cycle: Language[] = ["hi", "bn", "te", "mr", "ta", "en"];
        const idx = cycle.indexOf(p);
        return cycle[(idx + 1) % cycle.length];
    });
    const toggleCollapse = () => setCollapsed(p => !p);

    const handleToolClick = useCallback((tool: string) => {
        if (tool === "ai") setTab("voice");
        else if (tool === "weather") setTab("home");
        else if (tool === "schemes") setTab("schemes");
    }, []);

    return (
        <div className="desktop-root" style={{ flexDirection: "column" }}>
            {/* ── Top Panel: full-width ── */}
            <DesktopHeader
                lang={lang}
                phone={phone}
                collapsed={collapsed}
                onLangToggle={toggleLang}
                onToggleCollapse={toggleCollapse}
            />

            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* ── Collapsible Sidebar ── */}
                <SidebarNav
                    active={tab}
                    lang={lang}
                    phone={phone}
                    collapsed={collapsed}
                    onChange={setTab}
                    onLangToggle={toggleLang}
                />

                {/* ── Right Panel: main content ── */}
                <div className="desktop-main">
                    <div className="desktop-content-scroll hide-scrollbar">
                        <div className="desktop-content-container">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={tab}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.22 }}
                                    className="desktop-tab-content pb-4 lg:pb-6"
                                >
                                    {tab === "home" && (
                                        <div className="w-full">
                                            <HomeScreen
                                                phone={phone}
                                                lang={lang}
                                                onToolClick={handleToolClick}
                                                onLangChange={setLang}
                                            />
                                        </div>
                                    )}
                                    {tab === "schemes" && <div className="mx-auto px-4 lg:px-6 pt-4 lg:pt-6" style={{ maxWidth: 1000 }}><SchemesScreen lang={lang} /></div>}
                                    {tab === "voice" && <div className="mx-auto px-4 lg:px-6 pt-4 lg:pt-6" style={{ maxWidth: 1000 }}><VoiceAssistantScreen lang={lang} /></div>}
                                    {tab === "history" && <div className="mx-auto px-4 lg:px-6 pt-4 lg:pt-6" style={{ maxWidth: 1000 }}><HistoryScreen lang={lang} /></div>}
                                    {tab === "profile" && (
                                        <div className="mx-auto px-4 lg:px-6 pt-4 lg:pt-6" style={{ maxWidth: 1000 }}>
                                            <ProfileScreen
                                                phone={phone}
                                                lang={lang}
                                                onLangChange={setLang}
                                                onLogout={onLogout}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
