import { motion } from "framer-motion";
import { DetailedWeather } from "../hooks/useWeather";
import { Language } from "../lib/translations";

// Weather icon mapping
function getWeatherIcon(condition: string, rainProb: number): string {
    const c = condition.toLowerCase();
    if (c.includes("thunder") || c.includes("storm")) return "⛈️";
    if (rainProb > 60 || c.includes("rain") || c.includes("drizzle")) return "🌧️";
    if (rainProb > 30) return "🌦️";
    if (c.includes("cloud")) return "☁️";
    if (c.includes("clear") || c.includes("sunny")) return "☀️";
    return "⛅";
}

export default function WeatherDetailView({
    weather,
    onBack,
    lang,
}: {
    weather: DetailedWeather;
    onBack: () => void;
    lang: Language;
}) {
    const { current, forecast, alerts } = weather;

    return (
        <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="flex flex-col flex-1 h-full max-h-[calc(100vh-var(--nav-height))] overflow-y-auto hide-scrollbar"
            style={{ background: "linear-gradient(180deg, #F0F4F8 0%, #E8F4FD 100%)" }}
        >
            {/* Header / Top actions */}
            <div className="flex items-center p-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-100">
                <motion.button
                    onClick={onBack}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 shadow-sm text-lg transition-colors"
                >
                    ←
                </motion.button>
                <div className="flex-1 text-center font-bold text-lg text-gray-800 mr-10">
                    {current.city}
                </div>
            </div>

            <div className="px-4 lg:px-8 max-w-2xl mx-auto w-full pb-10">
                {/* Farmer Alerts Card */}
                {alerts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-5 p-4 rounded-2xl shadow-md border-l-[5px]"
                        style={{
                            background: alerts[0].includes("Perfect") ? "linear-gradient(135deg, #E8F5E9, #C8E6C9)" : "linear-gradient(135deg, #FFF8E1, #FFECB3)",
                            borderColor: alerts[0].includes("Perfect") ? "#4CAF50" : "#FF9800"
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{alerts[0].includes("Perfect") ? "🌾" : "⚠️"}</span>
                            <span className="font-bold text-sm" style={{ color: alerts[0].includes("Perfect") ? "#2E7D32" : "#E65100" }}>
                                {lang === "hi" ? "कृषि मौसम अलर्ट" : "Farming Weather Alerts"}
                            </span>
                        </div>
                        <ul className="space-y-1.5">
                            {alerts.map((alert, idx) => (
                                <li key={idx} className="text-sm leading-snug flex items-start gap-2"
                                    style={{ color: alerts[0].includes("Perfect") ? "#33691E" : "#BF360C" }}>
                                    <span className="mt-0.5">•</span>
                                    <span>{alert}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}

                {/* Main Temperature Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="py-12 mb-5 rounded-3xl shadow-xl text-center relative overflow-hidden group"
                >
                    {/* Video Background */}
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-105"
                        src={(current.type === "rainy" || current.type === "storm") ? "/rainy.mp4" : "/sunshine.mp4"}
                    />

                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-black/40 z-0" />

                    <div className="relative z-10">
                        <motion.span
                            className="text-6xl drop-shadow-2xl block"
                            animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            {current.type === "sunny" || current.type === "morning" ? "☀️" : current.type === "rainy" ? "🌧️" : current.type === "night" ? "🌙" : "🌥️"}
                        </motion.span>
                        <h1 className="text-8xl font-black text-white mt-4 mb-1 tracking-tighter drop-shadow-2xl">
                            {current.temp}°
                        </h1>
                        <p className="text-2xl text-white/95 capitalize font-bold drop-shadow-lg tracking-wide">{current.condition}</p>
                        <div className="mt-5 flex justify-center gap-8 text-white/90 text-base font-medium drop-shadow-md bg-black/20 w-fit mx-auto px-6 py-2 rounded-full backdrop-blur-sm border border-white/10">
                            <span>H: {current.temp + 3}°</span>
                            <span>L: {current.temp - 4}°</span>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-3 gap-3 mb-5"
                >
                    <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                        <span className="text-2xl block mb-1">🌡️</span>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{lang === "hi" ? "मिट्टी" : "Soil"}</p>
                        <p className="text-lg font-bold text-gray-800">{current.soilTemp}°C</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                        <span className="text-2xl block mb-1">💨</span>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{lang === "hi" ? "हवा" : "Wind"}</p>
                        <p className="text-lg font-bold text-gray-800">{current.windSpeed.toFixed(0)} km/h</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                        <span className="text-2xl block mb-1">💧</span>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{lang === "hi" ? "नमी" : "Humidity"}</p>
                        <p className="text-lg font-bold text-gray-800">{current.humidity}%</p>
                    </div>
                </motion.div>

                {/* Sun Times Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="grid grid-cols-2 gap-3 mb-5"
                >
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl shadow-sm flex items-center gap-3">
                        <span className="text-3xl">🌅</span>
                        <div>
                            <p className="text-xs text-amber-700 font-medium">{lang === "hi" ? "सूर्योदय" : "Sunrise"}</p>
                            <p className="text-lg font-bold text-amber-900">
                                {new Date(current.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-2xl shadow-sm flex items-center gap-3">
                        <span className="text-3xl">🌇</span>
                        <div>
                            <p className="text-xs text-purple-700 font-medium">{lang === "hi" ? "सूर्यास्त" : "Sunset"}</p>
                            <p className="text-lg font-bold text-purple-900">
                                {new Date(current.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* 7-Day Forecast */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-5"
                >
                    <h3 className="font-bold text-gray-800 mb-3 ml-1 text-base flex items-center gap-2">
                        📅 {lang === "hi" ? "7 दिन का पूर्वानुमान" : "7-Day Forecast"}
                    </h3>
                    <div className="bg-white rounded-3xl shadow-md overflow-hidden">
                        {forecast.slice(0, 7).map((day, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 + idx * 0.05 }}
                                className={`flex items-center justify-between p-4 ${idx !== Math.min(forecast.length - 1, 6) ? 'border-b border-gray-50' : ''}`}
                            >
                                <div className="w-24">
                                    <p className="text-sm font-bold text-gray-800">
                                        {idx === 0 ? (lang === "hi" ? "आज" : "Today")
                                            : day.date.toLocaleDateString("en-IN", { weekday: "short" })}
                                    </p>
                                    <p className="text-xs text-gray-400 font-medium">
                                        {day.date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">
                                        {getWeatherIcon(day.condition, day.rainProb)}
                                    </span>
                                    {day.rainProb > 10 && (
                                        <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                                            💧 {day.rainProb}%
                                        </span>
                                    )}
                                </div>
                                <div className="w-20 text-right">
                                    <span className="text-base font-bold text-gray-800">{day.tempMax}°</span>
                                    <span className="text-base font-medium text-gray-400 ml-2">{day.tempMin}°</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Additional Environmental Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    <h3 className="font-bold text-gray-800 mb-3 ml-1 text-base flex items-center gap-2">
                        🌍 {lang === "hi" ? "पर्यावरण जानकारी" : "Environmental Info"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🌱</span>
                                <p className="text-xs text-gray-500 font-medium">{lang === "hi" ? "वर्षा" : "Precipitation"}</p>
                            </div>
                            <p className="text-xl font-bold text-gray-800">{current.precipitation || 0} mm</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🌾</span>
                                <p className="text-xs text-gray-500 font-medium">{lang === "hi" ? "खेती की स्थिति" : "Farming Condition"}</p>
                            </div>
                            <p className="text-sm font-bold text-green-700">
                                {current.humidity > 80 ? (lang === "hi" ? "नम" : "Humid") :
                                    current.humidity < 30 ? (lang === "hi" ? "शुष्क" : "Dry") :
                                        (lang === "hi" ? "अनुकूल" : "Favorable")}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
