"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, MapPin, Tablet, Phone, Edit3, LogOut,
    Globe, Check, X, Camera, ShieldCheck, Lock
} from "lucide-react";
import { Language } from "../lib/translations";
import { useAuth } from "../contexts/AuthContext";

const LANGUAGES = [
    { code: "hi", label: "हिंदी", flag: "🇮🇳" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "te", label: "తెలుగు", flag: "🇮🇳" },
];

export default function ProfileScreen({
    lang,
    onLangChange,
}: {
    lang: Language;
    onLangChange: (l: Language) => void;
}) {
    const { user, logout, updateProfile, updatePhone } = useAuth();

    // States for editing
    const [editMode, setEditMode] = useState(false);
    const [showLangPicker, setShowLangPicker] = useState(false);

    // Profile Fields (Local states for editing)
    const [name, setName] = useState(user?.name || "");
    const [village, setVillage] = useState(user?.village || "");
    const [district, setDistrict] = useState(user?.district || "");
    const [land, setLand] = useState(user?.land || "");

    // Phone Update Flow
    const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [phoneStep, setPhoneStep] = useState(1); // 1: Verify Pwd, 2: Enter New Phone
    const [phoneError, setPhoneError] = useState("");

    const handleSaveProfile = async () => {
        const success = await updateProfile({ name, village, district, land });
        if (success) setEditMode(false);
    };

    const handlePhoneUpdate = async () => {
        setPhoneError("");
        if (phoneStep === 1) {
            // No direct way to verify pwd without action, so we move to step 2 
            // and the backend will verify both at once
            setPhoneStep(2);
        } else {
            const success = await updatePhone(currentPassword, newPhone);
            if (success) {
                setIsUpdatingPhone(false);
                setPhoneStep(1);
                setCurrentPassword("");
                setNewPhone("");
            } else {
                setPhoneError(lang === "hi" ? "गलत पासवर्ड या नंबर पहले से मौजूद है" : "Incorrect password or number already exists");
            }
        }
    };

    if (!user) return null;

    return (
        <div className="flex flex-col min-h-full bg-slate-50 relative pb-20">
            {/* Header / Logo Section */}
            <div className="bg-white px-6 pt-12 pb-6 flex items-center justify-between border-b border-gray-100 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12">
                        <Image src="/mainlogo.png" alt="logo" fill className="object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 leading-tight">Jan-Sahayak</h1>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Digital Farmer Profile</p>
                    </div>
                </div>
                <button onClick={() => setShowLangPicker(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-600">
                    <Globe size={14} /> {lang === "hi" ? "भाषा" : "Lang"}
                </button>
            </div>

            {/* Profile Hero Card */}
            <div className="px-6 -mt-0.5">
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2.5rem] p-8 shadow-2xl shadow-emerald-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="relative group mb-6">
                            <div className="w-28 h-28 rounded-[2rem] bg-white p-1.5 shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                <div className="w-full h-full rounded-[1.7rem] bg-emerald-50 flex items-center justify-center overflow-hidden border-2 border-emerald-100">
                                    {user.profile_image ? (
                                        <Image src={user.profile_image} alt="profile" fill className="object-cover" />
                                    ) : (
                                        <User size={48} className="text-emerald-300" />
                                    )}
                                </div>
                            </div>
                            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg border border-emerald-50">
                                <Camera size={18} />
                            </button>
                        </div>

                        {editMode ? (
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-white/20 border-2 border-white/30 rounded-2xl px-4 py-2 text-center text-white font-black text-2xl placeholder:text-white/50 focus:outline-none focus:bg-white/30"
                                placeholder="Enter Name"
                            />
                        ) : (
                            <>
                                <h2 className="text-3xl font-black text-white tracking-tight text-center">{user.name || "Aadhaar User"}</h2>
                                <p className="text-emerald-100 font-bold tracking-[0.2em] uppercase text-[11px] mt-2 bg-white/10 px-4 py-1 rounded-full">+91 {user.phone}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="px-6 mt-10 space-y-8">
                <div>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Personal Details</h3>
                        <button
                            onClick={() => editMode ? handleSaveProfile() : setEditMode(true)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${editMode ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-white text-gray-900 border border-gray-100 shadow-sm"}`}
                        >
                            {editMode ? <><Check size={14} /> SAVE</> : <><Edit3 size={14} /> EDIT</>}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { key: "village", icon: MapPin, label: "Village", value: village, current: user.village, setter: setVillage },
                            { key: "district", icon: Tablet, label: "District", value: district, current: user.district, setter: setDistrict },
                            { key: "land", icon: ShieldCheck, label: "Land Ownership", value: land, current: user.land, setter: setLand },
                        ].map(item => (
                            <div key={item.key} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-50 flex flex-col gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <item.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{item.label}</p>
                                    {editMode ? (
                                        <input
                                            value={item.value}
                                            onChange={e => item.setter(e.target.value)}
                                            className="w-full text-sm font-black text-gray-900 border-b border-emerald-100 focus:outline-none focus:border-emerald-500 bg-transparent"
                                        />
                                    ) : (
                                        <p className="text-sm font-black text-gray-900">{item.current || "Not Set"}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">Account Safety</h3>

                    {/* Phone Change Row */}
                    <button
                        onClick={() => setIsUpdatingPhone(true)}
                        className="w-full bg-white rounded-[2rem] p-5 shadow-sm border border-gray-50 flex items-center justify-between group hover:border-emerald-500 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Phone size={24} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Primary Number</p>
                                <p className="text-sm font-black text-gray-900">+91 {user.phone}</p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                            <Edit3 size={16} />
                        </div>
                    </button>

                    <button
                        onClick={logout}
                        className="w-full bg-red-50 rounded-[2rem] p-5 border border-red-100 flex items-center gap-4 text-red-600 font-black text-sm"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                            <LogOut size={24} />
                        </div>
                        Sign Out of Account
                    </button>
                </div>
            </div>

            {/* Change Number Modal */}
            <AnimatePresence>
                {isUpdatingPhone && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-lg bg-white rounded-[3rem] p-8 overflow-hidden relative shadow-2xl">
                            <button onClick={() => setIsUpdatingPhone(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100">
                                <X size={24} className="text-gray-400" />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-6">
                                    <ShieldCheck size={32} />
                                </div>
                                <h4 className="text-xl font-black text-gray-900 mb-2">Change Mobile Number</h4>
                                <p className="text-sm text-gray-400 px-8 leading-relaxed mb-8">
                                    Secure update requires your current password to verify identity.
                                </p>

                                <div className="w-full space-y-6">
                                    {phoneStep === 1 ? (
                                        <div className="bg-gray-50 rounded-3xl p-6 border-2 border-transparent focus-within:border-blue-500 transition-all">
                                            <label className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
                                                <Lock size={12} /> ENTER CURRENT PASSWORD
                                            </label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={e => setCurrentPassword(e.target.value)}
                                                className="w-full bg-transparent text-xl font-black focus:outline-none"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-3xl p-6 border-2 border-transparent focus-within:border-emerald-500 transition-all">
                                            <label className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
                                                <Phone size={12} /> ENTER NEW 10-DIGIT NUMBER
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <span className="text-lg font-black text-gray-400">+91</span>
                                                <input
                                                    type="tel"
                                                    maxLength={10}
                                                    value={newPhone}
                                                    onChange={e => setNewPhone(e.target.value.replace(/\D/g, ""))}
                                                    className="w-full bg-transparent text-xl font-black focus:outline-none"
                                                    placeholder="00000 00000"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {phoneError && <p className="text-red-500 text-xs font-bold">{phoneError}</p>}

                                    <button
                                        onClick={handlePhoneUpdate}
                                        disabled={phoneStep === 2 && newPhone.length !== 10 || !currentPassword}
                                        className="w-full bg-gray-900 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-gray-200 active:scale-95 disabled:opacity-50 transition-all "
                                    >
                                        {phoneStep === 1 ? "Next Step" : "Update Number"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Language Picker */}
            <AnimatePresence>
                {showLangPicker && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8 bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-lg bg-white rounded-[3rem] p-8 shadow-2xl">
                            <h3 className="font-black text-xl mb-6 text-emerald-900 text-center">Select Preferred Language</h3>
                            <div className="grid gap-3">
                                {LANGUAGES.map(l => (
                                    <button
                                        key={l.code}
                                        onClick={() => {
                                            onLangChange(l.code as any);
                                            setShowLangPicker(false);
                                        }}
                                        className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all ${lang === l.code ? "bg-emerald-50 border-emerald-500" : "bg-gray-50 border-transparent hover:bg-gray-100"}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{l.flag}</span>
                                            <span className="font-black text-gray-900">{l.label}</span>
                                        </div>
                                        {lang === l.code && <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white"><Check size={14} /></div>}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowLangPicker(false)} className="w-full mt-6 py-4 text-sm font-black text-gray-400">Cancel</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
