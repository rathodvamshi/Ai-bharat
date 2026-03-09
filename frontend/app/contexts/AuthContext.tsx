"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

// ─────────────────────────────────────────────
// AUTH CONTEXT TYPES
// ─────────────────────────────────────────────
interface AuthUser {
  user_id: string;
  phone: string;
  name: string;
  village?: string;
  district?: string;
  land?: string;
  profile_image?: string;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  register: (phone: string, password: string, name: string) => Promise<boolean>;
  checkPhone: (phone: string) => Promise<boolean>;
  updateProfile: (data: Partial<AuthUser>) => Promise<boolean>;
  updatePhone: (currentPassword: string, newPhone: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` 
  : "http://localhost:8000/api/v1";

// ─────────────────────────────────────────────
// AUTH PROVIDER
// ─────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ─── Fetch full profile from backend ───────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string, phone: string) => {
    try {
      const res = await fetch(`${API_BASE}/user/profile/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser({ ...data, isAuthenticated: true });
        localStorage.setItem("jan-sahayak-user", JSON.stringify({ user_id: userId, phone }));
      }
    } catch (e) {
      console.error("Failed to fetch profile", e);
    }
  }, []);

  // ─── Load user from localStorage on mount ──────────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem("jan-sahayak-user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        fetchProfile(parsed.user_id, parsed.phone);
      } catch {
        localStorage.removeItem("jan-sahayak-user");
      }
    }
    setIsLoading(false);
  }, [fetchProfile]);

  // ─── Check Phone existence ────────────────────────────────────────────────
  const checkPhone = useCallback(async (phone: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/check-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      return data.exists;
    } catch (e) {
      return false;
    }
  }, []);

  // ─── Login function ────────────────────────────────────────────────────────
  const login = useCallback(async (phone: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (data.success) {
        await fetchProfile(data.user_id, data.phone);
        localStorage.setItem("jan-sahayak-token", data.token); // Store spec-required JWT
        router.push("/app/home");
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }, [router, fetchProfile]);

  // ─── Register function (Sign Up) ──────────────────────────────────────────
  const register = useCallback(async (phone: string, password: string, name: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, name })
      });
      const data = await res.json();
      if (data.success) {
        await fetchProfile(data.user_id, phone);
        router.push("/app/home");
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }, [router, fetchProfile]);

  // ─── Update Profile ──────────────────────────────────────────────────────
  const updateProfile = useCallback(async (data: Partial<AuthUser>) => {
    if (!user?.user_id) return false;
    try {
      const res = await fetch(`${API_BASE}/user/profile/${user.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setUser(prev => prev ? { ...prev, ...data } : null);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }, [user]);

  // ─── Update Phone ────────────────────────────────────────────────────────
  const updatePhone = useCallback(async (currentPassword: string, newPhone: string) => {
    if (!user?.user_id) return false;
    try {
      const res = await fetch(`${API_BASE}/user/update-phone/${user.user_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_phone: newPhone })
      });
      if (res.ok) {
        setUser(prev => prev ? { ...prev, phone: newPhone } : null);
        localStorage.setItem("jan-sahayak-user", JSON.stringify({ user_id: user.user_id, phone: newPhone }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }, [user]);

  // ─── Logout function ───────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("jan-sahayak-user");
    localStorage.removeItem("jan-sahayak-token");
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user, isLoading, login, register, checkPhone,
      updateProfile, updatePhone, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────
// USE AUTH HOOK
// ─────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ─────────────────────────────────────────────
// PROTECTED ROUTE WRAPPER
// ─────────────────────────────────────────────
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user?.isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
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

  if (!user?.isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
