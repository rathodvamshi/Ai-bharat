"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ClipboardList, X, CheckCircle2, XCircle, AlertTriangle, RefreshCw, MessageCircle, Pencil, Trash2, FileDown, Eye, Sparkles } from "lucide-react";
import { Language } from "../lib/translations";
import { useNavigation } from "../contexts/NavigationContext";

interface HistoryItem {
    id: string; // Map to application_id
    title: string;
    titleHi: string;
    scheme: string;
    schemeHi: string;
    status: string;
    date: string;
    amount: string;
    applicationNo: string;
    applicantName: string;
    formData: any;
    submittedAt: string;
    rejectionReason?: string;
    uploadedDocuments?: Record<string, any>;
}

const API_BASE = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    : "http://localhost:8000";

const STATUS_CONFIG: Record<string, { label: string; labelHi: string; emoji: string; cls: string }> = {
    approved: { label: "Approved", labelHi: "स्वीकृत", emoji: "✅", cls: "badge-approved" },
    pending: { label: "Pending", labelHi: "लंबित", emoji: "⏳", cls: "badge-pending" },
    submitted: { label: "Submitted", labelHi: "जमा किया गया", emoji: "📩", cls: "badge-pending" },
    rejected: { label: "Rejected", labelHi: "अस्वीकृत", emoji: "❌", cls: "badge-rejected" },
    processing: { label: "Processing", labelHi: "प्रक्रिया में", emoji: "🔄", cls: "badge-processing" },
};

// Icons as SVG components
const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const ChatIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const CancelIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// Application Detail Modal
function ApplicationDetailModal({
    item,
    lang,
    onClose
}: {
    item: HistoryItem;
    lang: Language;
    onClose: () => void;
}) {
    const sc = STATUS_CONFIG[item.status];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b" style={{ background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)" }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">
                                {lang === "hi" ? "आवेदन विवरण" : "Application Details"}
                            </h2>
                            <p className="text-xs text-white/80 mt-0.5">#{item.applicationNo}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(85vh - 80px)" }}>
                    {/* Personal Details */}
                    <div className="mb-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#9CA3AF" }}>
                            {lang === "hi" ? "आवेदन विवरण" : "Application Details"}
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                            {Object.entries(item.formData).map(([key, value]) => (
                                <DetailRow
                                    key={key}
                                    label={key.replace(/_/g, ' ').toUpperCase()}
                                    value={String(value)}
                                />
                            ))}
                        </div>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "#6B7280" }}>{label}</span>
            <span className="text-sm font-medium" style={{ color: "#1F2937" }}>{value}</span>
        </div>
    );
}

