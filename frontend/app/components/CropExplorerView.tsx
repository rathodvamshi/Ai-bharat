"use client";
import { useState, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Language, t } from "../lib/translations";

// ─────────────────────────────────────────────
// CROP DATA - Organized by Field Categories
// ─────────────────────────────────────────────
const CROP_CATEGORIES = [
    {
        id: "cereals",
        name: "Cereals & Grains",
        nameHi: "अनाज एवं दाल",
        nameBn: "শস্য ও দানা",
        nameTe: "ధాన్యాలు",
        nameMr: "धान्य",
        nameTa: "தானியங்கள்",
        icon: "🌾",
        color: "#FFF8E1",
        gradient: "linear-gradient(135deg, #FFE082, #FFCA28)",
    },
    {
        id: "vegetables",
        name: "Vegetables",
        nameHi: "सब्जियां",
        nameBn: "শাকসবজি",
        nameTe: "కూరగాయలు",
        nameMr: "भाज्या",
        nameTa: "காய்கறிகள்",
        icon: "🥬",
        color: "#E8F5E9",
        gradient: "linear-gradient(135deg, #A5D6A7, #66BB6A)",
    },
    {
        id: "fruits",
        name: "Fruits",
        nameHi: "फल",
        nameBn: "ফল",
        nameTe: "పండ్లు",
        nameMr: "फळे",
        nameTa: "பழங்கள்",
        icon: "🍎",
        color: "#FFEBEE",
        gradient: "linear-gradient(135deg, #EF9A9A, #EF5350)",
    },
    {
        id: "cash",
        name: "Cash Crops",
        nameHi: "नकदी फसलें",
        nameBn: "নগদ ফসল",
        nameTe: "వాణిజ్య పంటలు",
        nameMr: "नगदी पिके",
        nameTa: "பணப்பயிர்கள்",
        icon: "💰",
        color: "#F3E5F5",
        gradient: "linear-gradient(135deg, #CE93D8, #AB47BC)",
    },
    {
        id: "spices",
        name: "Spices",
        nameHi: "मसाले",
        nameBn: "মশলা",
        nameTe: "సుగంధ ద్రవ్యాలు",
        nameMr: "मसाले",
        nameTa: "மசாலாக்கள்",
        icon: "🌶️",
        color: "#FFF3E0",
        gradient: "linear-gradient(135deg, #FFCC80, #FF9800)",
    },
    {
        id: "pulses",
        name: "Pulses & Legumes",
        nameHi: "दालें",
        nameBn: "ডাল",
        nameTe: "పప్పులు",
        nameMr: "कडधान्ये",
        nameTa: "பருப்புகள்",
        icon: "🫘",
        color: "#EFEBE9",
        gradient: "linear-gradient(135deg, #BCAAA4, #8D6E63)",
    },
];

