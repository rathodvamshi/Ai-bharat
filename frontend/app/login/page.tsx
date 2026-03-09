"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginScreen from "../components/LoginScreen";
import { useAuth } from "../contexts/AuthContext";
import { useDeviceLayout } from "../hooks/useDeviceLayout";
import { Language } from "../lib/translations";

// Loading skeleton for login page
function LoginLoading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #F5FFF5 0%, #E8F5E9 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #2E7D32, #43A047)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          boxShadow: "0 8px 32px rgba(46,125,50,0.3)",
        }}
      >
        🌾
      </div>
    </div>
  );
}

// Login page content that uses searchParams
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isLoading } = useAuth();
  const deviceLayout = useDeviceLayout();
  const redirect = searchParams.get("redirect") || "/app/home";

  // Language state - check localStorage for saved preference
  const [lang, setLang] = useState<Language>("hi");

  useEffect(() => {
    const saved = localStorage.getItem("jan-sahayak-lang");
    if (saved === "en" || saved === "hi" || saved === "te") {
      setLang(saved);
    }
  }, []);

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("jan-sahayak-lang", newLang);
  };

  // If already logged in, redirect
  useEffect(() => {
    if (!isLoading && user?.isAuthenticated) {
      router.replace(redirect);
    }
  }, [user, isLoading, router, redirect]);

  const handleBack = () => {
    router.push("/");
  };

  const handleLogin = (phone: string, password?: string) => {
    login(phone, password || "123456");
  };

  if (isLoading || deviceLayout === null) {
    return <LoginLoading />;
  }

  if (user?.isAuthenticated) {
    return <LoginLoading />;
  }

  // Desktop/Tablet layout - centered card
  if (deviceLayout === "desktop" || deviceLayout === "tablet") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F5FFF5 0%, #E8F5E9 100%)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            maxHeight: "90vh",
            overflow: "auto",
            borderRadius: 24,
            boxShadow: "0 8px 40px rgba(46,125,50,0.15)",
            background: "#fff",
          }}
        >
          <LoginScreen
            onBack={handleBack}
            onLogin={handleLogin}
            lang={lang}
            onLangChange={handleLangChange}
          />
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="app-shell overflow-y-auto">
      <LoginScreen
        onBack={handleBack}
        onLogin={handleLogin}
        lang={lang}
        onLangChange={handleLangChange}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