// Download Certificate Function
function downloadCertificate(item: HistoryItem, lang: Language) {
    const sc = STATUS_CONFIG[item.status];

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Application Certificate - ${item.applicationNo}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Noto Sans Devanagari', 'Segoe UI', sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .certificate {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 3px solid #1B5E20;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%);
            padding: 30px;
            text-align: center;
            color: white;
        }
        .emblem {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
        }
        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
        }
        .header h2 {
            font-size: 16px;
            font-weight: normal;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .status-badge {
            display: inline-block;
            padding: 10px 30px;
            border-radius: 30px;
            font-size: 18px;
            font-weight: bold;
            margin: 0 auto 25px;
            background: #E8F5E9;
            color: #1B5E20;
            border: 2px solid #1B5E20;
        }
        .status-section {
            text-align: center;
            margin-bottom: 25px;
        }
        .app-number {
            text-align: center;
            font-size: 14px;
            color: #666;
            margin-bottom: 25px;
        }
        .app-number strong {
            color: #1B5E20;
            font-size: 16px;
        }
        .section {
            margin-bottom: 25px;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            overflow: hidden;
        }
        .section-header {
            background: #F3F4F6;
            padding: 12px 20px;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section-content {
            padding: 15px 20px;
        }
        .row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px dashed #E5E7EB;
        }
        .row:last-child {
            border-bottom: none;
        }
        .label {
            color: #6B7280;
            font-size: 14px;
        }
        .value {
            color: #1F2937;
            font-weight: 600;
            font-size: 14px;
        }
        .amount-box {
            background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin-bottom: 25px;
        }
        .amount-label {
            font-size: 14px;
            color: #2E7D32;
            margin-bottom: 5px;
        }
        .amount-value {
            font-size: 32px;
            font-weight: bold;
            color: #1B5E20;
        }
        .footer {
            background: #F9FAFB;
            padding: 20px 30px;
            border-top: 1px solid #E5E7EB;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .footer-text {
            font-size: 12px;
            color: #9CA3AF;
        }
        .qr-placeholder {
            width: 60px;
            height: 60px;
            background: #E5E7EB;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #9CA3AF;
        }
        .signature-area {
            text-align: right;
        }
        .signature-line {
            width: 150px;
            border-top: 1px solid #374151;
            margin-left: auto;
            margin-bottom: 5px;
        }
        .signature-text {
            font-size: 12px;
            color: #6B7280;
        }
        @media print {
            body { background: white; padding: 0; }
            .certificate { border: none; box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="emblem">🏛️</div>
            <h1>${lang === "hi" ? "भारत सरकार" : "Government of India"}</h1>
            <h2>${lang === "hi" ? item.schemeHi : item.scheme}</h2>
        </div>
        
        <div class="content">
            <div class="status-section">
                <div class="status-badge">${sc.emoji} ${lang === "hi" ? sc.labelHi : sc.label}</div>
            </div>
            
            <div class="app-number">
                ${lang === "hi" ? "आवेदन संख्या" : "Application Number"}: <strong>${item.applicationNo}</strong>
            </div>
            
            <div class="amount-box">
                <div class="amount-label">${lang === "hi" ? "स्वीकृत राशि" : "Sanctioned Amount"}</div>
                <div class="amount-value">${item.amount}</div>
            </div>
            
            <div class="section">
                <div class="section-header">${lang === "hi" ? "आवेदन विवरण" : "Application Details"}</div>
                <div class="section-content">
                    <div class="row">
                        <span class="label">${lang === "hi" ? "आवेदन प्रकार" : "Application Type"}</span>
                        <span class="value">${lang === "hi" ? item.titleHi : item.title}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "योजना" : "Scheme"}</span>
                        <span class="value">${lang === "hi" ? item.schemeHi : item.scheme}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "आवेदन तिथि" : "Application Date"}</span>
                        <span class="value">${item.date}</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">${lang === "hi" ? "व्यक्तिगत विवरण" : "Personal Details"}</div>
                <div class="section-content">
                    <div class="row">
                        <span class="label">${lang === "hi" ? "आवेदक का नाम" : "Applicant Name"}</span>
                        <span class="value">${item.applicantName || item.formData?.full_name || "—"}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "पिता का नाम" : "Father's Name"}</span>
                        <span class="value">${item.formData?.father_name || "—"}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "आधार नंबर" : "Aadhar Number"}</span>
                        <span class="value">${item.formData?.aadhar_number || "—"}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "मोबाइल नंबर" : "Mobile Number"}</span>
                        <span class="value">${item.formData?.mobile_number || item.formData?.phone || "—"}</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">${lang === "hi" ? "पता" : "Address"}</div>
                <div class="section-content">
                    <div class="row">
                        <span class="label">${lang === "hi" ? "गाँव" : "Village"}</span>
                        <span class="value">${item.formData?.village || item.formData?.address || "—"}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "जिला" : "District"}</span>
                        <span class="value">${item.formData?.district || "—"}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "राज्य" : "State"}</span>
                        <span class="value">${item.formData?.state || "—"}</span>
                    </div>
                </div>
            </div>
            
            ${item.formData?.bank_name ? `
            <div class="section">
                <div class="section-header">${lang === "hi" ? "बैंक विवरण" : "Bank Details"}</div>
                <div class="section-content">
                    <div class="row">
                        <span class="label">${lang === "hi" ? "बैंक का नाम" : "Bank Name"}</span>
                        <span class="value">${item.formData?.bank_name || "—"}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "खाता संख्या" : "Account Number"}</span>
                        <span class="value">${item.formData?.account_number || "—"}</span>
                    </div>
                    <div class="row">
                        <span class="label">IFSC Code</span>
                        <span class="value">${item.formData?.ifsc_code || "—"}</span>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <div class="qr-placeholder">QR Code</div>
            <div class="footer-text">
                ${lang === "hi" ? "यह एक कंप्यूटर जनित दस्तावेज़ है" : "This is a computer generated document"}<br/>
                ${lang === "hi" ? "जनरेट किया गया" : "Generated on"}: ${new Date().toLocaleDateString()}
            </div>
            <div class="signature-area">
                <div class="signature-line"></div>
                <div class="signature-text">${lang === "hi" ? "अधिकृत हस्ताक्षर" : "Authorized Signature"}</div>
            </div>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.applicationNo}_certificate.html`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Use setTimeout to ensure click completes before cleanup
    setTimeout(() => {
        if (a.parentNode) {
            a.parentNode.removeChild(a);
        }
        URL.revokeObjectURL(url);
    }, 100);
}

