"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { Language, LANGUAGES, LanguageInfo } from "@/app/lib/translations";

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  variant?: "button" | "compact" | "full";
  className?: string;
}

export default function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  variant = "button",
  className = "",
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((l: LanguageInfo) => l.code === currentLanguage) || LANGUAGES[0];

  const handleSelect = (lang: Language) => {
    onLanguageChange(lang);
    setIsOpen(false);
  };

  // Compact variant - just icon and abbreviation
  if (variant === "compact") {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-semibold transition-colors"
          style={{ background: "#E8F5E9", color: "#2E7D32" }}
        >
          <span>🌐</span>
          <span>{currentLang.code.toUpperCase()}</span>
          <ChevronDown 
            className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} 
          />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 min-w-[140px] py-1 rounded-xl shadow-xl border"
              style={{ 
                background: "#fff", 
                borderColor: "#E8F5E9",
                boxShadow: "0 8px 30px rgba(46,125,50,0.15)"
              }}
            >
              {LANGUAGES.map((lang: LanguageInfo) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className="w-full px-3 py-2 flex items-center gap-2 text-left text-sm font-medium transition-colors hover:bg-[#F5FFF5]"
                  style={{ color: currentLanguage === lang.code ? "#2E7D32" : "#374151" }}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="flex-1">{lang.nativeName}</span>
                  {currentLanguage === lang.code && (
                    <Check className="w-4 h-4" style={{ color: "#2E7D32" }} />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full variant - shows native name
  if (variant === "full") {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
          style={{ 
            background: "#F5FFF5", 
            color: "#2E7D32",
            border: "1px solid #C8E6C9"
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🌐</span>
            <span>{currentLang.nativeName}</span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} 
          />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-2 z-50 py-1 rounded-xl shadow-xl border"
              style={{ 
                background: "#fff", 
                borderColor: "#E8F5E9",
                boxShadow: "0 8px 30px rgba(46,125,50,0.15)"
              }}
            >
              {LANGUAGES.map((lang: LanguageInfo) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left text-sm font-medium transition-colors hover:bg-[#F5FFF5]"
                  style={{ color: currentLanguage === lang.code ? "#2E7D32" : "#374151" }}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{lang.nativeName}</p>
                    <p className="text-xs opacity-60">{lang.name}</p>
                  </div>
                  {currentLanguage === lang.code && (
                    <Check className="w-5 h-5" style={{ color: "#2E7D32" }} />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default button variant
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <motion.button
        id="lang-toggle-btn"
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs lg:text-sm font-bold shadow-sm transition-colors"
        style={{ 
          background: "#E8F5E9", 
          color: "#2E7D32", 
          border: "1px solid #C8E6C9" 
        }}
      >
        <span>🌐</span>
        <span>{currentLang.nativeName}</span>
        <ChevronDown 
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 min-w-[160px] py-1 rounded-xl shadow-xl border"
            style={{ 
              background: "#fff", 
              borderColor: "#E8F5E9",
              boxShadow: "0 8px 30px rgba(46,125,50,0.15)"
            }}
          >
            {LANGUAGES.map((lang: LanguageInfo) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left text-sm font-semibold transition-colors hover:bg-[#F5FFF5]"
                style={{ color: currentLanguage === lang.code ? "#2E7D32" : "#374151" }}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="flex-1">{lang.nativeName}</span>
                {currentLanguage === lang.code && (
                  <Check className="w-4 h-4" style={{ color: "#2E7D32" }} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
