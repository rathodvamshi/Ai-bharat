"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Language } from "../lib/translations";
import { useNavigation, SchemeContext } from "../contexts/NavigationContext";

export const SCHEMES = [
    {
        id: "pmkisan", name: "PM-KISAN", nameHi: "पीएम-किसान", icon: "🌾", category: "agriculture",
        benefit: "₹6,000/year", benefitHi: "₹6,000/वर्ष", desc: "Direct income support for farmers",
        descHi: "किसानों को सीधे आर्थिक सहायता", color: "#E8F5E9", tag: "#2E7D32"
    },
    {
        id: "pmfby", name: "PM Fasal Bima", nameHi: "पीएम फसल बीमा", icon: "🛡️", category: "agriculture",
        benefit: "Crop Insurance", benefitHi: "फसल बीमा", desc: "Coverage against crop loss or natural disasters",
        descHi: "फसल नुकसान पर मुआवजा", color: "#E3F2FD", tag: "#1565C0"
    },
    {
        id: "kcc", name: "Kisan Credit Card", nameHi: "किसान क्रेडिट कार्ड", icon: "💳", category: "finance",
        benefit: "Low interest loan", benefitHi: "कम ब्याज पर लोन", desc: "Easy credit for farmers at 4% interest",
        descHi: "4% ब्याज पर खेती के लिए लोन", color: "#FFF3E0", tag: "#E65100"
    },
    {
        id: "pmay", name: "PM Awas Yojana", nameHi: "पीएम आवास योजना", icon: "🏠", category: "housing",
        benefit: "Up to ₹2.5 Lakh", benefitHi: "₹2.5 लाख तक", desc: "Subsidy for constructing a pucca house",
        descHi: "पक्का घर बनाने के लिए सहायता", color: "#FFF8E1", tag: "#F57F17"
    },
    {
        id: "ayushman", name: "Ayushman Bharat", nameHi: "आयुष्मान भारत", icon: "🏥", category: "health",
        benefit: "₹5 Lakh/year", benefitHi: "₹5 लाख/वर्ष", desc: "Free health insurance for BPL families",
        descHi: "मुफ्त स्वास्थ्य बीमा", color: "#FFEBEE", tag: "#C62828"
    },
    {
        id: "apy", name: "Atal Pension Yojana", nameHi: "अटल पेंशन योजना", icon: "👴", category: "pension",
        benefit: "₹1000-5000/month", benefitHi: "₹1000-5000/माह", desc: "Guaranteed pension after age 60",
        descHi: "60 साल बाद पेंशन की गारंटी", color: "#EDE7F6", tag: "#4527A0"
    },
    {
        id: "subsidy", name: "Fertilizer Subsidy", nameHi: "उर्वरक सब्सिडी", icon: "🧪", category: "agriculture",
        benefit: "50% subsidy", benefitHi: "50% छूट", desc: "Subsidized fertilizers for small farmers",
        descHi: "छोटे किसानों के लिए सस्ते उर्वरक", color: "#E8F5E9", tag: "#2E7D32"
    },
    {
        id: "soil", name: "Soil Health Card", nameHi: "मृदा स्वास्थ्य कार्ड", icon: "🪨", category: "agriculture",
        benefit: "Free Testing", benefitHi: "मुफ्त परीक्षण", desc: "Free soil testing and nutrient recommendations",
        descHi: "मुफ्त मिट्टी जांच और सिफारिशें", color: "#FFF3E0", tag: "#E65100"
    },
];

const CATEGORIES = [
    { id: "all", label: "All", labelHi: "सभी", emoji: "🌟" },
    { id: "agriculture", label: "Agriculture", labelHi: "कृषि", emoji: "🌾" },
    { id: "finance", label: "Finance", labelHi: "वित्त", emoji: "💰" },
    { id: "housing", label: "Housing", labelHi: "आवास", emoji: "🏠" },
    { id: "health", label: "Health", labelHi: "स्वास्थ्य", emoji: "🏥" },
    { id: "pension", label: "Pension", labelHi: "पेंशन", emoji: "👴" },
];

// Arrow icon for apply button
const ArrowRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

function SchemeCard({
    scheme,
    lang,
    index,
    onApply
}: {
    scheme: typeof SCHEMES[0];
    lang: Language;
    index: number;
    onApply: (scheme: SchemeContext) => void;
}) {
    const handleApply = () => {
        onApply({
            id: scheme.id,
            name: scheme.name,
            nameHi: scheme.nameHi,
            desc: scheme.desc,
            descHi: scheme.descHi,
            benefit: scheme.benefit,
            benefitHi: scheme.benefitHi,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="farm-card p-4 flex items-start gap-3"
        >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: scheme.color }}>
                {scheme.icon}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm leading-tight" style={{ color: "#1B5E20" }}>
                    {lang === "hi" ? scheme.nameHi : scheme.name}
                </h3>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#6B7280" }}>
                    {lang === "hi" ? scheme.descHi : scheme.desc}
                </p>
                <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg flex-shrink-0"
                        style={{ background: scheme.color, color: scheme.tag }}>
                        {lang === "hi" ? scheme.benefitHi : scheme.benefit}
                    </span>
                    <motion.button
                        onClick={handleApply}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md"
                        style={{
                            background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
                            boxShadow: "0 2px 8px rgba(30, 94, 32, 0.3)"
                        }}
                        id={`apply-${scheme.id}`}
                    >
                        {lang === "hi" ? "आवेदन करें" : "Apply Now"}
                        <ArrowRightIcon />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

export default function SchemesScreen({ lang }: { lang: Language }) {
    const [category, setCategory] = useState("all");
    const { navigateToVoiceWithScheme } = useNavigation();
    const filtered = category === "all" ? SCHEMES : SCHEMES.filter(s => s.category === category);

    const handleApply = (scheme: SchemeContext) => {
        navigateToVoiceWithScheme(scheme);
    };

    return (
        <div className="flex flex-col min-h-full pb-2">
            <div className="px-4 pt-4 pb-2 sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {CATEGORIES.map(cat => (
                        <button key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            id={`cat-${cat.id}`}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                            style={category === cat.id
                                ? { background: "#2E7D32", color: "#fff" }
                                : { background: "#f9fafb", color: "#6B7280", border: "1px solid #E8F5E9" }}>
                            {cat.emoji} {lang === "hi" ? cat.labelHi : cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 pb-4 flex flex-col gap-3">
                {filtered.map((scheme, i) => (
                    <SchemeCard
                        key={scheme.id}
                        scheme={scheme}
                        lang={lang}
                        index={i}
                        onApply={handleApply}
                    />
                ))}
            </div>
        </div>
    );
}