export default function HistoryScreen({ lang }: { lang: Language }) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
    const [showStatusAlert, setShowStatusAlert] = useState<{ 
        type: 'approved' | 'rejected';
        title: string;
        msg: string;
        item?: HistoryItem;
    } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { navigateTo, setSchemeContext } = useNavigation();

    const fetchHistory = useCallback(async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) setIsRefreshing(true);
            const deviceId = localStorage.getItem("jan-sahayak-device-id");
            if (!deviceId) {
                setLoading(false);
                return;
            }

            const res = await fetch(`${API_BASE}/api/v1/user/applications?user_id=${deviceId}`);
            const data = await res.json();

            if (data.success && data.applications) {
                const mapped: HistoryItem[] = data.applications.map((app: any) => ({
                    id: app.application_id,
                    title: app.scheme_name,
                    titleHi: app.scheme_name,
                    scheme: app.scheme_name,
                    schemeHi: app.scheme_name,
                    status: (app.status || "submitted").toLowerCase(),
                    date: new Date(app.submitted_at).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                    }),
                    amount: "₹--",
                    applicationNo: app.application_id,
                    applicantName: app.form_data?.full_name || "Applicant",
                    formData: app.form_data || {},
                    submittedAt: app.submitted_at,
                    rejectionReason: app.rejection_reason,
                    uploadedDocuments: app.uploaded_documents || {}
                }));

                // Check for status changes and show popup notification
                const lastHistoryStr = localStorage.getItem("jan-sahayak-history-last");
                if (lastHistoryStr) {
                    try {
                        const lastHistory = JSON.parse(lastHistoryStr);
                        mapped.forEach(app => {
                            const prev = lastHistory.find((p: any) => p.id === app.id);
                            if (prev && prev.status !== app.status) {
                                if (app.status === 'approved') {
                                    setShowStatusAlert({
                                        type: 'approved',
                                        title: lang === "hi" ? "आवेदन स्वीकृत! 🎉" : "Application Approved! 🎉",
                                        msg: lang === "hi" 
                                            ? `आपका आवेदन ${app.applicationNo} (${app.title}) स्वीकृत हो गया है!`
                                            : `Your application ${app.applicationNo} for ${app.title} has been approved!`,
                                        item: app
                                    });
                                } else if (app.status === 'rejected') {
                                    setShowStatusAlert({
                                        type: 'rejected',
                                        title: lang === "hi" ? "आवेदन अस्वीकृत" : "Application Rejected",
                                        msg: app.rejectionReason || (lang === "hi" 
                                            ? `आपका आवेदन ${app.applicationNo} अस्वीकृत हो गया है।`
                                            : `Your application ${app.applicationNo} has been rejected.`),
                                        item: app
                                    });
                                }
                            }
                        });
                    } catch (e) {
                        console.error("Parse error:", e);
                    }
                }

                setHistory(mapped);
                localStorage.setItem("jan-sahayak-history-last", JSON.stringify(mapped));
            }
        } catch (err) {
            console.error("Fetch history error:", err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [lang]);

    useEffect(() => {
        fetchHistory();
        // Poll for status updates every 5 seconds
        const interval = setInterval(() => fetchHistory(false), 5000);
        return () => clearInterval(interval);
    }, [fetchHistory]);

    const total = history.length;
    const approved = history.filter(h => h.status === "approved").length;
    const pending = history.filter(h => h.status === "pending" || h.status === "submitted").length;
    const rejected = history.filter(h => h.status === "rejected").length;

    const handleAskDidi = (item: HistoryItem) => {
        // Navigate to voice assistant with context about this application
        setSchemeContext({
            id: item.id,
            name: item.title,
            nameHi: item.titleHi,
            benefit: `Check status of application ${item.applicationNo}`,
            benefitHi: `आवेदन ${item.applicationNo} की स्थिति जांचें`,
            desc: `Application for ${item.scheme}`,
            descHi: `${item.schemeHi} के लिए आवेदन`
        });
        navigateTo("voice");
    };

    const handleEdit = (item: HistoryItem) => {
        // Navigate to voice assistant with edit context
        setSchemeContext({
            id: item.id,
            name: item.title,
            nameHi: item.titleHi,
            benefit: `Edit application ${item.applicationNo}`,
            benefitHi: `आवेदन ${item.applicationNo} संपादित करें`,
            desc: `Edit your ${item.scheme} application`,
            descHi: `अपना ${item.schemeHi} आवेदन संपादित करें`
        });
        navigateTo("voice");
    };

    const handleCancel = (itemId: string) => {
        setShowCancelConfirm(itemId);
    };

    const confirmCancel = async (itemId: string) => {
        try {
            const deviceId = localStorage.getItem("jan-sahayak-device-id");
            const res = await fetch(`${API_BASE}/api/v1/user/applications/${itemId}/cancel?user_id=${deviceId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                fetchHistory(true);
                setShowCancelConfirm(null);
            } else {
                alert(lang === "hi" ? "रद्द करने में त्रुटि" : "Error cancelling application");
            }
        } catch (err) {
            console.error("Cancel error:", err);
            alert(lang === "hi" ? "रद्द करने में त्रुटि" : "Error cancelling application");
        }
        setShowCancelConfirm(null);
    };

    const handleApplyAgain = (item: HistoryItem) => {
        // Navigate to voice assistant with scheme context to apply again
        setSchemeContext({
            id: item.scheme.replace(/\s+/g, ''),
            name: item.title,
            nameHi: item.titleHi,
            benefit: `Apply again for ${item.scheme}`,
            benefitHi: `${item.schemeHi} के लिए फिर से आवेदन करें`,
            desc: item.scheme,
            descHi: item.schemeHi
        });
        navigateTo("voice");
    };

    return (
        <div className="pb-4">
            {/* Status Change Popup Notification */}
            <AnimatePresence>
                {showStatusAlert && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowStatusAlert(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl ${
                                showStatusAlert.type === 'approved' 
                                    ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-2 border-emerald-200' 
                                    : 'bg-gradient-to-br from-red-50 via-white to-rose-50 border-2 border-red-200'
                            }`}
                        >
                            {/* Header */}
                            <div className={`px-6 py-5 ${
                                showStatusAlert.type === 'approved'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                    : 'bg-gradient-to-r from-red-500 to-rose-500'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                        {showStatusAlert.type === 'approved' 
                                            ? <CheckCircle2 className="w-8 h-8 text-white" />
                                            : <XCircle className="w-8 h-8 text-white" />
                                        }
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white">{showStatusAlert.title}</h3>
                                        <p className="text-white/80 text-sm">{showStatusAlert.item?.applicationNo}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowStatusAlert(null)}
                                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className={`text-center mb-6 font-medium ${
                                    showStatusAlert.type === 'approved' ? 'text-slate-700' : 'text-slate-600'
                                }`}>
                                    {showStatusAlert.msg}
                                </p>

                                {/* Action Buttons */}
                                {showStatusAlert.type === 'approved' ? (
                                    <div className="flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                if (showStatusAlert.item) setSelectedItem(showStatusAlert.item);
                                                setShowStatusAlert(null);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-white border-2 border-emerald-200 text-emerald-700 font-bold text-sm shadow-sm hover:shadow-md transition-all"
                                        >
                                            <Eye size={18} />
                                            {lang === "hi" ? "देखें" : "View"}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                if (showStatusAlert.item) downloadCertificate(showStatusAlert.item, lang);
                                                setShowStatusAlert(null);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-200/50 hover:shadow-xl transition-all"
                                        >
                                            <FileDown size={18} />
                                            {lang === "hi" ? "डाउनलोड" : "Download"}
                                        </motion.button>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setShowStatusAlert(null)}
                                            className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all"
                                        >
                                            {lang === "hi" ? "समझ गया" : "Got it"}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                if (showStatusAlert.item) handleApplyAgain(showStatusAlert.item);
                                                setShowStatusAlert(null);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-200/50 hover:shadow-xl transition-all"
                                        >
                                            <RefreshCw size={18} />
                                            {lang === "hi" ? "फिर से आवेदन करें" : "Apply Again"}
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-4 pt-4 pb-3">
                {/* Header with refresh button */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800">
                        {lang === "hi" ? "आवेदन इतिहास" : "Application History"}
                    </h2>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fetchHistory(true)}
                        disabled={isRefreshing}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 font-semibold text-xs border border-emerald-200 ${isRefreshing ? 'opacity-60' : 'hover:bg-emerald-100'}`}
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                        {isRefreshing ? (lang === "hi" ? "लोड हो रहा..." : "Refreshing...") : (lang === "hi" ? "रिफ्रेश" : "Refresh")}
                    </motion.button>
                </div>
                
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                        { label: lang === "hi" ? "कुल" : "Total", value: total, color: "#2E7D32", bg: "#E8F5E9" },
                        { label: lang === "hi" ? "स्वीकृत" : "Approved", value: approved, color: "#1565C0", bg: "#E3F2FD" },
                        { label: lang === "hi" ? "लंबित" : "Pending", value: pending, color: "#E65100", bg: "#FFF3E0" },
                        { label: lang === "hi" ? "अस्वीकृत" : "Rejected", value: rejected, color: "#C62828", bg: "#FFEBEE" },
                    ].map(s => (
                        <div key={s.label} className="rounded-xl p-2.5 text-center"
                            style={{ background: s.bg }}>
                            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-[10px] font-semibold" style={{ color: s.color }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* History list */}
            <div className="px-4 flex flex-col gap-3 min-h-[300px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                        <p className="text-slate-400 font-medium">{lang === 'hi' ? 'लोड हो रहा है...' : 'Loading History...'}</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <ClipboardList className="text-slate-200" size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-400">{lang === 'hi' ? 'कोई आवेदन नहीं मिला' : 'No Applications Found'}</h3>
                        <p className="text-sm text-slate-300 mt-2">{lang === 'hi' ? 'जब आप किसी योजना के लिए आवेदन करेंगे, तो वह यहाँ दिखाई देगी।' : 'Your submitted applications will appear here once you apply for a scheme.'}</p>
                    </div>
                ) : (
                    history.map((item, i) => {
                        const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
                        const isApproved = item.status === "approved";
                        const isPending = item.status === "pending" || item.status === "submitted";
                        const isRejected = item.status === "rejected";

                        return (
                            <motion.div key={item.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className={`farm-card p-4 ${isRejected ? 'border-2 border-red-200' : ''}`}
                                style={isRejected ? { background: 'linear-gradient(to bottom, #FEF2F2, #FFFFFF)' } : {}}
                                id={`history-${item.id}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm" style={{ color: isRejected ? "#B91C1C" : "#1B5E20" }}>
                                            {lang === "hi" ? item.titleHi : item.title}
                                        </h3>
                                        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                                            {lang === "hi" ? item.schemeHi : item.scheme}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>📅 {item.date}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${sc.cls}`}>
                                            {sc.emoji} {lang === "hi" ? sc.labelHi : sc.label}
                                        </span>
                                        <span className="text-sm font-bold" style={{ color: isRejected ? "#B91C1C" : "#1B5E20" }}>
                                            {item.amount}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Rejection Reason */}
                                {isRejected && item.rejectionReason && (
                                    <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                                        <p className="text-xs font-semibold text-red-700 mb-1">
                                            {lang === "hi" ? "अस्वीकृति का कारण:" : "Rejection Reason:"}
                                        </p>
                                        <p className="text-xs text-red-600">{item.rejectionReason}</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {isApproved && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                                        <button
                                            onClick={() => setSelectedItem(item)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                            style={{
                                                background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
                                                color: "#1B5E20",
                                                border: "1px solid #A5D6A7"
                                            }}
                                        >
                                            <EyeIcon />
                                            {lang === "hi" ? "देखें" : "View"}
                                        </button>
                                        <button
                                            onClick={() => downloadCertificate(item, lang)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                            style={{
                                                background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
                                                color: "white"
                                            }}
                                        >
                                            <DownloadIcon />
                                            {lang === "hi" ? "डाउनलोड" : "Download"}
                                        </button>
                                    </div>
                                )}

                                {isPending && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        {showCancelConfirm === item.id ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-red-50 rounded-xl p-3 border border-red-200"
                                            >
                                                <p className="text-xs text-center mb-2" style={{ color: "#DC2626" }}>
                                                    {lang === "hi" ? "क्या आप वाकई रद्द करना चाहते हैं?" : "Are you sure you want to cancel?"}
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setShowCancelConfirm(null)}
                                                        className="flex-1 py-2 rounded-lg text-xs font-semibold bg-white border border-gray-300"
                                                        style={{ color: "#6B7280" }}
                                                    >
                                                        {lang === "hi" ? "नहीं" : "No"}
                                                    </button>
                                                    <button
                                                        onClick={() => confirmCancel(item.id)}
                                                        className="flex-1 py-2 rounded-lg text-xs font-semibold bg-red-500 text-white"
                                                    >
                                                        {lang === "hi" ? "हाँ, रद्द करें" : "Yes, Cancel"}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAskDidi(item)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                                    style={{
                                                        background: "linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)",
                                                        color: "#F57C00",
                                                        border: "1px solid #FFD54F"
                                                    }}
                                                >
                                                    <ChatIcon />
                                                    {lang === "hi" ? "दीदी से पूछें" : "Ask Didi"}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                                    style={{
                                                        background: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
                                                        color: "#1565C0",
                                                        border: "1px solid #90CAF9"
                                                    }}
                                                >
                                                    <EditIcon />
                                                    {lang === "hi" ? "संपादित" : "Edit"}
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(item.id)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                                    style={{
                                                        background: "linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)",
                                                        color: "#C62828",
                                                        border: "1px solid #EF9A9A"
                                                    }}
                                                >
                                                    <CancelIcon />
                                                    {lang === "hi" ? "रद्द करें" : "Cancel"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Rejected Action Buttons */}
                                {isRejected && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-red-100">
                                        <button
                                            onClick={() => setSelectedItem(item)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                            style={{
                                                background: "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)",
                                                color: "#991B1B",
                                                border: "1px solid #FCA5A5"
                                            }}
                                        >
                                            <EyeIcon />
                                            {lang === "hi" ? "विवरण देखें" : "View Details"}
                                        </button>
                                        <button
                                            onClick={() => handleApplyAgain(item)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                            style={{
                                                background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                                                color: "white"
                                            }}
                                        >
                                            <RefreshCw size={14} />
                                            {lang === "hi" ? "फिर से आवेदन करें" : "Apply Again"}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Application Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <ApplicationDetailModal
                        item={selectedItem}
                        lang={lang}
                        onClose={() => setSelectedItem(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
