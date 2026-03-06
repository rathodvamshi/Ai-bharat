"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, Check, Sprout, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { Language, t } from "../lib/translations";
import LanguageSelector from "./LanguageSelector";
import { useAuth } from "../contexts/AuthContext";

// Seed grow animation shown after login click
function SeedGrow({ onDone, lang }: { onDone: () => void; lang: Language }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
            onAnimationComplete={() => setTimeout(onDone, 1800)}
        >
            <div className="absolute inset-0 bg-emerald-50/50 backdrop-blur-3xl" />

            <div className="relative z-10 flex flex-col items-center">
                <div className="relative w-40 h-40 mb-8">
                    {/* Animated Glow */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-emerald-300 rounded-full blur-3xl"
                    />

                    <div className="relative w-full h-full bg-white rounded-[2.5rem] shadow-2xl p-6 flex items-center justify-center border-4 border-emerald-50">
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", damping: 12, stiffness: 100 }}
                        >
                            <Sprout className="w-20 h-20 text-emerald-600" />
                        </motion.div>
                    </div>
                </div>

                <h3 className="text-2xl font-black text-emerald-900 mb-2">Jan-Sahayak</h3>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-emerald-600/60 font-black uppercase tracking-[0.3em] text-[10px]"
                >
                    {t("login.loggingIn", lang)}
                </motion.p>
            </div>
        </motion.div>
    );
}