export const ALL_CROPS = [
    // 🌾 CEREALS & GRAINS (10)
    {
        id: "rice", category: "cereals", name: "Rice", nameHi: "चावल", emoji: "🌾", color: "#E8F5E9",
        about: "Major Kharif crop grown in standing water.", aboutHi: "पानी में उगने वाली प्रमुख खरीफ फसल।",
        season: "Kharif (June-Nov)", seasonHi: "खरीफ (जून-नवंबर)",
        soil: "Clayey / Loamy", soilHi: "चिकनी / दोमट",
        water: "High (1500mm+)", waterHi: "अधिक (1500 मिमी+)",
        diseases: "Blast, Blight", diseasesHi: "ब्लास्ट, ब्लाइट",
        fertilizer: "NPK 120:60:60", fertilizerHi: "NPK 120:60:60",
        harvest: "120-150 days", harvestHi: "120-150 दिन"
    },
    {
        id: "wheat", category: "cereals", name: "Wheat", nameHi: "गेहूं", emoji: "🌿", color: "#FFF8E1",
        about: "Main Rabi cereal for bread and chapatis.", aboutHi: "रोटी के लिए मुख्य रबी अनाज।",
        season: "Rabi (Nov-April)", seasonHi: "रबी (नवंबर-अप्रैल)",
        soil: "Loamy / Clay Loam", soilHi: "दोमट / चिकनी दोमट",
        water: "Medium (500mm)", waterHi: "मध्यम (500 मिमी)",
        diseases: "Rust, Smut", diseasesHi: "रस्ट, स्मट",
        fertilizer: "NPK 120:60:40", fertilizerHi: "NPK 120:60:40",
        harvest: "100-120 days", harvestHi: "100-120 दिन"
    },
    {
        id: "maize", category: "cereals", name: "Maize", nameHi: "मक्का", emoji: "🌽", color: "#FFF3E0",
        about: "Versatile crop used for food and fodder.", aboutHi: "भोजन और चारे के लिए बहुमुखी फसल।",
        season: "Kharif & Rabi", seasonHi: "खरीफ और रबी",
        soil: "Sandy Loam", soilHi: "बलुई दोमट",
        water: "Moderate (600mm)", waterHi: "मध्यम (600 मिमी)",
        diseases: "Leaf Blight", diseasesHi: "लीफ ब्लाइट",
        fertilizer: "NPK 120:60:40", fertilizerHi: "NPK 120:60:40",
        harvest: "80-100 days", harvestHi: "80-100 दिन"
    },
    { id: "barley", category: "cereals", name: "Barley", nameHi: "जौ", emoji: "🌾", color: "#F5F5F5", about: "Hardy cereal for food and beer.", aboutHi: "भोजन और बियर के लिए सख्त अनाज।", season: "Rabi", seasonHi: "रबी", soil: "Sandy/Loamy", soilHi: "बलुई/दोमट", water: "Low", waterHi: "कम", diseases: "Mildew", diseasesHi: "मिल्ड्यू", fertilizer: "60:30:20", fertilizerHi: "60:30:20", harvest: "120 days", harvestHi: "120 दिन" },
    { id: "bajra", category: "cereals", name: "Pearl Millet", nameHi: "बाजरा", emoji: "🌾", color: "#EFEBE9", about: "Drought-tolerant millet.", aboutHi: "सूखा-सहिष्णु बाजरा।", season: "Kharif", seasonHi: "खरीफ", soil: "Sandy", soilHi: "बलुई", water: "Very Low", waterHi: "बहुत कम", diseases: "Ergot", diseasesHi: "एर्गोट", fertilizer: "80:40:40", fertilizerHi: "80:40:40", harvest: "90 days", harvestHi: "90 दिन" },
    { id: "jowar", category: "cereals", name: "Sorghum", nameHi: "ज्वार", emoji: "🌾", color: "#F9FBE7", about: "Nutritious grain and fodder.", aboutHi: "पौष्टिक अनाज और चारा।", season: "Kharif", seasonHi: "खरीफ", soil: "Clayey", soilHi: "चिकनी", water: "Low", waterHi: "कम", diseases: "Grain Mold", diseasesHi: "ग्रेन मोल्ड", fertilizer: "100:50:40", fertilizerHi: "100:50:40", harvest: "110 days", harvestHi: "110 दिन" },
    { id: "ragi", category: "cereals", name: "Finger Millet", nameHi: "रागी", emoji: "🌾", color: "#FBE9E7", about: "Rich in calcium and iron.", aboutHi: "कैल्शियम और आयरन से भरपूर।", season: "Kharif", seasonHi: "खरीफ", soil: "Red / Gravelly", soilHi: "लाल / कंकड़ीली", water: "Moderate", waterHi: "मध्यम", diseases: "Blast", diseasesHi: "ब्लास्ट", fertilizer: "60:30:30", fertilizerHi: "60:30:30", harvest: "120 days", harvestHi: "120 दिन" },
    { id: "oats", category: "cereals", name: "Oats", nameHi: "जई", emoji: "🌾", color: "#F3F4F6", about: "High-protein fodder crop.", aboutHi: "उच्च प्रोटीन चारा फसल।", season: "Rabi", seasonHi: "रबी", soil: "Loam", soilHi: "दोमट", water: "Medium", waterHi: "मध्यम", diseases: "Smut", diseasesHi: "स्मट", fertilizer: "80:40:40", fertilizerHi: "80:40:40", harvest: "100 days", harvestHi: "100 दिन" },
    { id: "buckwheat", category: "cereals", name: "Buckwheat", nameHi: "कुट्टू", emoji: "🌾", color: "#FDF2F2", about: "Himalayan pseudo-cereal.", aboutHi: "हिमालयी छद्म अनाज।", season: "Kharif", seasonHi: "खरीफ", soil: "Acidic", soilHi: "अम्लीय", water: "High", waterHi: "अधिक", diseases: "Leaf Spot", diseasesHi: "लीफ स्पॉट", fertilizer: "60:40:40", fertilizerHi: "60:40:40", harvest: "80 days", harvestHi: "80 दिन" },
    { id: "rye", category: "cereals", name: "Rye", nameHi: "राई", emoji: "🌾", color: "#F9FAFB", about: "Cold-tolerant grain.", aboutHi: "ठंड सहने वाला अनाज।", season: "Rabi", seasonHi: "रबी", soil: "Poor sandy", soilHi: "बलुई", water: "Low", waterHi: "कम", diseases: "Ergot", diseasesHi: "एर्गोट", fertilizer: "80:40:40", fertilizerHi: "80:40:40", harvest: "120 days", harvestHi: "120 दिन" },

    // 🥬 VEGETABLES (10)
    {
        id: "tomato", category: "vegetables", name: "Tomato", nameHi: "टमाटर", emoji: "🍅", color: "#FFEBEE",
        about: "Major vegetable rich in vitamins.", aboutHi: "प्रमुख विटामिन-युक्त सब्जी।",
        season: "Year-round", seasonHi: "साल भर",
        soil: "Sandy Loam", soilHi: "बलुई दोमट",
        water: "Moderate", waterHi: "मध्यम",
        diseases: "Leaf Curl", diseasesHi: "लीफ कर्ल",
        fertilizer: "120:80:60", fertilizerHi: "120:80:60",
        harvest: "80 days", harvestHi: "80 दिन"
    },
    {
        id: "potato", category: "vegetables", name: "Potato", nameHi: "आलू", emoji: "🥔", color: "#FFF3E0",
        about: "Vital tuber crop.", aboutHi: "महत्वपूर्ण कंद फसल।",
        season: "Rabi", seasonHi: "रबी",
        soil: "Sandy Loam", soilHi: "बलुई दोमट",
        water: "Moderate", waterHi: "मध्यम",
        diseases: "Late Blight", diseasesHi: "लेट ब्लाइट",
        fertilizer: "150:80:100", fertilizerHi: "150:80:100",
        harvest: "100 days", harvestHi: "100 दिन"
    },
    {
        id: "onion", category: "vegetables", name: "Onion", nameHi: "प्याज", emoji: "🧅", color: "#FCE4EC",
        about: "Essential kitchen bulb.", aboutHi: "आवश्यक किचन बल्ब।",
        season: "Kharif/Rabi", seasonHi: "खरीफ/रबी",
        soil: "Sandy Loam", soilHi: "बलुई दोमट",
        water: "Moderate", waterHi: "मध्यम",
        diseases: "Purple Blotch", diseasesHi: "पर्पल ब्लॉच",
        fertilizer: "100:50:50", fertilizerHi: "100:50:50",
        harvest: "110 days", harvestHi: "110 दिन"
    },
    { id: "cauliflower", category: "vegetables", name: "Cauliflower", nameHi: "फूलगोभी", emoji: "🥦", color: "#F1F8E9", about: "Winter vegetable.", aboutHi: "सर्दियों की सब्जी।", season: "Winter", seasonHi: "सर्दी", soil: "Sandy Loam", soilHi: "बलुई दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Black Rot", diseasesHi: "ब्लैक रॉट", fertilizer: "120:60:60", fertilizerHi: "120:60:60", harvest: "100 days", harvestHi: "100 दिन" },
    { id: "brinjal", category: "vegetables", name: "Brinjal", nameHi: "बैंगन", emoji: "🍆", color: "#F3E5F5", about: "Hardy vegetable.", aboutHi: "कठोर सब्जी।", season: "Year-round", seasonHi: "साल भर", soil: "All types", soilHi: "सभी प्रकार", water: "Moderate", waterHi: "मध्यम", diseases: "Fruit Borer", diseasesHi: "फ्रूट बोरर", fertilizer: "100:50:50", fertilizerHi: "100:50:50", harvest: "75 days", harvestHi: "75 दिन" },
    { id: "capsicum", category: "vegetables", name: "Capsicum", nameHi: "शिमला मिर्च", emoji: "🫑", color: "#E8F5E9", about: "Polyhouse/Field pepper.", aboutHi: "पोलीहाउस/खेत वाली मिर्च।", season: "Spring/Autumn", seasonHi: "वसंत/शरद", soil: "Organic Loam", soilHi: "दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Mildew", diseasesHi: "मिल्ड्यू", fertilizer: "150:120:100", fertilizerHi: "150:120:100", harvest: "80 days", harvestHi: "80 दिन" },
    { id: "cabbage", category: "vegetables", name: "Cabbage", nameHi: "पत्ता गोभी", emoji: "🥬", color: "#E8F5E9", about: "Leafy winter vegetable.", aboutHi: "पत्तेदार सर्दियों की सब्जी।", season: "Winter", seasonHi: "सर्दी", soil: "Well-drained loam", soilHi: "दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Clubroot", diseasesHi: "क्लब रूट", fertilizer: "120:60:60", fertilizerHi: "120:60:60", harvest: "90 days", harvestHi: "90 दिन" },
    { id: "okra", category: "vegetables", name: "Okra", nameHi: "भिंडी", emoji: "🥒", color: "#F1F8E9", about: "Warm-season veggie.", aboutHi: "गर्मी के मौसम की सब्जी।", season: "Summer/Kharif", seasonHi: "गर्मी/खरीफ", soil: "Sandy Loam", soilHi: "बलुई दोमट", water: "Frequent", waterHi: "लगातार", diseases: "YVMV", diseasesHi: "YVMV", fertilizer: "100:50:50", fertilizerHi: "100:50:50", harvest: "50 days", harvestHi: "50 दिन" },
    { id: "carrot", category: "vegetables", name: "Carrot", nameHi: "गाजर", emoji: "🥕", color: "#FFF3E0", about: "Root rich in Vit A.", aboutHi: "विटामिन A वाली जड़ फसल।", season: "Winter", seasonHi: "सर्दी", soil: "Sand", soilHi: "बलुई", water: "Moderate", waterHi: "मध्यम", diseases: "Leaf Blight", diseasesHi: "लीफ ब्लाइट", fertilizer: "50:40:50", fertilizerHi: "50:40:50", harvest: "100 days", harvestHi: "100 दिन" },
    { id: "garlic", category: "vegetables", name: "Garlic", nameHi: "लहसुन", emoji: "🧄", color: "#F9FAFB", about: "Pungent bulb crop.", aboutHi: "तीखा बल्ब फसल।", season: "Winter", seasonHi: "सर्दी", soil: "Fertile Loam", soilHi: "दोमट", water: "Medium", waterHi: "मध्यम", diseases: "Purple Blotch", diseasesHi: "पर्पल ब्लॉच", fertilizer: "100:50:50", fertilizerHi: "100:50:50", harvest: "140 days", harvestHi: "140 दिन" },
    // 🍎 FRUITS (10)
    { id: "mango", category: "fruits", name: "Mango", nameHi: "आम", emoji: "🥭", color: "#FFF8E1", about: "King of fruits.", aboutHi: "फलों का राजा।", season: "Apr-July", seasonHi: "अप्रैल-जुलाई", soil: "Alluvial", soilHi: "जलोढ़", water: "Low", waterHi: "कम", diseases: "Anthracnose", diseasesHi: "एंथ्रेक्नोज", fertilizer: "NPK", fertilizerHi: "NPK", harvest: "120 days", harvestHi: "120 दिन" },
    { id: "banana", category: "fruits", name: "Banana", nameHi: "केला", emoji: "🍌", color: "#FFFDE7", about: "Year-round energy fruit.", aboutHi: "ऊर्जा वाला फल।", season: "Year-round", seasonHi: "साल भर", soil: "Loamy", soilHi: "दोमट", water: "High", waterHi: "अधिक", diseases: "Sigatoka", diseasesHi: "सिगाटोका", fertilizer: "NPK", fertilizerHi: "NPK", harvest: "12 months", harvestHi: "12 महीने" },
    { id: "papaya", category: "fruits", name: "Papaya", nameHi: "पपीता", emoji: "🍈", color: "#FFF3E0", about: "Quick growing fruit.", aboutHi: "तेजी से बढ़ने वाला फल।", season: "Year-round", seasonHi: "साल भर", soil: "Sandy Loam", soilHi: "बलुई दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Virus", diseasesHi: "वायरस", fertilizer: "NPK", fertilizerHi: "NPK", harvest: "10 months", harvestHi: "10 महीने" },
    { id: "pomegranate", category: "fruits", name: "Pomegranate", nameHi: "अनार", emoji: "🍎", color: "#FFEBEE", about: "Drought-hardy fruit.", aboutHi: "सूखा-सहिष्णु फल।", season: "Thrice a year", seasonHi: "साल में 3 बार", soil: "Sandy/Clay", soilHi: "बलुई/चिकनी", water: "Low", waterHi: "कम", diseases: "Blight", diseasesHi: "झुलसा", fertilizer: "NPK", fertilizerHi: "NPK", harvest: "180 days", harvestHi: "180 दिन" },
    { id: "guava", category: "fruits", name: "Guava", nameHi: "अमरूद", emoji: "🍐", color: "#F1F8E9", about: "Vitamin C rich fruit.", aboutHi: "विटामिन C युक्त फल।", season: "Winter/Monsoon", seasonHi: "सर्दी/मानसून", soil: "Well-drained", soilHi: "दोमट", water: "Low", waterHi: "कम", diseases: "Wilt", diseasesHi: "विल्ट", fertilizer: "NPK", fertilizerHi: "NPK", harvest: "140 days", harvestHi: "140 दिन" },
    { id: "orange", category: "fruits", name: "Orange", nameHi: "संतरा", emoji: "🍊", color: "#FFF3E0", about: "Acidic juice fruit.", aboutHi: "अम्लीय फल।", season: "Nov-Feb", seasonHi: "नवंबर-फरवरी", soil: "Deep soil", soilHi: "गहरी मिट्टी", water: "Moderate", waterHi: "मध्यम", diseases: "Canker", diseasesHi: "कैंकर", fertilizer: "NPK", fertilizerHi: "NPK", harvest: "9 months", harvestHi: "9 महीने" },
    { id: "grapes", category: "fruits", name: "Grapes", nameHi: "अंगूर", emoji: "🍇", color: "#F3E5F5", about: "Vines for fresh fruit.", aboutHi: "ताजे फल की बेल।", season: "Feb-April", seasonHi: "फरवरी-अप्रैल", soil: "Sandy Loam", soilHi: "बलुई दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Mildew", diseasesHi: "मिल्ड्यू", fertilizer: "NPK", fertilizerHi: "NPK", harvest: "140 days", harvestHi: "140 दिन" },
    { id: "apple", category: "fruits", name: "Apple", nameHi: "सेब", emoji: "🍎", color: "#FFEBEE", about: "Temperate fruit.", aboutHi: "पहाड़ी फल।", season: "July-Oct", seasonHi: "जुलाई-अक्टूबर", soil: "Loamy", soilHi: "दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Scab", diseasesHi: "स्कैब", fertilizer: "NPK", fertilizerHi: "NPK", harvest: "150 days", harvestHi: "150 दिन" },
    { id: "pineapple", category: "fruits", name: "Pineapple", nameHi: "अनानास", emoji: "🍍", color: "#FFF8E1", about: "Tropical fruit.", aboutHi: "उष्णकटिबंधीय फल।", season: "Summer", seasonHi: "गर्मी", soil: "Sandy", soilHi: "बलुई", water: "Moderate", waterHi: "मध्यम", diseases: "Heart Rot", diseasesHi: "हार्ट रॉट", fertilizer: "NPK", fertilizerHi: "NPK", harvest: "20 months", harvestHi: "20 महीने" },
    { id: "watermelon", category: "fruits", name: "Watermelon", nameHi: "तरबूज", emoji: "🍉", color: "#E8F5E9", about: "Summer dessert fruit.", aboutHi: "गर्मी का फल।", season: "Summer", seasonHi: "गर्मी", soil: "Riverbanks", soilHi: "नदी तट", water: "Low", waterHi: "कम", diseases: "Wilt", diseasesHi: "विल्ट", fertilizer: "NPK", fertilizerHi: "NPK", harvest: "90 days", harvestHi: "90 दिन" },

    // 💰 CASH CROPS (10)
    { id: "sugarcane", category: "cash", name: "Sugarcane", nameHi: "गन्ना", emoji: "🎋", color: "#F1F8E9", about: "Main sugar source.", aboutHi: "चीनी का स्रोत।", season: "Year-long", seasonHi: "साल भर", soil: "Rich Loam", soilHi: "दोमट", water: "Very High", waterHi: "बहुत अधिक", diseases: "Red Rot", diseasesHi: "रेड रॉट", fertilizer: "250:100:100", fertilizerHi: "250:100:100", harvest: "12 months", harvestHi: "12 महीने" },
    { id: "cotton", category: "cash", name: "Cotton", nameHi: "कपास", emoji: "🌸", color: "#F3E5F5", about: "Agriculture fiber.", aboutHi: "खेती का रेशा।", season: "Kharif", seasonHi: "खरीफ", soil: "Black Soil", soilHi: "काली मिट्टी", water: "Medium", waterHi: "मध्यम", diseases: "Bollworm", diseasesHi: "बॉलवर्म", fertilizer: "150:60:60", fertilizerHi: "150:60:60", harvest: "160 days", harvestHi: "160 दिन" },
    { id: "jute", category: "cash", name: "Jute", nameHi: "जूट", emoji: "🌿", color: "#E8F5E9", about: "Golden Fiber.", aboutHi: "सुनहरा रेशा।", season: "Kharif", seasonHi: "खरीफ", soil: "Alluvial", soilHi: "जलोढ़", water: "High", waterHi: "अधिक", diseases: "Stem Rot", diseasesHi: "तना सड़न", fertilizer: "60:30:30", fertilizerHi: "60:30:30", harvest: "120 days", harvestHi: "120 दिन" },
    { id: "tobacco", category: "cash", name: "Tobacco", nameHi: "तंबाकू", emoji: "🍃", color: "#FFF8E1", about: "Cash leaf crop.", aboutHi: "पत्ती वाली नकदी फसल।", season: "Winter", seasonHi: "सर्दी", soil: "Sandy", soilHi: "बलुई", water: "Moderate", waterHi: "मध्यम", diseases: "Mosaic", diseasesHi: "मोज़ेक", fertilizer: "100:50:50", fertilizerHi: "100:50:50", harvest: "100 days", harvestHi: "100 दिन" },
    { id: "tea", category: "cash", name: "Tea", nameHi: "चाय", emoji: "🍵", color: "#F1F8E9", about: "Beverage crop.", aboutHi: "पेय फसल।", season: "Year-round", seasonHi: "साल भर", soil: "Acidic Loam", soilHi: "अम्लीय दोमट", water: "High", waterHi: "अधिक", diseases: "Blight", diseasesHi: "ब्लाइट", fertilizer: "Complex", fertilizerHi: "मिश्रित", harvest: "Plucking", harvestHi: "तुड़ाई" },
    { id: "coffee", category: "cash", name: "Coffee", nameHi: "कॉफी", emoji: "☕", color: "#EFEBE9", about: "Plantation crop.", aboutHi: "बागानी फसल।", season: "Nov-Feb", seasonHi: "नवंबर-फरवरी", soil: "Rich Loam", soilHi: "दोमट", water: "High", waterHi: "अधिक", diseases: "Rust", diseasesHi: "रस्ट", fertilizer: "160:120:160", fertilizerHi: "160:120:160", harvest: "9 months", harvestHi: "9 महीने" },
    { id: "rubber", category: "cash", name: "Rubber", nameHi: "रबड़", emoji: "🪵", color: "#F9FAFB", about: "Industrial latex.", aboutHi: "औद्योगिक लेटेक्स।", season: "Year-round", seasonHi: "साल भर", soil: "Lateritic", soilHi: "लैटेरिटिक", water: "Very High", waterHi: "बहुत अधिक", diseases: "Leaf Fall", diseasesHi: "पत्ता गिरना", fertilizer: "NPK", fertilizerHi: "NPK", harvest: "7 years", harvestHi: "7 साल" },
    { id: "sunflower", category: "cash", name: "Sunflower", nameHi: "सूरजमुखी", emoji: "🌻", color: "#FFF9C4", about: "Oilseed crop.", aboutHi: "तिलहन फसल।", season: "All seasons", seasonHi: "सभी मौसम", soil: "Deep Loam", soilHi: "दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Rust", diseasesHi: "रस्ट", fertilizer: "60:80:40", fertilizerHi: "60:80:40", harvest: "95 days", harvestHi: "95 दिन" },
    { id: "mustard", category: "cash", name: "Mustard", nameHi: "सरसों", emoji: "🌼", color: "#FFFDE7", about: "Winter oilseed.", aboutHi: "शीतकालीन तिलहन।", season: "Rabi", seasonHi: "रबी", soil: "Sandy Loam", soilHi: "बलुई दोमट", water: "Low", waterHi: "कम", diseases: "Aphids", diseasesHi: "एफिड्स", fertilizer: "80:40:40", fertilizerHi: "80:40:40", harvest: "120 days", harvestHi: "120 दिन" },
    { id: "groundnut", category: "cash", name: "Groundnut", nameHi: "मूंगफली", emoji: "🥜", color: "#FFF3E0", about: "Protein oilseed.", aboutHi: "तिलहन और प्रोटीन।", season: "Kharif/Summer", seasonHi: "खरीफ/गर्मी", soil: "Sandy Loam", soilHi: "बलुई दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Tikka", diseasesHi: "टिक्का", fertilizer: "20:60:40", fertilizerHi: "20:60:40", harvest: "110 days", harvestHi: "110 दिन" },

    // 🌶️ SPICES (10)
    { id: "chilli", category: "spices", name: "Chilli", nameHi: "मिर्च", emoji: "🌶️", color: "#FFEBEE", about: "Hot spice.", aboutHi: "तीखा मसाला।", season: "Kharif & Rabi", seasonHi: "खरीफ और रबी", soil: "Sandy Loam", soilHi: "बलुई दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Leaf Curl", diseasesHi: "लीफ कर्ल", fertilizer: "100:50:50", fertilizerHi: "100:50:50", harvest: "100 days", harvestHi: "100 दिन" },
    { id: "turmeric", category: "spices", name: "Turmeric", nameHi: "हल्दी", emoji: "🟡", color: "#FFF9C4", about: "Golden spice.", aboutHi: "सुनहरा मसाला।", season: "Kharif", seasonHi: "खरीफ", soil: "Loam", soilHi: "दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Rhizome Rot", diseasesHi: "प्रकंद सड़न", fertilizer: "30:30:60", fertilizerHi: "30:30:60", harvest: "8 months", harvestHi: "8 महीने" },
    { id: "ginger", category: "spices", name: "Ginger", nameHi: "अदरक", emoji: "🫚", color: "#FFF3E0", about: "Medicinal rhizome.", aboutHi: "औषधीय प्रकंद।", season: "Kharif", seasonHi: "खरीफ", soil: "Sandy Loam", soilHi: "दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Soft Rot", diseasesHi: "सॉफ्ट रॉट", fertilizer: "75:50:50", fertilizerHi: "75:50:50", harvest: "9 months", harvestHi: "9 महीने" },
    { id: "cumin", category: "spices", name: "Cumin", nameHi: "जीरा", emoji: "🧂", color: "#F9FAFB", about: "Rabi spice.", aboutHi: "रबी मसाला।", season: "Rabi", seasonHi: "रबी", soil: "Sandy Loam", soilHi: "बलुई दोमट", water: "Low", waterHi: "कम", diseases: "Wilt", diseasesHi: "विल्ट", fertilizer: "30:20:20", fertilizerHi: "30:20:20", harvest: "100 days", harvestHi: "100 दिन" },
    { id: "black_pepper", category: "spices", name: "Pepper", nameHi: "काली मिर्च", emoji: "🫘", color: "#E0E0E0", about: "Spice king.", aboutHi: "मसालों का राजा।", season: "Dec-Feb", seasonHi: "दिसंबर-फरवरी", soil: "Lateritic", soilHi: "लैटेरिटिक", water: "High", waterHi: "अधिक", diseases: "Wilt", diseasesHi: "विल्ट", fertilizer: "100:40:140g", fertilizerHi: "100:40:140g", harvest: "7 months", harvestHi: "7 महीने" },
    { id: "cardamom", category: "spices", name: "Cardamom", nameHi: "इलायची", emoji: "🟢", color: "#E8F5E9", about: "Spice queen.", aboutHi: "मसालों की रानी।", season: "Aug-Jan", seasonHi: "अगस्त-जनवरी", soil: "Forest Loam", soilHi: "वन दोमट", water: "High", waterHi: "अधिक", diseases: "Virus", diseasesHi: "वायरस", fertilizer: "75:75:150", fertilizerHi: "75:75:150", harvest: "5 months", harvestHi: "5 महीने" },
    { id: "coriander", category: "spices", name: "Coriander", nameHi: "धनिया", emoji: "🌿", color: "#F1F8E9", about: "Leaf and seed herb.", aboutHi: "पत्ती और बीज की जड़ी-बूटी।", season: "Rabi", seasonHi: "रबी", soil: "Medium/Heavy", soilHi: "मध्यम/भारी", water: "Moderate", waterHi: "मध्यम", diseases: "Gall", diseasesHi: "गॉल", fertilizer: "40:40:20", fertilizerHi: "40:40:20", harvest: "100 days", harvestHi: "100 दिन" },
    { id: "fenugreek", category: "spices", name: "Fenugreek", nameHi: "मेथी", emoji: "🌿", color: "#F9FBE7", about: "Medicinal legume.", aboutHi: "औषधीय दलहन।", season: "Rabi", seasonHi: "रबी", soil: "All types", soilHi: "सभी प्रकार", water: "Low", waterHi: "कम", diseases: "Mildew", diseasesHi: "मिल्ड्यू", fertilizer: "40:40:20", fertilizerHi: "40:40:20", harvest: "100 days", harvestHi: "100 दिन" },
    { id: "clove", category: "spices", name: "Clove", nameHi: "लौंग", emoji: "🟤", color: "#EFEBE9", about: "Dried bud spice.", aboutHi: "सूखा कली मसाला।", season: "Dec-Feb", seasonHi: "दिसंबर-फरवरी", soil: "Red Loam", soilHi: "लाल दोमट", water: "High", waterHi: "अधिक", diseases: "Root Rot", diseasesHi: "जड़ सड़न", fertilizer: "Complex", fertilizerHi: "मिश्रित", harvest: "7 years", harvestHi: "7 साल" },
    { id: "cinnamon", category: "spices", name: "Cinnamon", nameHi: "दालचीनी", emoji: "🪵", color: "#BCAAA4", about: "Bark spice.", aboutHi: "छाल मसाला।", season: "May-Nov", seasonHi: "मई-नवंबर", soil: "Sandy", soilHi: "बलुई", water: "High", waterHi: "अधिक", diseases: "Leaf Spot", diseasesHi: "लीफ स्पॉट", fertilizer: "NPK", fertilizerHi: "NPK", harvest: "2 years", harvestHi: "2 साल" },

    // 🫘 PULSES & LEGUMES (10)
    { id: "soybean", category: "pulses", name: "Soybean", nameHi: "सोयाबीन", emoji: "🫘", color: "#E8F5E9", about: "Protein king.", aboutHi: "प्रोटीन राजा।", season: "Kharif", seasonHi: "खरीफ", soil: "Loamy", soilHi: "दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Mosaic", diseasesHi: "मोज़ेक", fertilizer: "30:60:40", fertilizerHi: "30:60:40", harvest: "100 days", harvestHi: "100 दिन" },
    { id: "chickpea", category: "pulses", name: "Chickpea", nameHi: "चना", emoji: "🫛", color: "#FFFDE7", about: "Largest pulse crop.", aboutHi: "सबसे बड़ी दलहन फसल।", season: "Rabi", seasonHi: "रबी", soil: "Sandy Loam", soilHi: "बलुई दोमट", water: "Low", waterHi: "कम", diseases: "Wilt", diseasesHi: "विल्ट", fertilizer: "20:40:20", fertilizerHi: "20:40:20", harvest: "110 days", harvestHi: "110 दिन" },
    { id: "pigeon_pea", category: "pulses", name: "Tur / Arhar", nameHi: "तुअर / अरहर", emoji: "🫘", color: "#FFF3E0", about: "Long duration dal.", aboutHi: "लंबी अवधि की दाल।", season: "Kharif", seasonHi: "खरीफ", soil: "Well-drained", soilHi: "दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Wilt", diseasesHi: "विल्ट", fertilizer: "20:50:20", fertilizerHi: "20:50:20", harvest: "170 days", harvestHi: "170 दिन" },
    { id: "lentil", category: "pulses", name: "Lentil", nameHi: "मसूर", emoji: "🥣", color: "#D7CCC8", about: "Winter legume.", aboutHi: "सर्दियों की दलहन।", season: "Rabi", seasonHi: "रबी", soil: "Light Loam", soilHi: "हल्की दोमट", water: "Low", waterHi: "कम", diseases: "Wilt", diseasesHi: "विल्ट", fertilizer: "20:40:20", fertilizerHi: "20:40:20", harvest: "120 days", harvestHi: "120 दिन" },
    { id: "moong", category: "pulses", name: "Green Gram", nameHi: "मूंंग", emoji: "🫘", color: "#E8F5E9", about: "Short duration crop.", aboutHi: "कम अवधि की फसल।", season: "Kharif/Summer", seasonHi: "खरीफ/गर्मी", soil: "Loamy", soilHi: "दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Mosaic", diseasesHi: "मोज़ेक", fertilizer: "20:40:20", fertilizerHi: "20:40:20", harvest: "70 days", harvestHi: "70 दिन" },
    { id: "urad", category: "pulses", name: "Black Gram", nameHi: "उड़द", emoji: "🫘", color: "#E0E0E0", about: "Dosa/Dal staple.", aboutHi: "डोसा/दाल का आधार।", season: "Kharif", seasonHi: "खरीफ", soil: "Clayey", soilHi: "चिकनी", water: "Moderate", waterHi: "मध्यम", diseases: "Mildew", diseasesHi: "मिल्ड्यू", fertilizer: "20:40:20", fertilizerHi: "20:40:20", harvest: "80 days", harvestHi: "80 दिन" },
    { id: "peas", category: "pulses", name: "Peas", nameHi: "मटर", emoji: "🫛", color: "#F1F8E9", about: "Winter pea pod.", aboutHi: "सर्दियों की हरी मटर।", season: "Winter", seasonHi: "सर्दी", soil: "Loam", soilHi: "दोमट", water: "Moderate", waterHi: "मध्यम", diseases: "Mildew", diseasesHi: "मिल्ड्यू", fertilizer: "20:60:40", fertilizerHi: "20:60:40", harvest: "80 days", harvestHi: "80 दिन" },
    { id: "rajma", category: "pulses", name: "Kidney Beans", nameHi: "राजमा", emoji: "🫘", color: "#FFEBEE", about: "Rich protein bean.", aboutHi: "प्रोटीन से भरपूर बीन्स।", season: "Rabi", seasonHi: "रबी", soil: "Deep Loam", soilHi: "दोमट", water: "High", waterHi: "अधिक", diseases: "Mosaic", diseasesHi: "मोज़ेक", fertilizer: "100:60:40", fertilizerHi: "100:60:40", harvest: "115 days", harvestHi: "115 दिन" },
    { id: "lobia", category: "pulses", name: "Cowpea", nameHi: "लोबिया", emoji: "🫘", color: "#F9FBE7", about: "Hardy legume.", aboutHi: "सख्त दलहन।", season: "Kharif/Summer", seasonHi: "खरीफ/गर्मी", soil: "All types", soilHi: "सभी प्रकार", water: "Low", waterHi: "कम", diseases: "Wilt", diseasesHi: "विल्ट", fertilizer: "20:40:20", fertilizerHi: "20:40:20", harvest: "80 days", harvestHi: "80 दिन" },
    { id: "horse_gram", category: "pulses", name: "Horse Gram", nameHi: "कुलथी", emoji: "🫘", color: "#BCAAA4", about: "Ultra cardio pulse.", aboutHi: "अत्यधिक कठोर दलहन।", season: "Late Kharif", seasonHi: "देर खरीफ", soil: "Poor soils", soilHi: "खराब मिट्टी", water: "Very Low", waterHi: "बहुत कम", diseases: "Root Rot", diseasesHi: "जड़ सड़न", fertilizer: "20:30:20", fertilizerHi: "20:30:20", harvest: "105 days", harvestHi: "105 दिन" },
];

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────
function getCategoryName(cat: typeof CROP_CATEGORIES[0], lang: Language): string {
    const val = cat[lang as keyof typeof cat] || (cat as any).name;
    return typeof val === 'string' ? val : cat.name;
}

