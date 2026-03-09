"use client";

import {
  AlertCircle,
  MessageSquare,
  MapPin,
  RefreshCw,
  Bot,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProtectedRoute, useAuth } from "../contexts/AuthContext";
import { NavigationProvider, useNavigation, NAV_ITEMS, TAB_LABELS, getNavLabel, getTabLabel } from "../contexts/NavigationContext";
import type { NavTab } from "../contexts/NavigationContext";
import { useDeviceLayout } from "../hooks/useDeviceLayout";
import LanguageSelector from "../components/LanguageSelector";

// ─────────────────────────────────────────────
// BOTTOM NAV BAR (Mobile)
// ─────────────────────────────────────────────
function BottomNav() {
  const { currentTab, language, navigateTo } = useNavigation();

  return (
    <nav className="app-nav flex items-center justify-around px-1">
      {NAV_ITEMS.map(item => {
        const isActive = currentTab === item.id;
        const isMic = item.isMic;

        return (
          <motion.button
            key={item.id}
            id={`nav-${item.id}`}
            whileTap={{ scale: 0.88 }}
            onClick={() => navigateTo(item.id)}
            className="flex flex-col items-center justify-center relative"
            style={{ minWidth: 52, paddingTop: isMic ? 0 : 4, paddingBottom: 4 }}
          >
            {isMic ? (
              // Floating mic button
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg -mt-8 overflow-hidden
                  ${isActive ? "mic-listening" : "mic-idle"}`}
                style={{
                  background: isActive
                    ? "linear-gradient(135deg,#C62828,#EF5350)"
                    : "linear-gradient(135deg,#2E7D32,#43A047)",
                  boxShadow: isActive
                    ? "0 4px 20px rgba(198,40,40,0.4)"
                    : "0 4px 20px rgba(46,50,50,0.25)",
                }}
              >
                <img src="/live_chatbot.gif" alt="Didi" className="w-[110%] h-[110%] object-cover p-1" />
              </div>
            ) : (
              <>
                <span
                  className="text-2xl transition-transform duration-200"
                  style={{ transform: isActive ? "scale(1.15)" : "scale(1)" }}
                >
                  {item.icon}
                </span>
                <span
                  className="text-xs font-semibold mt-0.5 transition-all"
                  style={{
                    color: isActive ? "#2E7D32" : "#9CA3AF",
                    fontSize: 10,
                  }}
                >
                  {getNavLabel(item, language)}
                </span>
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -bottom-1 w-1 h-1 rounded-full"
                    style={{ background: "#2E7D32" }}
                  />
                )}
              </>
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────
// APP HEADER (Mobile)
// ─────────────────────────────────────────────
function AppHeader() {
  const { currentTab, language, setLanguage } = useNavigation();

  // Hide header on home (weather sky takes full top)
  if (currentTab === "home") return null;

  return (
    <header className="app-header flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-100">
          {
            currentTab === "schemes" ? <span className="text-xl">🏛️</span> :
              currentTab === "voice" ? <img src="/live_chatbot.gif" alt="Didi" className="w-full h-full object-cover rounded-xl" /> :
                currentTab === "history" ? <span className="text-xl">📋</span> : <span className="text-xl">👤</span>
          }
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
            {getTabLabel(currentTab, language)}
          </h1>
        </div>
      </div>
      <LanguageSelector
        currentLanguage={language}
        onLanguageChange={setLanguage}
        variant="compact"
      />
    </header>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR NAV (Desktop/Tablet)
// ─────────────────────────────────────────────
function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const { currentTab, language, navigateTo, setLanguage } = useNavigation();
  const { logout } = useAuth();

  return (
    <motion.aside
      className="desktop-sidebar hide-scrollbar"
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Nav links */}
      <nav className="desktop-sidebar-nav hide-scrollbar">
        {NAV_ITEMS.map(item => {
          const isActive = currentTab === item.id;
          const isMic = item.id === "voice";
          return (
            <motion.button
              key={item.id}
              id={`desk-nav-${item.id}`}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateTo(item.id)}
              title={getNavLabel(item, language)}
              className={[
                "desktop-nav-item",
                isActive ? "desktop-nav-item--active" : "",
                isMic ? "desktop-nav-item--mic" : "",
              ].join(" ")}
              style={{ justifyContent: collapsed ? "center" : "flex-start", marginTop: 8 }}
            >
              <span className="desktop-nav-icon">
                {item.id === "voice" ? (
                  <img src="/live_chatbot.gif" alt="Didi" className="w-full h-full object-cover rounded-lg scale-110" />
                ) : (
                  item.icon
                )}
              </span>

              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                    className="desktop-nav-label"
                  >
                    {getNavLabel(item, language)}
                  </motion.span>
                )}
              </AnimatePresence>

              {isActive && !collapsed && (
                <motion.div
                  layoutId="desktop-nav-indicator"
                  className="desktop-nav-indicator"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />
    </motion.aside>
  );
}

// ─────────────────────────────────────────────
// MOBILE APP LAYOUT
// ─────────────────────────────────────────────
function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-content">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}

// ─────────────────────────────────────────────
// DESKTOP/TABLET LAYOUT
// ─────────────────────────────────────────────
function DesktopLayoutWrapper({ children }: { children: ReactNode }) {
  const { currentTab, language, setLanguage } = useNavigation();
  const { logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div className="desktop-root">
      <SidebarNav collapsed={sidebarCollapsed} />

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🚪</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                {language === "hi" ? "लॉगआउट करें?" : "Logout?"}
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                {language === "hi" ? "क्या आप वास्तव में अपने खाते से बाहर निकलना चाहते हैं?" : "Are you sure you want to sign out from your account?"}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={logout}
                  className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"
                >
                  {language === "hi" ? "हाँ, लॉगआउट करें" : "Yes, Logout"}
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                >
                  {language === "hi" ? "वापस जाएँ" : "Cancel"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="desktop-main">
        {/* Desktop Header */}
        <header className="desktop-header">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="text-xl">☰</span>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-100/50">
              {
                currentTab === "home" ? <span className="text-xl">🏠</span> :
                  currentTab === "schemes" ? <span className="text-xl">🏛️</span> :
                    currentTab === "voice" ? <img src="/live_chatbot.gif" alt="Didi" className="w-full h-full object-cover rounded-xl" /> :
                      currentTab === "history" ? <span className="text-xl">📋</span> : <span className="text-xl">👤</span>
              }
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-green-800 to-emerald-600 bg-clip-text text-transparent">
                {getTabLabel(currentTab, language)}
              </h1>
              {currentTab === 'home' && (
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] -mt-1">
                  Verified AI Assistant
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector
              currentLanguage={language}
              onLanguageChange={setLanguage}
              variant="compact"
            />
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 hover:bg-red-50"
              style={{ color: "#EF5350", border: "1px solid #FFEBEB" }}
            >
              <span className="text-lg">🚪</span>
              <span className="hidden md:inline">{language === "hi" ? "लॉगआउट" : "Logout"}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="desktop-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────
function LayoutLoadingSkeleton() {
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
// APP LAYOUT - RESPONSIVE WRAPPER
// ─────────────────────────────────────────────
function AppLayoutContent({ children }: { children: ReactNode }) {
  const deviceLayout = useDeviceLayout();

  // While layout is being detected
  if (deviceLayout === null) {
    return <LayoutLoadingSkeleton />;
  }

  // Desktop/Tablet layout
  if (deviceLayout === "desktop" || deviceLayout === "tablet") {
    return <DesktopLayoutWrapper>{children}</DesktopLayoutWrapper>;
  }

  // Mobile layout
  return <MobileLayout>{children}</MobileLayout>;
}

// ─────────────────────────────────────────────
// EXPORT APP LAYOUT
// ─────────────────────────────────────────────
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <NavigationProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
      </NavigationProvider>
    </ProtectedRoute>
  );
}
