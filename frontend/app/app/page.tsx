"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────
// APP INDEX PAGE — REDIRECTS TO HOME
// ─────────────────────────────────────────────
export default function AppIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/home");
  }, [router]);

  // Loading skeleton while redirecting
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
    </div>
  );
}
