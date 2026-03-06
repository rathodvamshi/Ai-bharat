"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ChevronRight, Sprout, Check } from "lucide-react";

type Screen = "splash" | "login" | "loading" | "dashboard";

// Seed growing animation component
const SeedGrowAnimation = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#F5FFF5] to-[#E8F5E9]"
    >
      <div className="flex flex-col items-center">
        {/* Ground */}
        <div className="relative w-40 h-32">
          {/* Seed */}
          <motion.div
            initial={{ scale: 1, y: 60 }}
            animate={{ scale: 0, y: 40 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="absolute left-1/2 -translate-x-1/2 w-6 h-4 bg-amber-700 rounded-full"
          />
          
          {/* Stem growing */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 60 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 w-2 bg-gradient-to-t from-[#2E7D32] to-[#4CAF50] rounded-full origin-bottom"
          />
          
          {/* Left leaf */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: -30 }}
            transition={{ duration: 0.4, delay: 1.0, type: "spring" }}
            className="absolute bottom-16 left-1/2 -translate-x-6 w-8 h-4 bg-[#66BB6A] rounded-full origin-right"
          />
          
          {/* Right leaf */}
          <motion.div
            initial={{ scale: 0, rotate: 45 }}
            animate={{ scale: 1, rotate: 30 }}
            transition={{ duration: 0.4, delay: 1.1, type: "spring" }}
            className="absolute bottom-16 left-1/2 translate-x-1 w-8 h-4 bg-[#66BB6A] rounded-full origin-left"
          />
          
          {/* Top leaves */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 1.3, type: "spring" }}
            className="absolute bottom-[72px] left-1/2 -translate-x-1/2"
          >
            <Sprout className="w-10 h-10 text-[#43A047]" />
          </motion.div>
          
          {/* Success tick */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.6, type: "spring" }}
            className="absolute -top-2 left-1/2 -translate-x-1/2"
          >
            <div className="w-10 h-10 bg-[#2E7D32] rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
          </motion.div>
          
          {/* Soil */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-full"
          />
        </div>
        
        {/* Loading text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-[#2E7D32] font-semibold text-lg"
        >
          लॉगिन हो रहा है...
        </motion.p>
      </div>
    </motion.div>
  );
};

// Splash Screen Component
const SplashScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-[#F5FFF5] via-white to-[#E8F5E9]"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-20 h-20 bg-[#66BB6A]/20 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-5 w-32 h-32 bg-[#81C784]/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            opacity: [0.2, 0.35, 0.2]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-40 left-5 w-24 h-24 bg-[#A5D6A7]/30 rounded-full blur-2xl"
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-40 h-40 mb-6"
      >
        <Image
          src="/mainlogo.png"
          alt="Jan-Sahayak Logo"
          fill
          className="object-contain drop-shadow-xl"
          priority
        />
      </motion.div>

      {/* Title */}
      <AnimatePresence>
        {showContent && (
          <>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold text-[#1B5E20] mb-2 text-center"
            >
              Jan-Sahayak
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-[#388E3C] text-lg mb-2 text-center"
            >
              किसान सहायक
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-gray-500 text-sm mb-12 text-center max-w-xs"
            >
              सरकारी योजनाओं की जानकारी अब आपकी भाषा में
            </motion.p>

            {/* Login Button */}
            <motion.button
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.7,
                type: "spring",
                stiffness: 200
              }}
              onClick={onLogin}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl shadow-green-100 p-5 border border-green-100 overflow-hidden group"
            >
              {/* Ripple effect background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#E8F5E9] to-[#C8E6C9] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
              
              <div className="relative flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-[#2E7D32] to-[#43A047] rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                
                <div className="ml-4 flex-1 text-left">
                  <p className="text-[#1B5E20] font-semibold text-lg">
                    Login with Mobile Number
                  </p>
                  <p className="text-gray-500 text-sm">
                    मोबाइल नंबर से लॉगिन करें
                  </p>
                </div>
                
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronRight className="w-6 h-6 text-[#2E7D32]" />
                </motion.div>
              </div>
            </motion.button>

            {/* Hint text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4 text-gray-400 text-sm text-center"
            >
              👆 Tap here to login using your phone number
            </motion.p>

            {/* Decorative footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-8 flex items-center gap-2 text-gray-400 text-xs"
            >
              <span>🌾</span>
              <span>Made for Indian Farmers</span>
              <span>🇮🇳</span>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Login Screen Component
const LoginScreen = ({ 
  onBack, 
  onLogin 
}: { 
  onBack: () => void;
  onLogin: (phone: string) => void;
}) => {
  const [phone, setPhone] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(value);
  };

  const isValid = phone.length === 10;

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="min-h-screen flex flex-col bg-gradient-to-b from-[#F5FFF5] via-white to-[#E8F5E9]"
    >
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center mb-8"
        >
          <ChevronRight className="w-5 h-5 text-[#2E7D32] rotate-180" />
        </motion.button>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold text-[#1B5E20] mb-2"
        >
          Enter Your Mobile Number
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 text-base"
        >
          अपना मोबाइल नंबर दर्ज करें
        </motion.p>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-sm mt-2"
        >
          We will use this number to access your farmer dashboard
        </motion.p>
      </div>

      {/* Phone Input Section */}
      <div className="flex-1 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`
            relative bg-white rounded-2xl p-4 shadow-xl 
            border-2 transition-all duration-300
            ${isFocused ? "border-[#2E7D32] shadow-green-100" : "border-gray-100"}
          `}
        >
          <div className="flex items-center gap-3">
            {/* Country Code */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
              <span className="text-2xl">🇮🇳</span>
              <span className="text-lg font-semibold text-gray-700">+91</span>
            </div>
            
            {/* Divider */}
            <div className="w-px h-10 bg-gray-200" />
            
            {/* Phone Input */}
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter Mobile Number"
              className="flex-1 text-xl font-medium text-[#1B1B1B] placeholder:text-gray-300 outline-none bg-transparent tracking-wider"
              autoFocus
            />
          </div>
          
          {/* Progress indicator */}
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(phone.length / 10) * 100}%` }}
              className={`h-full rounded-full transition-colors ${
                isValid ? "bg-[#2E7D32]" : "bg-[#66BB6A]"
              }`}
            />
          </div>
        </motion.div>

        {/* Phone number format hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-400 text-sm mt-4"
        >
          {phone.length}/10 digits
        </motion.p>
      </div>

      {/* Login Button */}
      <div className="px-6 pb-8">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          disabled={!isValid}
          onClick={() => onLogin(phone)}
          className={`
            w-full py-5 rounded-2xl font-semibold text-lg
            flex items-center justify-center gap-3
            transition-all duration-300 shadow-lg
            ${isValid 
              ? "bg-gradient-to-r from-[#2E7D32] to-[#43A047] text-white shadow-green-200 active:scale-[0.98]" 
              : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            }
          `}
        >
          <span>Login</span>
          <motion.span
            animate={isValid ? { x: [0, 5, 0] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ChevronRight className="w-6 h-6" />
          </motion.span>
        </motion.button>
        
        {/* Security note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-gray-400 text-xs mt-4"
        >
          🔒 Your information is secure with us
        </motion.p>
      </div>
    </motion.div>
  );
};

// Simple Dashboard Placeholder
const Dashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-[#F5FFF5] via-white to-[#E8F5E9] flex flex-col items-center justify-center px-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring" }}
        className="w-20 h-20 bg-gradient-to-br from-[#2E7D32] to-[#43A047] rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-200"
      >
        <Check className="w-10 h-10 text-white" strokeWidth={3} />
      </motion.div>
      
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-[#1B5E20] mb-2"
      >
        Welcome! 🌾
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-gray-500 text-center"
      >
        स्वागत है! आप सफलतापूर्वक लॉगिन हो गए हैं।
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm"
      >
        {[
          { icon: "🌾", label: "Schemes", labelHi: "योजनाएं" },
          { icon: "📋", label: "Apply", labelHi: "आवेदन करें" },
          { icon: "📞", label: "Help", labelHi: "मदद" },
          { icon: "👤", label: "Profile", labelHi: "प्रोफाइल" },
        ].map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-2xl p-5 shadow-lg shadow-green-100 border border-green-50"
          >
            <span className="text-3xl mb-2 block">{item.icon}</span>
            <p className="font-semibold text-[#1B5E20]">{item.label}</p>
            <p className="text-xs text-gray-400">{item.labelHi}</p>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

// Main App Component
export default function MobileApp() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [showAnimation, setShowAnimation] = useState(false);

  const handleLogin = () => {
    setScreen("login");
  };

  const handleSubmitLogin = (phone: string) => {
    console.log("Logging in with:", phone);
    setShowAnimation(true);
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setScreen("dashboard");
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white shadow-2xl shadow-gray-200 overflow-hidden relative">
      <AnimatePresence mode="wait">
        {showAnimation && (
          <SeedGrowAnimation onComplete={handleAnimationComplete} />
        )}
        
        {!showAnimation && screen === "splash" && (
          <SplashScreen onLogin={handleLogin} />
        )}
        
        {!showAnimation && screen === "login" && (
          <LoginScreen 
            onBack={() => setScreen("splash")} 
            onLogin={handleSubmitLogin}
          />
        )}
        
        {!showAnimation && screen === "dashboard" && (
          <Dashboard />
        )}
      </AnimatePresence>
    </div>
  );
}
