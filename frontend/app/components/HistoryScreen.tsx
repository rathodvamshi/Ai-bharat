"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Language } from "../lib/translations";

interface HistoryItem {
    id: number;
    title: string;
    titleHi: string;
    scheme: string;
    schemeHi: string;
    status: string;
    date: string;
    amount: string;
    applicationNo: string;
    applicantName: string;
    applicantNameHi: string;
    fatherName: string;
    fatherNameHi: string;
    aadhar: string;
    mobile: string;
    village: string;
    villageHi: string;
    district: string;
    districtHi: string;
    state: string;
    stateHi: string;
    landArea?: string;
    cropType?: string;
    cropTypeHi?: string;
    bankName?: string;
    accountNo?: string;
    ifsc?: string;
}

const HISTORY: HistoryItem[] = [
    {
        id: 1, title: "Crop Insurance", titleHi: "फसल बीमा", scheme: "PM Fasal Bima",
        schemeHi: "पीएम फसल बीमा", status: "pending", date: "05 Mar 2026", amount: "₹12,000",
        applicationNo: "PMFBY2026030512345", applicantName: "Ramesh Kumar", applicantNameHi: "रमेश कुमार",
        fatherName: "Shyam Lal", fatherNameHi: "श्याम लाल", aadhar: "XXXX-XXXX-1234",
        mobile: "98765XXXXX", village: "Chandpur", villageHi: "चांदपुर",
        district: "Varanasi", districtHi: "वाराणसी", state: "Uttar Pradesh", stateHi: "उत्तर प्रदेश",
        landArea: "2.5 Hectare", cropType: "Wheat", cropTypeHi: "गेहूं"
    },
    {
        id: 2, title: "Loan Request", titleHi: "लोन आवेदन", scheme: "Kisan Credit Card",
        schemeHi: "किसान क्रेडिट कार्ड", status: "approved", date: "01 Mar 2026", amount: "₹50,000",
        applicationNo: "KCC2026030154321", applicantName: "Ramesh Kumar", applicantNameHi: "रमेश कुमार",
        fatherName: "Shyam Lal", fatherNameHi: "श्याम लाल", aadhar: "XXXX-XXXX-1234",
        mobile: "98765XXXXX", village: "Chandpur", villageHi: "चांदपुर",
        district: "Varanasi", districtHi: "वाराणसी", state: "Uttar Pradesh", stateHi: "उत्तर प्रदेश",
        bankName: "State Bank of India", accountNo: "XXXXXXXX4567", ifsc: "SBIN0001234"
    },
    {
        id: 3, title: "Income Support", titleHi: "आय सहायता", scheme: "PM-KISAN",
        schemeHi: "पीएम-किसान", status: "approved", date: "20 Feb 2026", amount: "₹2,000",
        applicationNo: "PMKISAN2026022098765", applicantName: "Ramesh Kumar", applicantNameHi: "रमेश कुमार",
        fatherName: "Shyam Lal", fatherNameHi: "श्याम लाल", aadhar: "XXXX-XXXX-1234",
        mobile: "98765XXXXX", village: "Chandpur", villageHi: "चांदपुर",
        district: "Varanasi", districtHi: "वाराणसी", state: "Uttar Pradesh", stateHi: "उत्तर प्रदेश",
        landArea: "2.5 Hectare", bankName: "State Bank of India", accountNo: "XXXXXXXX4567", ifsc: "SBIN0001234"
    },
    {
        id: 4, title: "Subsidy Claim", titleHi: "सब्सिडी दावा", scheme: "Fertilizer Subsidy",
        schemeHi: "उर्वरक सब्सिडी", status: "processing", date: "15 Feb 2026", amount: "₹3,500",
        applicationNo: "FERT2026021567890", applicantName: "Ramesh Kumar", applicantNameHi: "रमेश कुमार",
        fatherName: "Shyam Lal", fatherNameHi: "श्याम लाल", aadhar: "XXXX-XXXX-1234",
        mobile: "98765XXXXX", village: "Chandpur", villageHi: "चांदपुर",
        district: "Varanasi", districtHi: "वाराणसी", state: "Uttar Pradesh", stateHi: "उत्तर प्रदेश"
    },
    {
        id: 5, title: "Housing Grant", titleHi: "आवास अनुदान", scheme: "PM Awas Yojana",
        schemeHi: "पीएम आवास योजना", status: "rejected", date: "10 Feb 2026", amount: "₹80,000",
        applicationNo: "PMAY2026021011111", applicantName: "Ramesh Kumar", applicantNameHi: "रमेश कुमार",
        fatherName: "Shyam Lal", fatherNameHi: "श्याम लाल", aadhar: "XXXX-XXXX-1234",
        mobile: "98765XXXXX", village: "Chandpur", villageHi: "चांदपुर",
        district: "Varanasi", districtHi: "वाराणसी", state: "Uttar Pradesh", stateHi: "उत्तर प्रदेश"
    },
    {
        id: 6, title: "Health Insurance", titleHi: "स्वास्थ्य बीमा", scheme: "Ayushman Bharat",
        schemeHi: "आयुष्मान भारत", status: "approved", date: "05 Feb 2026", amount: "₹5 Lakh",
        applicationNo: "PMJAY2026020522222", applicantName: "Ramesh Kumar", applicantNameHi: "रमेश कुमार",
        fatherName: "Shyam Lal", fatherNameHi: "श्याम लाल", aadhar: "XXXX-XXXX-1234",
        mobile: "98765XXXXX", village: "Chandpur", villageHi: "चांदपुर",
        district: "Varanasi", districtHi: "वाराणसी", state: "Uttar Pradesh", stateHi: "उत्तर प्रदेश"
    },
];

