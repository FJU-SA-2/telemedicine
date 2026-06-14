"use client";
import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Mech_Sidebar from "../components/Mech_Sidebar";
import {
  Menu, MessageCircleMore, Search, RefreshCw, X,
  AlertCircle, CheckCircle, Clock, Loader2, Tag,
} from "lucide-react";

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
    {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    {message}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
  </div>
);

// status: unread / read / resolved
const StatusBadge = ({ status }) => {
  const map = {
    unread:   { cls: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",         label: "未讀" },
    read:     { cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       label: "已讀" },
    resolved: { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", label: "已解決" },
  };
  const s = map[status] || { cls: "bg-gray-100 text-gray-500", label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
};

// user_role badge
const RoleBadge = ({ role }) => {
  const map = {
    patient: { cls: "bg-teal-50 text-teal-600",   label: "患者" },
    doctor:  { cls: "bg-blue-50 text-blue-600",   label: "醫師" },
    mech:    { cls: "bg-violet-50 text-violet-600", label: "機構" },
  };
  const s = map[role] || { cls: "bg-gray-100 text-gray-500", label: role };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
};

const SkeletonRow = () => (
  <div className="px-6 py-4 space-y-2">
    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
    <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
  </div>
);

async function apiFetch(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "請求失敗");
  return data;
}

export default function MechFeedbackPage() {
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [isDesktop, setIsDesktop]         = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(undefined);

  const [feedbacks, setFeedbacks]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [roleFilter, setRoleFilter]       = useState("");
  const [toast, setToast]                 = useState(null);
  const [updatingId, setUpdatingId]       = useState(null);
  const [expandedId, setExpandedId]       = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (sidebarOpen && !isDesktop) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen, isDesktop]);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();
        setApprovalStatus(
          data.authenticated && data.user?.role === "mech" ? "approved" : "unauthorized"
        );
      } catch {
        setApprovalStatus("error");
      }
    })();
  }, []);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search)       p.set("search", search);
      if (statusFilter) p.set("status", statusFilter);
      if (roleFilter)   p.set("user_role", roleFilter);
      const data = await apiFetch(`/api/mechanism/feedbacks?${p}`);
      setFeedbacks(Array.isArray(data) ? data : (data.feedbacks ?? []));
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, roleFilter]);

  useEffect(() => {
    const t = setTimeout(fetchFeedbacks, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchFeedbacks]);

  const handleStatusChange = async (feedbackId, newStatus) => {
    setUpdatingId(feedbackId);
    try {
      await apiFetch(`/api/mechanism/feedbacks/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      showToast("狀態已更新");
      // 樂觀更新，不重新 fetch
      setFeedbacks(prev =>
        prev.map(fb => fb.feedback_id === feedbackId ? { ...fb, status: newStatus } : fb)
      );
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // 嘗試解析 categories JSON
  const parseCategories = (raw) => {
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 font-sans flex flex-col">
      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)}
          className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition"
          aria-label="開啟選單">
          <Menu size={24} />
        </button>
      )}
      {sidebarOpen && !isDesktop && (
        <div className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)} />
      )}

      <Mech_Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} approvalStatus={approvalStatus} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen && isDesktop ? "lg:ml-64" : "ml-0"}`}>
        <Navbar />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full">

          {/* 標題 */}
          <div className="mb-6 sm:mb-8 flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3">
              <MessageCircleMore size={24} className="text-violet-500" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">問題回報</h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-0.5">查看與處理使用者回報的問題</p>
              </div>
            </div>
            <button onClick={fetchFeedbacks}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg border border-gray-200 transition shrink-0">
              <RefreshCw size={14} /> 重新整理
            </button>
          </div>

          {/* 統計小卡 */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "未讀", status: "unread",   color: "text-rose-600 bg-rose-50" },
              { label: "已讀", status: "read",     color: "text-amber-600 bg-amber-50" },
              { label: "已解決", status: "resolved", color: "text-emerald-600 bg-emerald-50" },
            ].map(({ label, status, color }) => (
              <button key={status}
                onClick={() => setStatusFilter(prev => prev === status ? "" : status)}
                className={`rounded-xl p-3 text-center transition border-2
                  ${statusFilter === status ? "border-current " + color : "bg-white border-transparent hover:border-gray-200"}`}>
                <p className={`text-xl font-bold ${statusFilter === status ? "" : "text-gray-800"}`}>
                  {feedbacks.filter(f => f.status === status).length}
                </p>
                <p className={`text-xs mt-0.5 ${statusFilter === status ? "" : "text-gray-400"}`}>{label}</p>
              </button>
            ))}
          </div>

          {/* 搜尋 + 篩選 */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="搜尋回報內容..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none text-gray-600">
              <option value="">全部狀態</option>
              <option value="unread">未讀</option>
              <option value="read">已讀</option>
              <option value="resolved">已解決</option>
            </select>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none text-gray-600">
              <option value="">全部角色</option>
              <option value="patient">患者</option>
              <option value="doctor">醫師</option>
            </select>
          </div>

          {/* 列表 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <MessageCircleMore size={16} className="text-violet-500" />
              <h2 className="font-semibold text-gray-800">回報列表</h2>
              <span className="bg-violet-50 text-violet-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {feedbacks.length} 筆
              </span>
            </div>

            <div className="divide-y divide-gray-50">
              {loading
                ? [0, 1, 2, 3].map(i => <SkeletonRow key={i} />)
                : feedbacks.length === 0
                  ? (
                    <div className="py-16 text-center text-gray-400 text-sm">
                      <MessageCircleMore size={32} className="mx-auto mb-3 opacity-30" />
                      目前沒有問題回報
                    </div>
                  )
                  : feedbacks.map(fb => {
                    const id   = fb.feedback_id;
                    const cats = parseCategories(fb.categories);
                    const isExpanded = expandedId === id;

                    return (
                      <div key={id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : id)}>
                            {/* 狀態列 */}
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <StatusBadge status={fb.status} />
                              <RoleBadge role={fb.user_role} />
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={11} />
                                {fb.created_at ? new Date(fb.created_at).toLocaleString("zh-TW") : "—"}
                              </span>
                            </div>

                            {/* 問題類別 tags */}
                            {cats.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {cats.map((c, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">
                                    <Tag size={10} />{c}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* 內文 */}
                            <p className={`text-sm text-gray-700 ${isExpanded ? "" : "line-clamp-2"}`}>
                              {fb.feedback_text}
                            </p>
                            {!isExpanded && fb.feedback_text?.length > 100 && (
                              <span className="text-xs text-violet-500 mt-0.5 inline-block">展開全文</span>
                            )}
                          </div>

                          {/* 操作按鈕 */}
                          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                            {updatingId === id
                              ? <Loader2 size={16} className="animate-spin text-gray-400" />
                              : (
                                <>
                                  {fb.status === "unread" && (
                                    <>
                                      <button onClick={() => handleStatusChange(id, "read")}
                                        className="px-3 py-1.5 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition whitespace-nowrap">
                                        標記已讀
                                      </button>
                                      <button onClick={() => handleStatusChange(id, "resolved")}
                                        className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition whitespace-nowrap">
                                        標記已解決
                                      </button>
                                    </>
                                  )}
                                  {fb.status === "read" && (
                                    <button onClick={() => handleStatusChange(id, "resolved")}
                                      className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition whitespace-nowrap">
                                      標記已解決
                                    </button>
                                  )}
                                  {fb.status === "resolved" && (
                                    <button onClick={() => handleStatusChange(id, "unread")}
                                      className="px-3 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition whitespace-nowrap">
                                      重新開啟
                                    </button>
                                  )}
                                </>
                              )
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        </main>

        <div className="bg-gray-800 text-white py-8 mt-8 flex-shrink-0">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm">© 2025 MedOnGo 機構平台. 讓醫療服務更便捷、更專業。</p>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}