"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "./components/SplashScreen";
import { useAuth } from "./contexts/AuthContext";

// ─────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #F5FFF5 0%, #E8F5E9 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
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
      <div
        style={{
          width: 40,
          height: 4,
          borderRadius: 2,
          background: "linear-gradient(90deg, #2E7D32, #66BB6A)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT PAGE — SPLASH SCREEN WITH ROUTING
// ─────────────────────────────────────────────
export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Handle splash completion and routing
  const handleSplashDone = () => {
    setShowSplash(false);
    
    // Route based on auth state
    if (user?.isAuthenticated) {
      router.replace("/app/home");
    } else {
      router.replace("/login");
    }
  };

  // If still loading auth state, show loading skeleton
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  // Fallback loading state during navigation
  return <LoadingSkeleton />;
}
