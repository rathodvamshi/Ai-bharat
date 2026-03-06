"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Language, t, TRANSLATIONS } from "../lib/translations";

// Re-export Language type
export type { Language } from "../lib/translations";

// ─────────────────────────────────────────────
// SCHEME CONTEXT TYPE
// ─────────────────────────────────────────────
export interface SchemeContext {
  id: string;
  name: string;
  nameHi: string;
  desc: string;
  descHi: string;
  benefit: string;
  benefitHi: string;
}

// ─────────────────────────────────────────────
// NAVIGATION TYPES
// ─────────────────────────────────────────────
export type NavTab = "home" | "schemes" | "voice" | "history" | "profile";

export const NAV_ROUTES: Record<NavTab, string> = {
  home: "/app/home",
  schemes: "/app/schemes",
  voice: "/app/voice",
  history: "/app/history",
  profile: "/app/profile",
};

export const NAV_ITEMS: {
  id: NavTab;
  icon: string;
  label: string;
  labelHi: string;
  labelBn: string;
  labelTe: string;
  labelMr: string;
  labelTa: string;
  isMic?: boolean
}[] = [
    { id: "home", icon: "🏠", label: "Home", labelHi: "होम", labelBn: "হোম", labelTe: "హోమ్", labelMr: "होम", labelTa: "முகப்பு" },
    { id: "schemes", icon: "🏛️", label: "Schemes", labelHi: "योजनाएं", labelBn: "প্রকল্প", labelTe: "పథకాలు", labelMr: "योजना", labelTa: "திட்டங்கள்" },
    { id: "voice", icon: "👩‍💼", label: "Talk to Didi", labelHi: "दीदी से बात करें", labelBn: "দিদির সাথে কথা বলুন", labelTe: "దీదీతో మాట్లాడండి", labelMr: "दीदींशी बोला", labelTa: "திதியுடன் பேசுங்கள்", isMic: true },
    { id: "history", icon: "📋", label: "History", labelHi: "इतिहास", labelBn: "ইতিহাস", labelTe: "చరిత్ర", labelMr: "इतिहास", labelTa: "வரலாறு" },
    { id: "profile", icon: "👤", label: "Profile", labelHi: "प्रोफ़ाइल", labelBn: "প্রோফাইল", labelTe: "ప్రొఫైల్", labelMr: "प्रोफाइल", labelTa: "சுயவிவரம்" },
  ];

export const TAB_LABELS: Record<NavTab, Record<Language, string>> = {
  home: { en: "Janashayak", hi: "जन-सहायक", bn: "জন-সহায়ক", te: "జన్-సహాయక్", mr: "जन-सहायक", ta: "விவசாயி உதவியாளர்" },
  schemes: { en: "Government Schemes", hi: "सरकारी योजनाएं", bn: "সরকারি প্রকল্প", te: "ప్రభుత్వ పథకాలు", mr: "सरकारी योजना", ta: "அரசு திட்டங்கள்" },
  voice: { en: "Talk to Didi", hi: "दीदी से बात करें", bn: "দিদির সাথে কথা বলুন", te: "దీదీతో మాట్లాడండి", mr: "दीदींशी बोला", ta: "திதியுடன் பேசுங்கள்" },
  history: { en: "My Applications", hi: "मेरे आवेदन", bn: "আমার আবেদন", te: "నా దరఖాస్తులు", mr: "माझे अर्ज", ta: "எனது விண்ணப்பங்கள்" },
  profile: { en: "My Profile", hi: "मेरी प्रोफ़ाइल", bn: "আমার প্রোফাইল", te: "నా ప్రొఫైల్", mr: "माझी प्रोफाइल", ta: "எனது சுயவிவரம்" },
};

// Helper to get label by language
export function getNavLabel(item: typeof NAV_ITEMS[0], lang: Language): string {
  switch (lang) {
    case "hi": return item.labelHi;
    case "bn": return item.labelBn;
    case "te": return item.labelTe;
    case "mr": return item.labelMr;
    case "ta": return item.labelTa;
    default: return item.label;
  }
}

export function getTabLabel(tab: NavTab, lang: Language): string {
  return TAB_LABELS[tab][lang];
}

// ─────────────────────────────────────────────
// NAVIGATION CONTEXT
// ─────────────────────────────────────────────
interface NavigationContextType {
  currentTab: NavTab;
  language: Language;
  navigateTo: (tab: NavTab) => void;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  getActiveTabFromPath: (pathname: string) => NavTab;
  schemeContext: SchemeContext | null;
  setSchemeContext: (scheme: SchemeContext | null) => void;
  navigateToVoiceWithScheme: (scheme: SchemeContext) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// ─────────────────────────────────────────────
// NAVIGATION PROVIDER
// ─────────────────────────────────────────────
export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Scheme context for passing scheme info to voice assistant
  const [schemeContext, setSchemeContextState] = useState<SchemeContext | null>(null);

  // Get active tab from pathname
  const getActiveTabFromPath = useCallback((path: string): NavTab => {
    for (const [tab, route] of Object.entries(NAV_ROUTES)) {
      if (path === route || path.startsWith(route + "/")) {
        return tab as NavTab;
      }
    }
    return "home";
  }, []);

  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get from localStorage on client
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("jan-sahayak-lang");
      const validLanguages: Language[] = ["en", "hi", "bn", "te", "mr", "ta"];
      return validLanguages.includes(stored as Language) ? stored as Language : "hi";
    }
    return "hi";
  });

  const currentTab = getActiveTabFromPath(pathname);

  // ─── Navigate to tab ───────────────────────────────────────────────────────
  const navigateTo = useCallback((tab: NavTab) => {
    const route = NAV_ROUTES[tab];
    router.push(route);
  }, [router]);

  // ─── Set language ──────────────────────────────────────────────────────────
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("jan-sahayak-lang", lang);
    }
  }, []);

  // ─── Toggle language (cycles through all languages) ────────────────────
  const toggleLanguage = useCallback(() => {
    setLanguageState(prev => {
      const cycle: Language[] = ["hi", "bn", "te", "mr", "ta", "en"];
      const currentIndex = cycle.indexOf(prev);
      const newLang = cycle[(currentIndex + 1) % cycle.length];
      if (typeof window !== "undefined") {
        localStorage.setItem("jan-sahayak-lang", newLang);
      }
      return newLang;
    });
  }, []);

  // ─── Set scheme context ────────────────────────────────────────────────────
  const setSchemeContext = useCallback((scheme: SchemeContext | null) => {
    setSchemeContextState(scheme);
  }, []);

  // ─── Navigate to voice with scheme context ─────────────────────────────────
  const navigateToVoiceWithScheme = useCallback((scheme: SchemeContext) => {
    setSchemeContextState(scheme);
    router.push(NAV_ROUTES.voice);
  }, [router]);

  return (
    <NavigationContext.Provider
      value={{
        currentTab,
        language,
        navigateTo,
        setLanguage,
        toggleLanguage,
        getActiveTabFromPath,
        schemeContext,
        setSchemeContext,
        navigateToVoiceWithScheme,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

// ─────────────────────────────────────────────
// USE NAVIGATION HOOK
// ─────────────────────────────────────────────
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
