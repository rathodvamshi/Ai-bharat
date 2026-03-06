"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const t1 = setTimeout(() => setStep(1), 400);
        const t2 = setTimeout(() => setStep(2), 1200);
        const t3 = setTimeout(() => onDone(), 2800);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [onDone]);

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50"
            style={{ background: "linear-gradient(160deg,#F5FFF5 0%,#E8F5E9 60%,#C8E6C9 100%)" }}>
            {/* Decorative blobs */}
            <div className="absolute top-16 left-8 w-32 h-32 rounded-full opacity-30 blur-3xl"
                style={{ background: "#66BB6A" }} />
            <div className="absolute bottom-24 right-8 w-40 h-40 rounded-full opacity-20 blur-3xl"
                style={{ background: "#2E7D32" }} />

            {/* Logo */}
            <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: step >= 1 ? 1 : 0.7, opacity: step >= 1 ? 1 : 0 }}
                transition={{ duration: 0.7, type: "spring", stiffness: 150 }}
                className="logo-glow mb-6"
            >
                <div className="relative w-48 h-48">
                    <Image src="/mainlogo.png" alt="Jan-Sahayak" fill sizes="192px" className="object-contain" priority />
                </div>
            </motion.div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 16 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-2xl font-bold text-center mb-1"
                style={{ color: "#1B5E20" }}
            >
                Jan-Sahayak
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 12 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="text-base font-medium mb-4"
                style={{ color: "#388E3C" }}
            >
                किसान सहायक
            </motion.p>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 10 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-sm mb-8 text-center px-8"
                style={{ color: "#6B7280" }}
            >
                सरकारी योजनाओं की जानकारी अब आपकी भाषा में
            </motion.p>

            {/* Loading dots */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: step >= 2 ? 1 : 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-3"
            >
                <div className="flex gap-2 items-center">
                    {[0, 1, 2, 3, 4].map(i => (
                        <motion.span
                            key={i}
                            animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: "easeInOut"
                            }}
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: "#2E7D32" }}
                        />
                    ))}
                </div>
                <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-sm font-medium"
                    style={{ color: "#66BB6A" }}
                >
                    Loading...
                </motion.p>
            </motion.div>

            {/* Footer text */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: step >= 2 ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute bottom-4 left-0 right-0 flex justify-center"
            >
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    🌾 Made for Indian Farmers 🇮🇳
                </p>
            </motion.div>
        </div>
    );
}