function getCropName(crop: typeof ALL_CROPS[0], lang: Language): string {
    const hiName = (crop as any).nameHi;
    if (lang === "hi" && hiName) return hiName;

    // Check for other languages in the type, but fallback to English 'name'
    const langKey = ("name" + lang.charAt(0).toUpperCase() + lang.slice(1)) as keyof typeof crop;
    const val = (crop as any)[langKey] || crop.name;
    return typeof val === 'string' ? val : crop.name;
}

function getCropField(crop: typeof ALL_CROPS[0], field: string, lang: Language): string {
    if (lang === "hi") {
        const hiField = field + "Hi";
        if (hiField in crop) return (crop as any)[hiField] as string;
    }
    return (crop as any)[field] || "N/A";
}

// ─────────────────────────────────────────────
// CROP CARD COMPONENT (Memoized)
// ─────────────────────────────────────────────
const CropCard = memo(function CropCard({ crop, lang, onClick }: {
    crop: typeof ALL_CROPS[0];
    lang: Language;
    onClick: () => void;
}) {
    return (
        <motion.div
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03, y: -4 }}
            onClick={onClick}
            className="flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden shadow-md bg-white"
            style={{ width: 130, border: "1px solid rgba(0,0,0,0.06)" }}
        >
            {/* Crop Image Section */}
            <div className="relative h-28 overflow-hidden" style={{ background: crop.color }}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl drop-shadow-md">{crop.emoji}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            {/* Name Section */}
            <div className="p-2.5 text-center bg-white">
                <p className="text-sm font-bold truncate" style={{ color: "#1B5E20" }}>
                    {getCropName(crop, lang)}
                </p>
                <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>
                    {crop.name}
                </p>
            </div>
        </motion.div>
    );
});

