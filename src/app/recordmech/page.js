"use client";
import { useState, useEffect } from 'react';
import { Calendar, Clock, User, RefreshCw, Menu, LayoutGrid, List, Stethoscope, CalendarCheck, X, Check, ChevronDown } from 'lucide-react';
import Mech_Sidebar from "../components/Mech_Sidebar";
import Navbar from "../components/Navbar";

export default function MechAppointmentRecords() {
  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState("home");
  const [viewMode, setViewMode] = useState("card");

  // ── 回診審核 ────────────────────────────────────────────────────
  const [pageTab, setPageTab] = useState("appointments"); // "appointments" | "followup"
  const [followUpRequests, setFollowUpRequests] = useState([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpFilter, setFollowUpFilter] = useState("pending_review");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (pageTab === "followup") fetchFollowUpRequests();
  }, [pageTab, followUpFilter]);

  // ── 預約紀錄 ─────────────────────────────────────────────────────
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recordmech", { credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `API 取得資料失敗 (狀態碼: ${res.status})`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) { setAppointments([]); return; }
      setAppointments(data.map((item) => ({
        appointment_id: item.appointment_id,
        appointment_date: item.appointment_date,
        appointment_time: item.appointment_time,
        status: item.status,
        cancellation_reason: item.cancellation_reason || null,
        prescription_image: item.prescription_image || null,
        doctor_advice: item.doctor_advice || "",
        patient: { first_name: item.patient_first_name, last_name: item.patient_last_name },
        doctor: { first_name: item.doctor_first_name, last_name: item.doctor_last_name, specialty: item.specialty || "未填寫" },
      })));
    } catch (error) {
      console.error("取得預約記錄失敗:", error);
      alert(`取得預約記錄失敗: ${error.message}`);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // ── 回診審核清單 ──────────────────────────────────────────────────
  const fetchFollowUpRequests = async () => {
    setFollowUpLoading(true);
    try {
      const res = await fetch(
        `/api/mechanism/followup-requests?status=${followUpFilter}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) setFollowUpRequests(data.requests);
    } catch (e) {
      console.error("取得回診審核清單失敗:", e);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!confirm("確定要核准這筆回診預約嗎？")) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/mechanism/followup-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ request_id: requestId, action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ 已核准，預約已建立並通知患者");
        fetchFollowUpRequests();
      } else {
        alert(data.message || "操作失敗");
      }
    } catch (e) {
      alert("操作失敗，請稍後再試");
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (req) => {
    setRejectTarget(req);
    setRejectNote("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/mechanism/followup-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          request_id: rejectTarget.request_id,
          action: "reject",
          reject_note: rejectNote.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("已拒絕並通知患者");
        setShowRejectModal(false);
        fetchFollowUpRequests();
      } else {
        alert(data.message || "操作失敗");
      }
    } catch (e) {
      alert("操作失敗，請稍後再試");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── 工具函式 ─────────────────────────────────────────────────────
  const uploadPrescription = async (appointmentId, file) => {
    try {
      const formData = new FormData();
      formData.append("prescription", file);
      const res = await fetch(`/api/upload-prescription/${appointmentId}`, {
        method: "POST", body: formData, credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        alert("處方箋上傳成功");
        setAppointments((prev) =>
          prev.map((a) => a.appointment_id === appointmentId ? { ...a, prescription_image: data.image_url } : a)
        );
      } else { alert(data.message); }
    } catch (err) { alert("上傳失敗"); }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '已確認': return 'bg-blue-100 text-blue-800 border-blue-300';
      case '已完成': return 'bg-green-100 text-green-800 border-green-300';
      case '已取消': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getFollowUpStatusBadge = (status) => {
    const map = {
      pending:              { label: "等待患者回覆", cls: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      preference_received:  { label: "已收到偏好", cls: "bg-blue-100 text-blue-800 border-blue-300" },
      slots_sent:           { label: "已推播時段", cls: "bg-purple-100 text-purple-800 border-purple-300" },
      no_slots_available:   { label: "無可用時段", cls: "bg-red-100 text-red-800 border-red-300" },
      pending_review:       { label: "待機構審核", cls: "bg-orange-100 text-orange-800 border-orange-300" },
      scheduled:            { label: "已安排預約", cls: "bg-green-100 text-green-800 border-green-300" },
    };
    return map[status] || { label: status, cls: "bg-gray-100 text-gray-800 border-gray-300" };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  };

  const formatTime = (timeString) => timeString?.slice(0, 5) || "-";

  const filteredAppointments = appointments.filter(apt => filter === 'all' || apt.status === filter);

  const FOLLOWUP_FILTER_OPTIONS = [
    { value: "pending_review", label: "待審核" },
    { value: "all",            label: "全部" },
    { value: "pending",        label: "等待患者" },
    { value: "slots_sent",     label: "已推播時段" },
    { value: "no_slots_available", label: "無可用時段" },
    { value: "scheduled",      label: "已完成" },
  ];

  if (loading && pageTab === "appointments") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">載入預約紀錄中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-50">
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition">
          <Menu size={24} />
        </button>
      )}

      <Mech_Sidebar isOpen={isOpen} setIsOpen={setIsOpen} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />

        <div className="flex-1 p-6">

          {/* ── Page Tab 切換 ── */}
          <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-6 w-fit">
            <button
              onClick={() => setPageTab("appointments")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pageTab === "appointments" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Calendar size={16} />
              預約紀錄
            </button>
            <button
              onClick={() => setPageTab("followup")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pageTab === "followup" ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <CalendarCheck size={16} />
              回診審核
              {/* 紅點提示 */}
              {followUpRequests.filter(r => r.status === "pending_review").length > 0 && pageTab !== "followup" && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {followUpRequests.filter(r => r.status === "pending_review").length}
                </span>
              )}
            </button>
          </div>

          {/* ════════════════════════════════════════════════
              TAB 1：預約紀錄（原有內容）
          ════════════════════════════════════════════════ */}
          {pageTab === "appointments" && (
            <>
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {['all', '已確認', '已完成', '已取消'].map((status) => (
                      <button key={status} onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-full font-medium transition-all ${
                          filter === status ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}>
                        {status === 'all' ? '全部' : status}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setViewMode("card")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${viewMode === "card" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}>
                      <LayoutGrid size={18} /><span className="hidden sm:inline">卡片式</span>
                    </button>
                    <button onClick={() => setViewMode("table")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}>
                      <List size={18} /><span className="hidden sm:inline">橫列式</span>
                    </button>
                  </div>
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">目前沒有符合條件的預約紀錄</p>
                </div>
              ) : viewMode === "card" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                  {filteredAppointments.map((appointment) => (
                    <div key={appointment.appointment_id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                        <div className="flex items-center mb-3">
                          <div className="bg-blue-100 rounded-full p-3 mr-4"><User className="w-6 h-6 text-blue-600" /></div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">患者</p>
                            <h3 className="text-lg font-bold text-gray-800">{appointment.patient.first_name}{appointment.patient.last_name}</h3>
                          </div>
                        </div>
                        <div className="flex items-center mb-4">
                          <div className="bg-green-100 rounded-full p-3 mr-4"><Stethoscope className="w-6 h-6 text-green-600" /></div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">醫生</p>
                            <h3 className="text-lg font-bold text-gray-800">{appointment.doctor.first_name}{appointment.doctor.last_name} 醫師</h3>
                            <p className="text-sm text-green-700 font-medium">{appointment.doctor.specialty}</p>
                          </div>
                        </div>
                        <div className="space-y-2 bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center text-gray-700">
                            <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                            <span className="font-medium">{formatDate(appointment.appointment_date)}</span>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <Clock className="w-5 h-5 mr-3 text-blue-600" />
                            <span className="font-medium">{formatTime(appointment.appointment_time)}</span>
                          </div>
                          <div className="mt-4 border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">上傳處方箋</label>
                            <input type="file" accept="image/*"
                              onChange={(e) => { if (e.target.files[0]) uploadPrescription(appointment.appointment_id, e.target.files[0]); }}
                              className="block w-full text-sm text-gray-600" />
                            {appointment.prescription_image && (
                              <img src={`http://127.0.0.1:5000/uploads/prescriptions/${appointment.prescription_image}`}
                                alt="處方箋" className="mt-3 rounded-lg border max-h-72 object-contain" />
                            )}
                          </div>
                        </div>
                        {appointment.status === '已取消' && appointment.cancellation_reason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800"><span className="font-semibold">取消原因：</span><span className="text-red-700 ml-1">{appointment.cancellation_reason}</span></p>
                          </div>
                        )}
                        {appointment.status === '已完成' && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-gray-800 mb-2">醫生建議與處方：</h4>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <p className="text-gray-700 whitespace-pre-line text-base">{appointment.doctor_advice || '尚未填寫'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">狀態</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">患者姓名</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">醫生姓名</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">看診科別</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">日期</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">時間</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                            <span className="text-blue-600">醫生建議</span><span className="text-gray-400 mx-1">/</span><span className="text-red-600">取消原因</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredAppointments.map((appointment) => (
                          <tr key={appointment.appointment_id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(appointment.status)}`}>{appointment.status}</span>
                            </td>
                            <td className="px-6 py-4"><div className="font-medium text-gray-800">{appointment.patient.first_name}{appointment.patient.last_name}</div></td>
                            <td className="px-6 py-4"><div className="font-medium text-gray-800">{appointment.doctor.first_name}{appointment.doctor.last_name} 醫師</div></td>
                            <td className="px-6 py-4"><span className="text-green-700 font-medium text-sm">{appointment.doctor.specialty}</span></td>
                            <td className="px-6 py-4 text-gray-700 text-sm">{formatDate(appointment.appointment_date)}</td>
                            <td className="px-6 py-4 text-gray-700 text-sm font-medium">{formatTime(appointment.appointment_time)}</td>
                            <td className="px-6 py-4 text-sm max-w-xs">
                              {appointment.status === '已取消' && appointment.cancellation_reason && <span className="text-red-600">{appointment.cancellation_reason}</span>}
                              {appointment.status === '已完成' && <span className="text-blue-600">{appointment.doctor_advice || '尚未填寫'}</span>}
                              {appointment.status === '已確認' && <span className="text-gray-400">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════
              TAB 2：回診審核
          ════════════════════════════════════════════════ */}
          {pageTab === "followup" && (
            <>
              {/* 篩選列 */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap items-center gap-3">
                {FOLLOWUP_FILTER_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setFollowUpFilter(opt.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      followUpFilter === opt.value
                        ? opt.value === "pending_review" ? "bg-orange-500 text-white shadow-md" : "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}>
                    {opt.label}
                  </button>
                ))}
                <button onClick={fetchFollowUpRequests} className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  <RefreshCw size={14} className={followUpLoading ? "animate-spin" : ""} /> 重新整理
                </button>
              </div>

              {/* 清單 */}
              {followUpLoading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mr-3" />
                  <p className="text-gray-500">載入中...</p>
                </div>
              ) : followUpRequests.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">目前沒有符合條件的回診申請</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                  {followUpRequests.map((req) => {
                    const badge = getFollowUpStatusBadge(req.status);
                    const isPendingReview = req.status === "pending_review";
                    return (
                      <div key={req.request_id}
                        className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${isPendingReview ? "border-orange-400" : "border-gray-200"}`}>
                        <div className="p-5">
                          {/* 狀態 + 日期 */}
                          <div className="flex justify-between items-start mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}>
                              {badge.label}
                            </span>
                            <span className="text-xs text-gray-400">{req.created_at?.slice(0, 10)}</span>
                          </div>

                          {/* 患者 + 醫師 */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-100 rounded-full p-2 shrink-0"><User className="w-4 h-4 text-blue-600" /></div>
                              <div>
                                <p className="text-xs text-gray-400">患者</p>
                                <p className="font-semibold text-gray-800 text-sm">{req.patient_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="bg-green-100 rounded-full p-2 shrink-0"><Stethoscope className="w-4 h-4 text-green-600" /></div>
                              <div>
                                <p className="text-xs text-gray-400">醫師</p>
                                <p className="font-semibold text-gray-800 text-sm">{req.doctor_name}</p>
                                <p className="text-xs text-green-600">{req.specialty}</p>
                              </div>
                            </div>
                          </div>

                          {/* 回診資訊 */}
                          <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">上次看診</span>
                              <span className="font-medium text-gray-700">{req.last_visit_date}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">建議回診</span>
                              <span className="font-medium text-gray-700">{req.suggested_weeks} 週後</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">患者偏好</span>
                              <span className="font-medium text-gray-700">{req.preferred_slot_label || "尚未填寫"}</span>
                            </div>
                            {req.note && (
                              <div className="border-t pt-1.5">
                                <span className="text-gray-500">醫師備註：</span>
                                <span className="text-gray-700">{req.note}</span>
                              </div>
                            )}
                          </div>

                          {/* 待審核：顯示患者選的時段 + 確認/拒絕按鈕 */}
                          {isPendingReview && req.selected_date && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                              <p className="text-xs text-orange-600 font-medium mb-1">患者選擇的時段</p>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-orange-500" />
                                <span className="font-semibold text-gray-800">{formatDate(req.selected_date)}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-4 h-4 text-orange-500" />
                                <span className="font-semibold text-gray-800">{req.selected_time?.slice(0, 5)}</span>
                              </div>
                            </div>
                          )}

                          {/* 操作按鈕（只有 pending_review 才顯示） */}
                          {isPendingReview && (
                            <div className="flex gap-2">
                              <button onClick={() => handleApprove(req.request_id)} disabled={isProcessing}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50">
                                <Check size={15} /> 核准
                              </button>
                              <button onClick={() => openRejectModal(req)} disabled={isProcessing}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50">
                                <X size={15} /> 拒絕
                              </button>
                            </div>
                          )}

                          {/* 已完成狀態 */}
                          {req.status === "scheduled" && (
                            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                              <Check className="w-4 h-4 text-green-500 shrink-0" />
                              <span className="text-sm text-green-700 font-medium">已安排預約，患者已收到通知</span>
                            </div>
                          )}

                          {req.status === "no_slots_available" && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                              <span className="text-sm text-red-700">該時段無可用排班，請人工聯絡患者安排。</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <footer className="bg-gray-800 text-white py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400">© 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。</p>
          </div>
        </footer>
      </div>

      {/* ── 拒絕理由彈窗 ── */}
      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <X className="text-red-500" size={20} /> 拒絕回診申請
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="text-gray-500">患者</p>
                <p className="font-semibold text-gray-800">{rejectTarget.patient_name}</p>
                <p className="text-gray-500 mt-1">申請時段</p>
                <p className="font-semibold text-gray-800">{rejectTarget.selected_date} {rejectTarget.selected_time?.slice(0, 5)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  拒絕原因 <span className="text-gray-400 font-normal">（選填，會傳送給患者）</span>
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-sm resize-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  rows="3"
                  placeholder="例如：該時段醫師臨時有異動..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition text-sm">
                取消
              </button>
              <button onClick={handleReject} disabled={isProcessing}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {isProcessing ? <><RefreshCw size={15} className="animate-spin" /> 處理中...</> : <><X size={15} /> 確定拒絕</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}