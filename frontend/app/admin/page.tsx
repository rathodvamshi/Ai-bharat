"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  FileX,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  AlertCircle,
  RefreshCw,
  Home,
  Sparkles,
  Search,
  Filter,
  ChevronDown,
  Calendar,
  User,
  FileText,
} from "lucide-react";

type Application = {
  id: string;
  user_id: string;
  status: string;
  timestamp: number;
  form_data: Record<string, string | null>;
  rejection_reason?: string;
};

export default function AdminDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchApplications = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("http://localhost:8000/api/v1/dummy-gov/applications");
      const data = await response.json();
      setApplications(data.applications);
      setLoading(false);
      setIsRefreshing(false);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: string) => {
    await fetch(`http://localhost:8000/api/v1/dummy-gov/applications/${id}/approve`, {
      method: "PUT",
    });
    setSelectedApp(null);
    fetchApplications();
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return alert("Please provide a reason for rejection.");

    await fetch(`http://localhost:8000/api/v1/dummy-gov/applications/${id}/reject`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });

    setShowRejectInput(false);
    setRejectReason("");
    setSelectedApp(null);
    fetchApplications();
  };

  // Stats calculation
  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "Submitted" || a.status === "Pending").length,
    approved: applications.filter((a) => a.status === "Approved").length,
    rejected: applications.filter((a) => a.status === "Rejected").length,
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle2 className="w-4 h-4" />;
      case "Rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "Submitted":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Admin Portal</h1>
                  <p className="text-xs text-gray-500">जन-सहायक</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchApplications}
                className={`p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors ${isRefreshing ? "animate-spin" : ""}`}
              >
                <RefreshCw className="w-5 h-5 text-slate-600" />
              </motion.button>
              
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-green-200"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to App</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-green-600" />
            Government Admin Portal
          </h1>
          <p className="text-gray-500 mt-1">Review and manage citizen scheme applications</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Applications", value: stats.total, icon: FileText, color: "from-blue-500 to-indigo-600", bgColor: "bg-blue-50" },
            { label: "Pending Review", value: stats.pending, icon: Clock, color: "from-amber-500 to-orange-600", bgColor: "bg-amber-50" },
            { label: "Approved", value: stats.approved, icon: FileCheck, color: "from-green-500 to-emerald-600", bgColor: "bg-green-50" },
            { label: "Rejected", value: stats.rejected, icon: FileX, color: "from-red-500 to-rose-600", bgColor: "bg-red-50" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.bgColor} rounded-2xl p-5 border border-white shadow-lg hover:shadow-xl transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID or Citizen ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-medium"
              >
                <option value="all">All Status</option>
                <option value="submitted">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* Applications Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Loading applications...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No applications found</h3>
              <p className="text-slate-500">Try submitting one via voice on the main app!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-green-50 border-b border-slate-100">
                    <th className="text-left p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Application ID</th>
                    <th className="text-left p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Citizen</th>
                    <th className="text-left p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Date</th>
                    <th className="text-left p-4 font-semibold text-slate-600 text-sm uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.map((app, index) => (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-green-50/50 transition-colors group"
                    >
                      <td className="p-4">
                        <span className="font-mono font-semibold text-slate-800">{app.id}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-slate-600 font-medium">{app.user_id}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Calendar className="w-4 h-4" />
                          {new Date(app.timestamp * 1000).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedApp(app);
                            setShowRejectInput(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>

      {/* Application Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedApp(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Application Details</h2>
                  <p className="text-green-100 text-sm font-mono">{selectedApp.id}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-6">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(selectedApp.status)}`}>
                    {getStatusIcon(selectedApp.status)}
                    {selectedApp.status}
                  </span>
                  <span className="text-sm text-slate-500">
                    Citizen ID: <span className="font-semibold text-slate-700">{selectedApp.user_id}</span>
                  </span>
                </div>

                {/* Extracted Data */}
                <div className="bg-gradient-to-br from-slate-50 to-green-50 rounded-2xl p-5 border border-slate-100 mb-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Extracted Citizen Data
                  </h3>

                  {Object.keys(selectedApp.form_data).length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">No data extracted yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(selectedApp.form_data).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-3 rounded-xl border border-slate-100"
                        >
                          <span className="text-slate-500 text-sm font-medium capitalize">{key.replace(/_/g, " ")}</span>
                          <span className="text-slate-800 font-bold">{value || "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rejection Reason */}
                {selectedApp.status === "Rejected" && selectedApp.rejection_reason && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-red-700 mb-1">Rejection Reason</h4>
                        <p className="text-red-600 text-sm">{selectedApp.rejection_reason}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                {selectedApp.status !== "Approved" && selectedApp.status !== "Rejected" && (
                  <div className="space-y-4">
                    {!showRejectInput ? (
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleApprove(selectedApp.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 hover:shadow-xl transition-shadow"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Approve Application
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowRejectInput(true)}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 font-bold py-3 rounded-xl border border-red-200 hover:bg-red-200 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                          Reject
                        </motion.button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-red-50 p-5 rounded-2xl border border-red-200"
                      >
                        <label className="block text-red-800 font-bold mb-2">Reason for Rejection:</label>
                        <textarea
                          className="w-full p-3 rounded-xl border border-red-200 mb-4 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                          rows={3}
                          placeholder="e.g., Annual income exceeds scheme limits."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleReject(selectedApp.id)}
                            className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors"
                          >
                            Confirm Rejection
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowRejectInput(false)}
                            className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}