export default function LoginScreen({
    onBack,
    onLogin,
    lang = "hi",
    onLangChange,
}: {
    onBack: () => void;
    onLogin: (phone: string) => void;
    lang?: Language;
    onLangChange?: (lang: Language) => void;
}) {
    const { login, register, checkPhone } = useAuth();
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [showSeed, setShowSeed] = useState(false);
    const [currentLang, setCurrentLang] = useState<Language>(lang);
    const [error, setError] = useState("");

    const phoneInputRef = useRef<HTMLInputElement>(null);

    const isValidPhone = phone.length === 10;
    const isValidPassword = password.length >= 6;
    const isStepTwo = isValidPhone && isExistingUser !== null;

    useEffect(() => {
        // Auto-focus phone input on mount for speed
        phoneInputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (phone.length === 10) {
            setIsChecking(true);
            checkPhone(phone).then(exists => {
                setIsExistingUser(exists);
                setIsChecking(false);
            });
        } else {
            setIsExistingUser(null);
            setPassword("");
            setName("");
            setError("");
            setIsChecking(false);
        }
    }, [phone, checkPhone]);

    const handleAuth = async () => {
        setError("");
        if (isExistingUser) {
            const success = await login(phone, password);
            if (success) setShowSeed(true);
            else setError(t("login.errorIncorrect", currentLang));
        } else {
            const success = await register(phone, password, name);
            if (success) setShowSeed(true);
            else setError(t("login.errorSignup", currentLang));
        }
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-slate-50 flex flex-col">
            <AnimatePresence>
                {showSeed && <SeedGrow onDone={() => onLogin(phone)} lang={currentLang} />}
            </AnimatePresence>

            {/* Premium Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[80%] h-[40%] bg-emerald-200/40 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute top-[20%] -right-[20%] w-[90%] h-[50%] bg-blue-100/30 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[70%] h-[30%] bg-emerald-100/40 rounded-full blur-[80px]" />
            </div>

            {/* Header Content */}
            <header className="relative z-10 px-6 pt-12 pb-6">
                <div className="flex items-center justify-between mb-8">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onBack}
                        className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-800"
                    >
                        <ArrowLeft size={18} />
                    </motion.button>
                    <LanguageSelector
                        currentLanguage={currentLang}
                        onLanguageChange={l => { setCurrentLang(l); onLangChange?.(l); }}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-8"
                >
                    <div className="relative w-12 h-12 bg-white rounded-xl shadow-lg p-2 flex items-center justify-center border border-slate-50">
                        <Image src="/mainlogo.png" alt="logo" fill className="object-contain p-1.5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Jan-Sahayak</h1>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 opacity-80">Farmer Digital Platform</p>
                        </div>
                    </div>
                </motion.div>

                <div className="max-w-[90%]">
                    <motion.h2
                        key={isExistingUser === null ? 'welcome' : isExistingUser ? 'found' : 'new'}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-2xl font-black text-slate-900 leading-tight mb-2"
                    >
                        {isExistingUser === null ? t("login.welcomeTo", currentLang) :
                            isExistingUser ? t("login.welcomeBack", currentLang) :
                                t("login.createAccount", currentLang)}
                    </motion.h2>
                    <p className="text-slate-500 font-bold text-[13px] leading-relaxed">
                        {isChecking ? t("login.checkingNumber", currentLang) :
                            isExistingUser === null ? t("login.enterMobile", currentLang) :
                                isExistingUser ? t("login.accountFound", currentLang) :
                                    t("login.noAccountFound", currentLang)}
                    </p>
                </div>
            </header>

            {/* Inputs Section */}
            <main className="relative z-10 flex-1 px-6 space-y-6 pt-2">
                {/* Phone Input Card */}
                <motion.div
                    layout
                    className={`bg-white rounded-[1.8rem] p-5 shadow-xl transition-all duration-300 border-2 ${focusedField === 'phone' ? 'border-emerald-500 shadow-emerald-100/50' : 'border-transparent shadow-slate-200/10'}`}
                >
                    <label className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3 block flex items-center gap-2">
                        <ShieldCheck size={12} className="text-emerald-500" /> Secure Mobile Login
                    </label>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <Image src="https://flagcdn.com/in.svg" alt="IN" width={18} height={12} className="rounded-sm" />
                            <span className="font-black text-slate-900 text-sm">+91</span>
                        </div>
                        <input
                            ref={phoneInputRef}
                            type="tel"
                            maxLength={10}
                            value={phone}
                            onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Enter 10 digits"
                            className="flex-1 bg-transparent text-lg font-black tracking-widest text-slate-900 placeholder:text-slate-300 placeholder:font-bold focus:outline-none"
                        />
                        {isChecking && (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full"
                            />
                        )}
                        {isValidPhone && !isChecking && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Check size={16} strokeWidth={4} />
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Additional Details (Password/Name) */}
                <AnimatePresence>
                    {isStepTwo && (
                        <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            className="space-y-4"
                        >
                            <div className="bg-white rounded-[1.8rem] overflow-hidden shadow-xl shadow-slate-200/10 border border-slate-50">
                                {!isExistingUser && (
                                    <div className="p-5 border-b border-slate-50">
                                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2 block">Your Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="w-full text-base font-black text-slate-900 placeholder:text-slate-200 focus:outline-none bg-transparent"
                                        />
                                    </div>
                                )}
                                <div className="p-5 flex items-center gap-3">
                                    <div className="flex-1">
                                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2 block">Personal Password</label>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full text-base font-black text-slate-900 placeholder:text-slate-200 focus:outline-none bg-transparent"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center active:scale-90 transition-transform"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {password.length > 0 && !isValidPassword && (
                                <p className="text-[10px] font-black text-orange-500 px-6 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-orange-500" /> Min. 6 characters required
                                </p>
                            )}

                            {error && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-2 px-6 py-3 bg-red-50 rounded-2xl border border-red-100">
                                    <p className="text-[10px] font-black text-red-600 text-center uppercase tracking-wide">{error}</p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Bottom Section */}
            <footer className="relative z-10 px-6 pb-10 pt-8">
                <div className="bg-emerald-50 rounded-3xl p-4 flex items-center gap-3 border border-emerald-100 mb-8">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                        <Sparkles size={16} />
                    </div>
                    <p className="text-[11px] font-bold text-emerald-800 leading-snug">
                        {t("login.secureInfo", currentLang)}
                    </p>
                </div>

                <motion.button
                    disabled={!isValidPhone || (isStepTwo && !isValidPassword) || isChecking}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAuth}
                    className={`group w-full relative overflow-hidden h-16 rounded-[1.5rem] flex items-center justify-between px-6 text-white font-black text-base transition-all duration-300 ${(!isValidPhone || (isStepTwo && !isValidPassword) || isChecking) ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 shadow-xl shadow-slate-200 active:bg-emerald-600'}`}
                >
                    <span className="relative z-10">
                        {isExistingUser === null ? t("login.continue", currentLang) :
                            isExistingUser ? t("login.loginButton", currentLang) :
                                t("login.signupButton", currentLang)}
                    </span>
                    <div className="relative z-10 w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center group-active:translate-x-1 transition-transform">
                        <ChevronRight size={20} />
                    </div>
                    {/* Animated Wave Background */}
                    {!(!isValidPhone || (isStepTwo && !isValidPassword) || isChecking) && (
                        <motion.div
                            className="absolute inset-0 bg-emerald-600 -z-10"
                            initial={{ x: "-100%" }}
                            whileHover={{ x: "-80%" }}
                            transition={{ ease: "easeInOut", duration: 0.4 }}
                        />
                    )}
                </motion.button>
            </footer>
        </div>
    );
}