// ─────────────────────────────────────────────
// CROP DETAIL VIEW
// ─────────────────────────────────────────────
const INFO_SECTIONS = [
    { key: "about", icon: "📖", label: "About", labelHi: "परिचय" },
    { key: "season", icon: "🗓️", label: "Best Season", labelHi: "सर्वोत्तम मौसम" },
    { key: "soil", icon: "🪨", label: "Soil Type", labelHi: "मिट्टी का प्रकार" },
    { key: "water", icon: "💧", label: "Water Need", labelHi: "पानी की जरूरत" },
    { key: "diseases", icon: "🦠", label: "Diseases", labelHi: "रोग" },
    { key: "fertilizer", icon: "🧪", label: "Fertilizer", labelHi: "उर्वरक" },
    { key: "harvest", icon: "✂️", label: "Harvest", labelHi: "कटाई" },
];

function CropDetailPanel({ crop, lang, onBack }: {
    crop: typeof ALL_CROPS[0];
    lang: Language;
    onBack: () => void;
}) {
    return (
        <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden"
        >
            {/* Hero Section with Crop Image */}
            <div className="relative" style={{ minHeight: 260 }}>
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(180deg, ${crop.color} 0%, ${crop.color}dd 60%, white 100%)`,
                    }}
                />
                {/* Decorative circles */}
                <div className="absolute top-4 right-4 w-32 h-32 rounded-full opacity-30" style={{ background: crop.color, filter: "blur(30px)" }} />
                <div className="absolute bottom-20 left-4 w-24 h-24 rounded-full opacity-20" style={{ background: "#2E7D32", filter: "blur(20px)" }} />

                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg z-10 hover:bg-white transition-all"
                    style={{ border: "1px solid rgba(0,0,0,0.05)" }}
                >
                    <span className="text-xl">←</span>
                </button>

                {/* Crop Emoji/Image */}
                <div className="relative flex flex-col items-center justify-center pt-12 pb-4">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", delay: 0.1 }}
                        className="w-32 h-32 rounded-3xl flex items-center justify-center shadow-2xl mb-4"
                        style={{
                            background: "white",
                            border: "4px solid white",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
                        }}
                    >
                        <span className="text-7xl">{crop.emoji}</span>
                    </motion.div>

                    {/* Crop Name Badge */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="px-6 py-2.5 rounded-full shadow-lg flex items-center gap-2"
                        style={{ background: "#2E7D32" }}
                    >
                        <span className="text-white font-bold text-lg">{getCropName(crop, lang)}</span>
                        {lang !== "en" && (
                            <span className="text-white/70 text-sm">({crop.name})</span>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Info Cards Section */}
            <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-8 -mt-2">
                <div className="flex flex-col gap-3">
                    {INFO_SECTIONS.map((section, index) => (
                        <motion.div
                            key={section.key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-4"
                            style={{ border: "1px solid #E8F5E9" }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: crop.color }}
                            >
                                <span className="text-2xl">{section.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "#66BB6A" }}>
                                    {lang === "hi" ? section.labelHi : section.label}
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
                                    {getCropField(crop, section.key, lang)}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────
// MAIN CROP EXPLORER VIEW
// ─────────────────────────────────────────────
export default function CropExplorerView({
    lang,
    onBack
}: {
    lang: Language;
    onBack: () => void;
}) {
    const [selectedCrop, setSelectedCrop] = useState<typeof ALL_CROPS[0] | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Memoized handlers
    const handleCropBack = useCallback(() => setSelectedCrop(null), []);
    const handleCategorySelect = useCallback((catId: string) => {
        setSelectedCategory(catId === selectedCategory ? null : catId);
    }, [selectedCategory]);
    const handleCropSelect = useCallback((crop: typeof ALL_CROPS[0]) => {
        setSelectedCrop(crop);
    }, []);

    // Memoize filtered crops for selected category
    const filteredCrops = useMemo(() => {
        if (!selectedCategory) return [];
        return ALL_CROPS.filter(c => c.category === selectedCategory);
    }, [selectedCategory]);

    // Memoized labels
    const headerLabels = useMemo<Record<Language, string>>(() => ({
        en: "Crop Explorer",
        hi: "फसल जानकारी",
        bn: "ফসল তথ্য",
        te: "పంట సమాచారం",
        mr: "पीक माहिती",
        ta: "பயிர் தகவல்",
    }), []);

    const selectFieldLabels = useMemo<Record<Language, string>>(() => ({
        en: "Select a field to explore crops",
        hi: "फसलें देखने के लिए क्षेत्र चुनें",
        bn: "ফসল দেখতে ক্ষেত্র নির্বাচন করুন",
        te: "పంటలు చూడటానికి క్షేత్రాన్ని ఎంచుకోండి",
        mr: "पिके पाहण्यासाठी क्षेत्र निवडा",
        ta: "பயிர்களைக் காண புலத்தைத் தேர்ந்தெடுக்கவும்",
    }), []);

    return (
        <AnimatePresence mode="wait">
            {selectedCrop ? (
                <CropDetailPanel
                    key="crop-detail"
                    crop={selectedCrop}
                    lang={lang}
                    onBack={handleCropBack}
                />
            ) : (
                <motion.div
                    key="crop-explorer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col min-h-full"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <button
                                onClick={onBack}
                                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                                <span className="text-xl">←</span>
                            </button>
                            <div className="flex-1">
                                <h1 className="text-lg font-bold" style={{ color: "#1B5E20" }}>
                                    🌱 {headerLabels[lang]}
                                </h1>
                                <p className="text-xs" style={{ color: "#6B7280" }}>
                                    {selectFieldLabels[lang]}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Field Categories */}
                    <div className="px-4 py-4">
                        <div className="grid grid-cols-3 gap-2">
                            {CROP_CATEGORIES.map((cat, idx) => (
                                <motion.button
                                    key={cat.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleCategorySelect(cat.id)}
                                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${selectedCategory === cat.id ? "ring-2 ring-green-600 ring-offset-1" : ""
                                        }`}
                                    style={{
                                        background: selectedCategory === cat.id ? cat.gradient : cat.color,
                                    }}
                                >
                                    <span className="text-2xl">{cat.icon}</span>
                                    <span
                                        className="text-[10px] font-bold text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full"
                                        style={{ color: selectedCategory === cat.id ? "white" : "#374151" }}
                                    >
                                        {getCategoryName(cat, lang)}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Crops by Category - Horizontal Scroll */}
                    <div className="flex-1 pb-6">
                        {CROP_CATEGORIES.map((cat) => {
                            const cropsInCategory = ALL_CROPS.filter(c => c.category === cat.id);
                            if (selectedCategory && selectedCategory !== cat.id) return null;

                            return (
                                <motion.div
                                    key={cat.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mb-6"
                                >
                                    {/* Category Header */}
                                    <div className="flex items-center gap-2 px-4 mb-3">
                                        <span className="text-xl">{cat.icon}</span>
                                        <h3 className="font-bold" style={{ color: "#1B5E20" }}>
                                            {getCategoryName(cat, lang)}
                                        </h3>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100" style={{ color: "#6B7280" }}>
                                            {cropsInCategory.length}
                                        </span>
                                    </div>

                                    {/* Horizontal Crop Cards */}
                                    <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-2">
                                        {cropsInCategory.map((crop) => (
                                            <CropCard
                                                key={crop.id}
                                                crop={crop}
                                                lang={lang}
                                                onClick={() => handleCropSelect(crop)}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
