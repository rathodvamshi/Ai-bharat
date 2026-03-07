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
        <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-slate-50 overflow-hidden font-sans">
            <AnimatePresence>
                {showSeed && <SeedGrow onDone={() => onLogin(phone)} lang={currentLang} />}
            </AnimatePresence>

            {/* Premium Dynamic Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <motion.div
                    animate={{
                        translateY: [0, 40, 0],
                        translateX: [0, -20, 0],
                        opacity: [0.3, 0.45, 0.3],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[15%] -left-[5%] w-[70%] h-[60%] bg-emerald-200/40 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        translateY: [0, -50, 0],
                        translateX: [0, 30, 0],
                        opacity: [0.2, 0.35, 0.2],
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[20%] -right-[15%] w-[80%] h-[70%] bg-blue-100/30 rounded-full blur-[140px]"
                />
            </div>

            {/* Main Login Card - Refined for Laptop View */}
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-10 w-full max-w-[420px] mx-4 sm:mx-0 bg-white/70 backdrop-blur-3xl rounded-[2.2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* Header Container */}
                <div className="px-8 pt-10 pb-4 space-y-6">
                    <div className="flex items-center justify-between">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={onBack}
                            className="w-10 h-10 rounded-2xl bg-white/80 border border-slate-100/50 shadow-sm flex items-center justify-center text-slate-800 hover:bg-white hover:text-emerald-600 transition-all"
                        >
                            <ArrowLeft size={18} />
                        </motion.button>
                        <div className="scale-90 origin-right">
                            <LanguageSelector
                                currentLanguage={currentLang}
                                onLanguageChange={l => { setCurrentLang(l); onLangChange?.(l); }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 bg-white rounded-2xl shadow-lg p-2 flex items-center justify-center border border-slate-50 shrink-0">
                            <Image src="/mainlogo.png" alt="logo" fill className="object-contain p-1.5" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate">Jan-Sahayak</h1>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 opacity-90 truncate">Farmer Digital Portal</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <motion.h2
                            key={isExistingUser === null ? 'welcome' : isExistingUser ? 'found' : 'new'}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl font-black text-slate-900 leading-tight"
                        >
                            {isExistingUser === null ? t("login.welcomeTo", currentLang) :
                                isExistingUser ? t("login.welcomeBack", currentLang) :
                                    t("login.createAccount", currentLang)}
                        </motion.h2>
                        <p className="text-slate-500 font-bold text-[13px] leading-relaxed max-w-[95%]">
                            {isChecking ? t("login.checkingNumber", currentLang) :
                                isExistingUser === null ? t("login.enterMobile", currentLang) :
                                    isExistingUser ? t("login.accountFound", currentLang) :
                                        t("login.noAccountFound", currentLang)}
                        </p>
                    </div>
                </div>

                {/* Form Section - Scrolled Area */}
                <div className="flex-1 px-8 py-4 space-y-5 overflow-y-auto no-scrollbar">
                    {/* Compact Phone Input */}
                    <div
                        className={`bg-white/60 rounded-[1.5rem] p-4 transition-all duration-300 border-2 ${focusedField === 'phone' ? 'border-emerald-500 shadow-xl shadow-emerald-100/40 bg-white' : 'border-slate-50/50 shadow-slate-200/10'}`}
                    >
                        <div className="flex items-center justify-between mb-3 px-1">
                            <label className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-1.5">
                                <ShieldCheck size={12} className="text-emerald-500" /> Secure Login
                            </label>
                            {isChecking && (
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 shadow-inner shrink-0">
                                <Image src="https://flagcdn.com/in.svg" alt="IN" width={16} height={10} className="rounded-sm shadow-sm" />
                                <span className="font-extrabold text-slate-900 text-xs tracking-tighter">+91</span>
                            </div>
                            <input
                                ref={phoneInputRef}
                                type="tel"
                                maxLength={10}
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                                onFocus={() => setFocusedField('phone')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Enter Mobile Number"
                                className="flex-1 bg-transparent text-base font-black tracking-widest text-slate-900 placeholder:text-slate-200 placeholder:font-black focus:outline-none min-w-0"
                            />
                            {isValidPhone && !isChecking && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Check size={14} strokeWidth={4} />
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Step 2 Features (Animated) */}
                    <AnimatePresence mode="wait">
                        {isStepTwo && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: 10 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: 10 }}
                                className="space-y-4 overflow-hidden"
                            >
                                <div className="bg-white/60 rounded-[1.5rem] overflow-hidden shadow-xl shadow-slate-200/5 border border-slate-50">
                                    {!isExistingUser && (
                                        <div className="p-4 px-5 border-b border-slate-50/50">
                                            <label className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 mb-1.5 block">Full Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder="Enter your name"
                                                className="w-full text-sm font-black text-slate-900 placeholder:text-slate-200 focus:outline-none bg-transparent"
                                            />
                                        </div>
                                    )}
                                    <div className="p-4 px-5 flex items-center gap-3">
                                        <div className="flex-1">
                                            <label className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 mb-1.5 block">Password</label>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full text-sm font-black text-slate-900 placeholder:text-slate-200 focus:outline-none bg-transparent"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center active:scale-95 transition-all shrink-0"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-2.5 bg-red-50/50 rounded-xl border border-red-100 flex items-center justify-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{error}</p>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Section */}
                <div className="px-8 pb-10 pt-4">
                    <motion.button
                        disabled={!isValidPhone || (isStepTwo && !isValidPassword) || isChecking}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAuth}
                        className={`group w-full relative overflow-hidden h-14 rounded-2xl flex items-center justify-between px-6 text-white font-black text-sm tracking-wide transition-all duration-300 ${(!isValidPhone || (isStepTwo && !isValidPassword) || isChecking) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 shadow-xl shadow-slate-300 active:bg-emerald-700'}`}
                    >
                        <span className="relative z-10">
                            {isChecking ? t("login.checkingNumber", currentLang) :
                                isExistingUser === null ? t("login.continue", currentLang) :
                                    isExistingUser ? t("login.loginButton", currentLang) :
                                        t("login.signupButton", currentLang)}
                        </span>
                        <div className="relative z-10 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-active:translate-x-1 transition-transform">
                            <ChevronRight size={18} />
                        </div>
                        {/* Animated background on valid */}
                        {!(!isValidPhone || (isStepTwo && !isValidPassword) || isChecking) && (
                            <motion.div
                                className="absolute inset-0 bg-emerald-600 -z-0"
                                initial={{ x: "-100%" }}
                                whileHover={{ x: "-80%" }}
                                transition={{ ease: "easeInOut", duration: 0.4 }}
                            />
                        )}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
