"use client";
import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/Navbar";
import Mech_Sidebar from "../../components/Mech_Sidebar";
import {
  Menu, Star, Search, RefreshCw, X,
  AlertCircle, CheckCircle, Clock, Loader2,
} from "lucide-react";

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
    {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    {message}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
  </div>
);

// rating 欄位是 1-5 整數
const StarDisplay = ({ score }) => {
  const num = Number(score) || 0;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={14}
          className={i <= num ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
      ))}
      <span className="ml-1.5 text-sm font-semibold text-gray-700">{num}.0</span>
    </div>
  );
};

// 分布長條
const RatingBar = ({ score, count, total }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-gray-500 w-3 text-right">{score}</span>
    <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-amber-400 rounded-full transition-all"
        style={{ width: total ? `${(count / total) * 100}%` : "0%" }} />
    </div>
    <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
  </div>
);

const SkeletonRow = () => (
  <div className="px-6 py-4 flex items-start gap-4">
    <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
      <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
    </div>
  </div>
);

async function apiFetch(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "請求失敗");
  return data;
}

export default function MechRatingPage() {
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [isDesktop, setIsDesktop]           = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(undefined);

  const [ratings, setRatings]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [toast, setToast]           = useState(null);

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
      } catch { setApprovalStatus("error"); }
    })();
  }, []);

  const fetchRatings = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search)      p.set("search", search);
      if (scoreFilter) p.set("rating", scoreFilter);
      const data = await apiFetch(`/api/mechanism/ratings?${p}`);
      setRatings(Array.isArray(data) ? data : (data.ratings ?? []));
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, scoreFilter]);

  useEffect(() => {
    const t = setTimeout(fetchRatings, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchRatings]);

  // 統計
  const total   = ratings.length;
  const avg     = total ? (ratings.reduce((s, r) => s + Number(r.rating), 0) / total).toFixed(1) : null;
  const dist    = [5, 4, 3, 2, 1].map(n => ({
    score: n,
    count: ratings.filter(r => Number(r.rating) === n).length,
  }));

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
              <Star size={24} className="text-amber-400 fill-amber-400" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">評分紀錄</h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-0.5">查看患者對醫師的評分與留言</p>
              </div>
            </div>
            <button onClick={fetchRatings}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg border border-gray-200 transition shrink-0">
              <RefreshCw size={14} /> 重新整理
            </button>
          </div>

          {/* 統計卡片（只在有資料時顯示） */}
          {avg && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 flex items-start gap-6 flex-wrap">
              {/* 平均分 */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0">
                  <Star size={24} className="text-white fill-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">整體平均評分</p>
                  <p className="text-3xl font-bold text-gray-800 leading-tight">{avg}</p>
                  <StarDisplay score={Math.round(Number(avg))} />
                  <p className="text-xs text-gray-400 mt-0.5">共 {total} 筆評分</p>
                </div>
              </div>
              {/* 分布長條 */}
              <div className="flex-1 min-w-[180px] space-y-1.5 self-center">
                {dist.map(({ score, count }) => (
                  <RatingBar key={score} score={score} count={count} total={total} />
                ))}
              </div>
            </div>
          )}

          {/* 搜尋 + 篩選 */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="搜尋醫師姓名或留言..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition" />
            </div>
            <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none text-gray-600">
              <option value="">全部評分</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 星</option>
              <option value="4">⭐⭐⭐⭐  4 星</option>
              <option value="3">⭐⭐⭐   3 星</option>
              <option value="2">⭐⭐    2 星</option>
              <option value="1">⭐     1 星</option>
            </select>
          </div>

          {/* 列表 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Star size={16} className="text-amber-400 fill-amber-400" />
              <h2 className="font-semibold text-gray-800">評分列表</h2>
              <span className="bg-amber-50 text-amber-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {ratings.length} 筆
              </span>
            </div>

            <div className="divide-y divide-gray-50">
              {loading
                ? [0, 1, 2, 3].map(i => <SkeletonRow key={i} />)
                : ratings.length === 0
                  ? (
                    <div className="py-16 text-center text-gray-400 text-sm">
                      <Star size={32} className="mx-auto mb-3 opacity-20" />
                      目前沒有評分紀錄
                    </div>
                  )
                  : ratings.map((r) => (
                    <div key={r.rating_id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* 醫師 Avatar */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {/* doctor_name 由 API JOIN 提供，若沒有就顯示 ? */}
                          {r.doctor_name?.charAt(0) ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-medium text-gray-800 text-sm">
                              {r.doctor_name ?? `醫師 #${r.doctor_id}`}
                            </p>
                            {r.specialty && (
                              <span className="text-xs text-gray-400">{r.specialty}</span>
                            )}
                          </div>

                          {/* 星星 — 對應資料庫欄位 `rating` */}
                          <StarDisplay score={r.rating} />

                          {/* 留言 — 對應資料庫欄位 `comment` */}
                          {r.comment && (
                            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{r.comment}</p>
                          )}

                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {r.patient_name && (
                              <span className="text-xs text-gray-400">患者：{r.patient_name}</span>
                            )}
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={11} />
                              {r.created_at ? new Date(r.created_at).toLocaleString("zh-TW") : "—"}
                            </span>
                          </div>
                        </div>

                        {/* 右側大星星數字 */}
                        <div className="flex-shrink-0 flex flex-col items-center">
                          <span className="text-2xl font-bold text-amber-400">{r.rating}</span>
                          <span className="text-xs text-gray-400">/ 5</span>
                        </div>
                      </div>
                    </div>
                  ))
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