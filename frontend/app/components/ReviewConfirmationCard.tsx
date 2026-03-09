"use client";

import { motion } from "framer-motion";
import { Check, Edit2, FileCheck, AlertCircle } from "lucide-react";
import { useState } from "react";

interface EligibilityAnswer {
  question: string;
  answer: string | boolean;
  icon: string;
}

interface FormData {
  [key: string]: string;
}

interface DocumentInfo {
  id: string;
  label: string;
  fileName: string;
}

interface ReviewConfirmationCardProps {
  schemeName: string;
  schemeIcon?: string;
  eligibilityAnswers: EligibilityAnswer[];
  formData: FormData;
  documents: DocumentInfo[];
  onEdit?: (fieldId?: string) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export default function ReviewConfirmationCard({
  schemeName,
  schemeIcon = "📋",
  eligibilityAnswers,
  formData,
  documents,
  onEdit,
  onSubmit,
  isSubmitting = false,
}: ReviewConfirmationCardProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "eligibility",
    "personal",
    "documents",
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const formFields = Object.entries(formData);
  const allDocsUploaded = documents.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-2xl"
    >
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 text-white">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-2xl font-bold mb-2">Review Your Application</h1>
          <p className="text-green-100">
            Everything looks perfect! Please review and confirm.
          </p>
        </motion.div>
      </div>

      {/* Scheme Info */}
      <div className="px-6 py-4 bg-green-50 border-b border-green-100">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{schemeIcon}</span>
          <div>
            <p className="text-sm text-gray-600">Selected Scheme</p>
            <p className="text-lg font-bold text-gray-800">{schemeName}</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Eligibility Verification */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="border rounded-xl overflow-hidden bg-blue-50 border-blue-200"
        >
          <button
            onClick={() => toggleSection("eligibility")}
            className="w-full px-4 py-3 flex items-center justify-between bg-blue-100 hover:bg-blue-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800">
                ✓ Eligibility Verified
              </span>
            </div>
            <span className={`transition-transform ${
              expandedSections.includes("eligibility") ? "rotate-180" : ""
            }`}>
              ▼
            </span>
          </button>

          {expandedSections.includes("eligibility") && (
            <div className="p-4 space-y-2">
              {eligibilityAnswers.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                  className="p-3 bg-white rounded-lg border border-blue-100"
                >
                  <p className="text-sm text-gray-600">{item.question}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {item.icon} {String(item.answer)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border rounded-xl overflow-hidden bg-green-50 border-green-200"
        >
          <button
            onClick={() => toggleSection("personal")}
            className="w-full px-4 py-3 flex items-center justify-between bg-green-100 hover:bg-green-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-800">
                ✓ Personal Information ({formFields.length} fields)
              </span>
            </div>
            <span className={`transition-transform ${
              expandedSections.includes("personal") ? "rotate-180" : ""
            }`}>
              ▼
            </span>
          </button>

          {expandedSections.includes("personal") && (
            <div className="p-4 space-y-2">
              {formFields.map(([key, value], idx) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.05 }}
                  className="p-3 bg-white rounded-lg border border-green-100 flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 capitalize">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      {typeof value === "string" && value.length > 8
                        ? `${value.substring(0, 4)}...${value.slice(-4)}`
                        : value}
                    </p>
                  </div>
                  <button
                    onClick={() => onEdit?.(key)}
                    className="ml-2 p-2 opacity-0 group-hover:opacity-100 hover:bg-green-100 rounded-lg transition-all"
                    title="Edit field"
                  >
                    <Edit2 className="w-4 h-4 text-green-600" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Documents */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="border rounded-xl overflow-hidden bg-purple-50 border-purple-200"
        >
          <button
            onClick={() => toggleSection("documents")}
            className="w-full px-4 py-3 flex items-center justify-between bg-purple-100 hover:bg-purple-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-800">
                ✓ Documents Uploaded ({documents.length} files)
              </span>
            </div>
            <span className={`transition-transform ${
              expandedSections.includes("documents") ? "rotate-180" : ""
            }`}>
              ▼
            </span>
          </button>

          {expandedSections.includes("documents") && (
            <div className="p-4 space-y-2">
              {documents.map((doc, idx) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  className="p-3 bg-white rounded-lg border border-purple-100 flex items-center gap-3"
                >
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">{doc.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">📎 {doc.fileName}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onEdit?.()}
          className="flex-1 py-2.5 px-4 rounded-lg border-2 border-gray-300 font-semibold text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition-all"
        >
          <Edit2 className="w-4 h-4 inline mr-2" />
          Edit
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 font-semibold text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Submitting...
            </>
          ) : (
            <>
              <FileCheck className="w-4 h-4 inline mr-2" />
              Submit Application
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
