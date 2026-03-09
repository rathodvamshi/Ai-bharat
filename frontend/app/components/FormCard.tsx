"use client";

import { motion } from "framer-motion";
import { Check, Edit2, ClipboardList } from "lucide-react";
import { useState } from "react";

interface FormField {
  id: string;
  label: string;
  type: string;
  value?: string;
  isAutoFilled?: boolean;
}

interface FormCardProps {
  schemeName: string;
  fields: FormField[];
  currentFieldIndex?: number;
  totalFields?: number;
  onFieldEdit?: (fieldId: string) => void;
  completedCount?: number;
}

export default function FormCard({
  schemeName,
  fields,
  currentFieldIndex = 0,
  totalFields = 0,
  onFieldEdit,
  completedCount = 0,
}: FormCardProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["personal"]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const filledFields = fields.filter((f) => f.value).length;
  const progressPercent = (filledFields / fields.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-gradient-to-br from-white via-white to-emerald-50/20 rounded-[2rem] shadow-xl shadow-emerald-100/30 overflow-hidden border border-emerald-100/60"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-5 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
              <ClipboardList size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {schemeName} Application
              </h2>
              <p className="text-emerald-100 text-sm font-medium">
                {filledFields} of {fields.length} fields completed
              </p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-inner">
            {Math.round(progressPercent)}%
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-white/90 to-white/70 rounded-full"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
        {/* Section: Personal Information */}
        <div className="border border-emerald-100/50 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50/50 to-white">
          <button
            onClick={() => toggleSection("personal")}
            className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">👤</span>
              <span className="font-bold text-slate-700 text-sm">Personal Information</span>
            </div>
            <motion.span 
              animate={{ rotate: expandedSections.includes("personal") ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-bold text-emerald-600"
            >
              ▼
            </motion.span>
          </button>

          {expandedSections.includes("personal") && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="p-4 space-y-2.5"
            >
              {fields.map((field, idx) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                    field.value 
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200/60 shadow-sm" 
                      : "bg-white border-2 border-slate-100/80"
                  } ${currentFieldIndex === idx ? "ring-3 ring-blue-400 ring-offset-2" : ""}`}
                >
                  <div className="flex items-center gap-3.5 flex-1">
                    {field.value ? (
                      <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-lg flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg border-2 border-slate-200 bg-white flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{field.label}</p>
                      {field.value && (
                        <p className="text-sm font-bold text-slate-800 mt-0.5">
                          {field.isAutoFilled && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mr-2">
                              AUTO
                            </span>
                          )}
                          {field.type === "aadhaar" || field.type === "phone"
                            ? `•••• •••• ${field.value.slice(-4)}`
                            : field.value}
                        </p>
                      )}
                    </div>
                  </div>
                  {field.value && onFieldEdit && (
                    <motion.button
                      onClick={() => onFieldEdit(field.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="ml-3 p-2.5 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer"
                      title="Edit field"
                    >
                      <Edit2 className="w-4 h-4 text-emerald-600" />
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer - Status */}
      <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-emerald-100/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-lg flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
          <span className="text-sm font-bold text-slate-700">
            {filledFields}/{fields.length} completed
          </span>
        </div>
        {filledFields === fields.length && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full"
          >
            ✓ Ready to Submit
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
