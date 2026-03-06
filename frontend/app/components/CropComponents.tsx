"use client";
import { motion } from "framer-motion";
import { Language } from "../lib/translations";

export const CROPS = [
    {
        id: "rice", name: "Rice", nameHi: "चावल", emoji: "🌾", color: "#E8F5E9",
        about: "Rice is the most important crop in India, grown in paddy fields.", season: "Kharif (Jun-Nov)",
        soil: "Clayey / Loamy soil", water: "High – 1200-2000mm", disease: "Blast, Brown Spot, Sheath Blight",
        fertilizer: "NPK 120:60:60 kg/ha", harvest: "120-150 days after sowing"
    },
    {
        id: "wheat", name: "Wheat", nameHi: "गेहूं", emoji: "🌿", color: "#FFF8E1",
        about: "Wheat is the second most important cereal crop grown in Rabi season.", season: "Rabi (Nov-Apr)",
        soil: "Loamy / Clay Loam soil", water: "Medium – 450-650mm", disease: "Rust, Smut, Powdery Mildew",
        fertilizer: "NPK 120:60:40 kg/ha", harvest: "100-120 days after sowing"
    },
    {
        id: "cotton", name: "Cotton", nameHi: "कपास", emoji: "🌸", color: "#F3E5F5",
        about: "Cotton is a major cash crop and fiber crop grown in India.", season: "Kharif (Apr-Nov)",
        soil: "Black / Deep Loamy soil", water: "Medium – 500-700mm", disease: "Bollworm, Blight, Fusarium Wilt",
        fertilizer: "NPK 150:60:60 kg/ha", harvest: "150-180 days after sowing"
    },
    {
        id: "chilli", name: "Chilli", nameHi: "मिर्च", emoji: "🌶️", color: "#FFEBEE",
        about: "Chilli is a spice crop and an important vegetable grown across India.", season: "Year-round",
        soil: "Sandy Loam / Red soils", water: "Moderate – 600-1200mm", disease: "Leaf Curl, Anthracnose, Powdery Mildew",
        fertilizer: "NPK 100:50:50 kg/ha", harvest: "75-120 days after transplanting"
    },
    {
        id: "maize", name: "Maize", nameHi: "मक्का", emoji: "🌽", color: "#FFF3E0",
        about: "Maize is a versatile crop used for food, fodder and industry.", season: "Kharif + Rabi",
        soil: "Sandy Loam / Silt Loam", water: "Moderate – 500-800mm", disease: "Downy Mildew, Stem Rot, Smut",
        fertilizer: "NPK 120:60:40 kg/ha", harvest: "80-100 days after sowing"
    },
    {
        id: "soybean", name: "Soybean", nameHi: "सोयाबीन", emoji: "🫘", color: "#E8F5E9",
        about: "Soybean is a protein-rich legume crop and an important oilseed.", season: "Kharif (Jun-Oct)",
        soil: "Well-drained Loamy soil", water: "Moderate – 450-700mm", disease: "Yellow Mosaic, Stem Canker",
        fertilizer: "NPK 30:60:40 kg/ha", harvest: "80-120 days after sowing"
    },
    {
        id: "tomato", name: "Tomato", nameHi: "टमाटर", emoji: "🍅", color: "#FFEBEE",
        about: "Tomato is a major vegetable crop rich in vitamins and minerals.", season: "Year-round",
        soil: "Well-drained Sandy Loam", water: "High – 600-800mm", disease: "Blight, Leaf Curl, Wilt",
        fertilizer: "NPK 120:80:60 kg/ha", harvest: "70-90 days after transplanting"
    },
    {
        id: "potato", name: "Potato", nameHi: "आलू", emoji: "🥔", color: "#FFF3E0",
        about: "Potato is a vital tuber crop grown extensively in India.", season: "Rabi (Oct-Mar)",
        soil: "Sandy Loam to Clay Loam", water: "Medium – 500-700mm", disease: "Late Blight, Scab, Virus",
        fertilizer: "NPK 150:80:100 kg/ha", harvest: "90-120 days after planting"
    },
    {
        id: "sugarcane", name: "Sugarcane", nameHi: "गन्ना", emoji: "🎋", color: "#F1F8E9",
        about: "Sugarcane is the main source of sugar and a major cash crop.", season: "Spring / Autumn",
        soil: "Deep Rich Loamy soil", water: "Very High – 1500-2500mm", disease: "Red Rot, Smut, Wilt",
        fertilizer: "NPK 250:100:100 kg/ha", harvest: "10-14 months after planting"
    },
];

const INFO_SECTIONS = [
    { key: "about", icon: "📖", label: "About Crop", labelHi: "फसल के बारे में" },
    { key: "season", icon: "🗓️", label: "Best Season", labelHi: "सर्वोत्तम मौसम" },
    { key: "soil", icon: "🪨", label: "Soil Type", labelHi: "मिट्टी का प्रकार" },
    { key: "water", icon: "💧", label: "Water Requirement", labelHi: "पानी की जरूरत" },
    { key: "disease", icon: "🦠", label: "Diseases", labelHi: "रोग" },
    { key: "fertilizer", icon: "🧪", label: "Fertilizer", labelHi: "उर्वरक" },
    { key: "harvest", icon: "🌾", label: "Harvesting", labelHi: "कटाई" },
];

export function CropCard({ crop, onClick }: { crop: typeof CROPS[0]; onClick: () => void }) {
    return (
        <motion.div
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.04, y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={onClick}
            className="crop-card flex-shrink-0 cursor-pointer overflow-hidden bg-white"
            style={{ width: 96, borderRadius: 16, border: "1px solid #E8F5E9" }}
        >
            <div className="w-full h-20 flex items-center justify-center text-4xl rounded-t-2xl"
                style={{ background: crop.color }}>
                {crop.emoji}
            </div>
            <div className="py-2 text-center">
                <p className="text-xs font-semibold" style={{ color: "#1B5E20" }}>{crop.name}</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>{crop.nameHi}</p>
            </div>
        </motion.div>
    );
}

export function CropDetailView({
    crop,
    onBack,
    lang,
}: {
    crop: typeof CROPS[0];
    onBack: () => void;
    lang: Language;
}) {
    return (
        <motion.div
            key="crop-detail"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="flex flex-col flex-1 overflow-y-auto hide-scrollbar"
        >
            {/* Banner */}
            <div className="relative flex items-center justify-center"
                style={{ height: 180, background: crop.color }}>
                <span style={{ fontSize: 90, lineHeight: 1 }}>{crop.emoji}</span>
                <button onClick={onBack}
                    className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow"
                    id="crop-detail-back">
                    ←
                </button>
                {/* Floating name */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full shadow-lg flex items-center gap-2"
                    style={{ background: "#2E7D32" }}>
                    <span className="text-white font-bold text-sm">🌾 {crop.name}</span>
                    <span className="text-white/70 text-xs">({crop.nameHi})</span>
                </div>
            </div>

            {/* Info cards */}
            <div className="flex-1 p-4 flex flex-col gap-3 pb-6">
                {INFO_SECTIONS.map((s, i) => (
                    <motion.div key={s.key}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 + 0.1 }}
                        className="farm-card p-4 flex items-start gap-3"
                    >
                        <span className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold mb-1" style={{ color: "#66BB6A" }}>
                                {lang === "hi" ? s.labelHi : s.label}
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
                                {crop[s.key as keyof typeof crop]}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