const STATUS_CONFIG: Record<string, { label: string; labelHi: string; emoji: string; cls: string }> = {
    approved: { label: "Approved", labelHi: "स्वीकृत", emoji: "✅", cls: "badge-approved" },
    pending: { label: "Pending", labelHi: "लंबित", emoji: "⏳", cls: "badge-pending" },
    rejected: { label: "Rejected", labelHi: "अस्वीकृत", emoji: "❌", cls: "badge-rejected" },
    processing: { label: "Processing", labelHi: "प्रक्रिया में", emoji: "🔄", cls: "badge-processing" },
};

// Icons as SVG components
const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
);

const ChatIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
);

const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const CancelIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
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
                    {/* Status Badge */}
                    <div className="flex justify-center mb-4">
                        <span className={`text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-2 ${sc.cls}`}>
                            {sc.emoji} {lang === "hi" ? sc.labelHi : sc.label}
                        </span>
                    </div>

                    {/* Scheme Info */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mb-4">
                        <h3 className="font-bold text-base" style={{ color: "#1B5E20" }}>
                            {lang === "hi" ? item.titleHi : item.title}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: "#4B5563" }}>
                            {lang === "hi" ? item.schemeHi : item.scheme}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-200">
                            <span className="text-xs" style={{ color: "#6B7280" }}>
                                📅 {item.date}
                            </span>
                            <span className="text-lg font-bold" style={{ color: "#1B5E20" }}>
                                {item.amount}
                            </span>
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="mb-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#9CA3AF" }}>
                            {lang === "hi" ? "व्यक्तिगत विवरण" : "Personal Details"}
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                            <DetailRow 
                                label={lang === "hi" ? "आवेदक का नाम" : "Applicant Name"} 
                                value={lang === "hi" ? item.applicantNameHi : item.applicantName} 
                            />
                            <DetailRow 
                                label={lang === "hi" ? "पिता का नाम" : "Father's Name"} 
                                value={lang === "hi" ? item.fatherNameHi : item.fatherName} 
                            />
                            <DetailRow 
                                label={lang === "hi" ? "आधार नंबर" : "Aadhar No."} 
                                value={item.aadhar} 
                            />
                            <DetailRow 
                                label={lang === "hi" ? "मोबाइल" : "Mobile"} 
                                value={item.mobile} 
                            />
                        </div>
                    </div>

                    {/* Address Details */}
                    <div className="mb-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#9CA3AF" }}>
                            {lang === "hi" ? "पता विवरण" : "Address Details"}
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                            <DetailRow 
                                label={lang === "hi" ? "गाँव" : "Village"} 
                                value={lang === "hi" ? item.villageHi : item.village} 
                            />
                            <DetailRow 
                                label={lang === "hi" ? "जिला" : "District"} 
                                value={lang === "hi" ? item.districtHi : item.district} 
                            />
                            <DetailRow 
                                label={lang === "hi" ? "राज्य" : "State"} 
                                value={lang === "hi" ? item.stateHi : item.state} 
                            />
                        </div>
                    </div>

                    {/* Additional Details */}
                    {(item.landArea || item.cropType || item.bankName) && (
                        <div className="mb-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#9CA3AF" }}>
                                {lang === "hi" ? "अतिरिक्त विवरण" : "Additional Details"}
                            </h4>
                            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                                {item.landArea && (
                                    <DetailRow 
                                        label={lang === "hi" ? "भूमि क्षेत्र" : "Land Area"} 
                                        value={item.landArea} 
                                    />
                                )}
                                {item.cropType && (
                                    <DetailRow 
                                        label={lang === "hi" ? "फसल प्रकार" : "Crop Type"} 
                                        value={(lang === "hi" ? item.cropTypeHi : item.cropType) || ""} 
                                    />
                                )}
                                {item.bankName && (
                                    <>
                                        <DetailRow 
                                            label={lang === "hi" ? "बैंक" : "Bank"} 
                                            value={item.bankName} 
                                        />
                                        <DetailRow 
                                            label={lang === "hi" ? "खाता संख्या" : "Account No."} 
                                            value={item.accountNo || ""} 
                                        />
                                        <DetailRow 
                                            label="IFSC" 
                                            value={item.ifsc || ""} 
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    )}
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
                        <span class="value">${lang === "hi" ? item.applicantNameHi : item.applicantName}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "पिता का नाम" : "Father's Name"}</span>
                        <span class="value">${lang === "hi" ? item.fatherNameHi : item.fatherName}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "आधार नंबर" : "Aadhar Number"}</span>
                        <span class="value">${item.aadhar}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "मोबाइल नंबर" : "Mobile Number"}</span>
                        <span class="value">${item.mobile}</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-header">${lang === "hi" ? "पता" : "Address"}</div>
                <div class="section-content">
                    <div class="row">
                        <span class="label">${lang === "hi" ? "गाँव" : "Village"}</span>
                        <span class="value">${lang === "hi" ? item.villageHi : item.village}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "जिला" : "District"}</span>
                        <span class="value">${lang === "hi" ? item.districtHi : item.district}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "राज्य" : "State"}</span>
                        <span class="value">${lang === "hi" ? item.stateHi : item.state}</span>
                    </div>
                </div>
            </div>
            
            ${item.bankName ? `
            <div class="section">
                <div class="section-header">${lang === "hi" ? "बैंक विवरण" : "Bank Details"}</div>
                <div class="section-content">
                    <div class="row">
                        <span class="label">${lang === "hi" ? "बैंक का नाम" : "Bank Name"}</span>
                        <span class="value">${item.bankName}</span>
                    </div>
                    <div class="row">
                        <span class="label">${lang === "hi" ? "खाता संख्या" : "Account Number"}</span>
                        <span class="value">${item.accountNo}</span>
                    </div>
                    <div class="row">
                        <span class="label">IFSC Code</span>
                        <span class="value">${item.ifsc}</span>
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default function HistoryScreen({ lang }: { lang: Language }) {
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState<number | null>(null);

    const total = HISTORY.length;
    const approved = HISTORY.filter(h => h.status === "approved").length;
    const pending = HISTORY.filter(h => h.status === "pending").length;

    const handleAskDidi = (item: HistoryItem) => {
        // This would navigate to voice assistant with context
        alert(lang === "hi" 
            ? `"दीदी से पूछें" - ${item.titleHi} के बारे में` 
            : `"Ask Didi" - About ${item.title}`);
    };

    const handleEdit = (item: HistoryItem) => {
        alert(lang === "hi" 
            ? `आवेदन संपादित करें: ${item.applicationNo}` 
            : `Edit application: ${item.applicationNo}`);
    };

    const handleCancel = (itemId: number) => {
        setShowCancelConfirm(itemId);
    };

    const confirmCancel = (itemId: number) => {
        alert(lang === "hi" 
            ? `आवेदन रद्द किया गया: #${itemId}` 
            : `Application cancelled: #${itemId}`);
        setShowCancelConfirm(null);
    };

    return (
        <div className="pb-4">
            <div className="px-4 pt-4 pb-3">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                        { label: lang === "hi" ? "कुल" : "Total", value: total, color: "#2E7D32", bg: "#E8F5E9" },
                        { label: lang === "hi" ? "स्वीकृत" : "Approved", value: approved, color: "#1565C0", bg: "#E3F2FD" },
                        { label: lang === "hi" ? "लंबित" : "Pending", value: pending, color: "#E65100", bg: "#FFF3E0" },
                    ].map(s => (
                        <div key={s.label} className="rounded-2xl p-3 text-center"
                            style={{ background: s.bg }}>
                            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-xs" style={{ color: s.color }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* History list */}
            <div className="px-4 flex flex-col gap-3">
                {HISTORY.map((item, i) => {
                    const sc = STATUS_CONFIG[item.status];
                    const isApproved = item.status === "approved";
                    const isPending = item.status === "pending";
                    
                    return (
                        <motion.div key={item.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="farm-card p-4"
                            id={`history-${item.id}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm" style={{ color: "#1B5E20" }}>
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
                                    <span className="text-sm font-bold" style={{ color: "#1B5E20" }}>
                                        {item.amount}
                                    </span>
                                </div>
                            </div>

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
                        </motion.div>
                    );
                })}
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
