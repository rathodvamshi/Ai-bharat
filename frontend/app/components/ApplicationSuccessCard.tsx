"use client";

import { motion } from "framer-motion";
import { Copy, CheckCircle, Clock, Download } from "lucide-react";
import { useState } from "react";

interface ApplicationSuccessCardProps {
  applicationId: string;
  schemeName: string;
  schemeIcon?: string;
  submittedAt: string;
  referenceNumber?: string;
  onViewDetails?: () => void;
  onDownloadReceipt?: () => void;
}

export default function ApplicationSuccessCard({
  applicationId,
  schemeName,
  schemeIcon = "📋",
  submittedAt,
  referenceNumber,
  onViewDetails,
  onDownloadReceipt,
}: ApplicationSuccessCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse submitted date
  const submittedDate = new Date(submittedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "spring" }}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 max-w-2xl"
    >
      {/* Celebration Animation */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -50, opacity: 1 }}
            animate={{ y: 300, opacity: 0 }}
            transition={{
              duration: 2.5,
              delay: i * 0.1,
              repeat: Infinity,
            }}
            className="absolute left-1/2 ml-4"
          >
            {["🎉", "✨", "🎊", "⭐", "🌟", "💫"][i]}
          </motion.div>
        ))}
      </motion.div>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 px-6 py-12 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-pattern"></div>
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="relative z-10"
        >
          <div className="inline-block">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="text-6xl mb-4"
            >
              ✅
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Application Submitted!</h1>
          <p className="text-green-100 text-lg">Your application has been successfully received.</p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-6 py-8 space-y-6">
        {/* Scheme Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-green-50 rounded-xl p-4 border border-green-200"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{schemeIcon}</span>
            <div>
              <p className="text-sm text-gray-600 font-medium">Scheme Applied For</p>
              <p className="text-lg font-bold text-gray-800">{schemeName}</p>
            </div>
          </div>
        </motion.div>

        {/* Application ID Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200"
        >
          <p className="text-sm text-gray-600 font-semibold mb-3">🔖 Application ID (Save this!)</p>
          <div className="bg-white rounded-lg p-4 flex items-center gap-3 border border-blue-100">
            <code className="flex-1 text-lg font-bold text-gray-800 break-all">
              {applicationId}
            </code>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyId}
              className="flex-shrink-0 p-2 hover:bg-blue-100 rounded-lg transition-colors"
              title="Copy ID"
            >
              {copied ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-blue-600" />
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4"
        >
          {/* Submitted Time */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <p className="text-xs text-gray-600 font-medium mb-2">Submitted</p>
            <p className="text-sm font-bold text-gray-800">{submittedDate}</p>
          </div>

          {/* Status */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <p className="text-xs text-gray-600 font-medium mb-2">Status</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-bold text-gray-800">Under Review</p>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 rounded-xl p-5 border border-blue-200"
        >
          <p className="text-sm font-bold text-gray-800 mb-3">📋 Next Steps</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span>1️⃣</span>
              <span>Our team will review your application</span>
            </li>
            <li className="flex gap-2">
              <span>2️⃣</span>
              <span>You'll receive updates via SMS and email</span>
            </li>
            <li className="flex gap-2">
              <span>3️⃣</span>
              <span>Once approved, you can access scheme benefits</span>
            </li>
          </ul>
        </motion.div>

        {/* Info Box */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-xs text-gray-600">
          <p>
            <strong>💡 Tip:</strong> Save your Application ID to track your application anytime.
            Our team typically reviews applications within 2-3 working days.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onViewDetails}
          className="flex-1 py-3 px-4 rounded-lg border-2 border-blue-500 font-semibold text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          View Details
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDownloadReceipt}
          className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 font-semibold text-white hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Receipt
        </motion.button>
      </div>
    </motion.div>
  );
}
