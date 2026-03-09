"use client";

import { motion } from "framer-motion";
import { Check, Upload, Clock } from "lucide-react";

interface Document {
  id: string;
  label: string;
  uploaded: boolean;
  fileName?: string;
  uploadedAt?: string;
}

interface DocumentCardProps {
  documents: Document[];
  currentDocumentIndex?: number;
  onUpload?: () => void;
}

export default function DocumentCard({
  documents,
  currentDocumentIndex = 0,
  onUpload,
}: DocumentCardProps) {
  const uploadedCount = documents.filter((d) => d.uploaded).length;
  const allUploaded = uploadedCount === documents.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-purple-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">
            📄 Required Documents
          </h2>
          <span className="text-sm font-semibold text-purple-600">
            {uploadedCount} of {documents.length} uploaded
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            layoutId="doc-progress"
            initial={{ width: 0 }}
            animate={{ width: `${(uploadedCount / documents.length) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-3">
        {documents.map((doc, idx) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-4 rounded-lg border-2 transition-all ${
              doc.uploaded
                ? "bg-purple-50 border-purple-200"
                : "bg-gray-50 border-gray-300"
            } ${
              idx === currentDocumentIndex && !doc.uploaded
                ? "ring-2 ring-blue-400"
                : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {doc.uploaded ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <Check className="w-6 h-6 text-white" />
                  </motion.div>
                ) : idx === currentDocumentIndex ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <Upload className="w-6 h-6 text-white" />
                  </motion.div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-6 h-6 text-gray-600" />
                  </div>
                )}

                <div>
                  <p className="font-semibold text-gray-800">{doc.label}</p>
                  {doc.uploaded && doc.fileName && (
                    <p className="text-xs text-gray-500 mt-1">✓ File: {doc.fileName}</p>
                  )}
                  {doc.uploaded && doc.uploadedAt && (
                    <p className="text-xs text-green-600 mt-1">{doc.uploadedAt}</p>
                  )}
                  {idx === currentDocumentIndex && !doc.uploaded && (
                    <p className="text-sm text-blue-600 font-medium mt-1">Ready to upload...</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      {allUploaded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-4 bg-green-50 border-t border-green-100"
        >
          <p className="text-sm font-semibold text-green-700">
            ✓ All documents uploaded successfully!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
