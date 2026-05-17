"use client";
import { useState, useEffect } from 'react';
import { Calendar, Clock, User, RefreshCw, Menu, LayoutGrid, List, X, Sparkles, FileText, CalendarPlus } from 'lucide-react';
import DoctorSidebar from "../components/DoctorSidebar";
import Navbar from "../components/Navbar";

export default function AppointmentRecords() {
  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [viewMode, setViewMode] = useState("card");
  const [editingInTable, setEditingInTable] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [refundInfo, setRefundInfo] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // ── 逐字稿彈窗 ──────────────────────────────────────────────
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [transcriptAppointment, setTranscriptAppointment] = useState(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  // ── 週摘要彈窗 ──────────────────────────────────────────────
  const [showWeeklySummaryModal, setShowWeeklySummaryModal] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryWeekStart, setSummaryWeekStart] = useState("");
  const [summaryWeekEnd, setSummaryWeekEnd] = useState("");

  // ── 回診彈窗 ────────────────────────────────────────────────
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpAppointment, setFollowUpAppointment] = useState(null);
  const [followUpWeeks, setFollowUpWeeks] = useState("2");
  const [followUpNote, setFollowUpNote] = useState("");
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [followUpSentIds, setFollowUpSentIds] = useState(new Set());

  // 預設本週範圍
  useEffect(() => {
    const today = new Date();
    const day = today.getDay();
    const mon = new Date(today);
    mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    setSummaryWeekStart(mon.toISOString().slice(0, 10));
    setSummaryWeekEnd(sun.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    if (isOpen && !isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isDesktop]);

  useEffect(() => {
    async function fetchApprovalStatus() {
      try {
        const res = await fetch("/api/me", { credentials: 'include' });
        const data = await res.json();
        if (data.authenticated && data.user && data.user.role === 'doctor') {
          setApprovalStatus(data.user.approval_status);
        }
      } catch (error) {
        console.error("Failed to fetch approval status:", error);
      }
    }
    fetchApprovalStatus();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recordoc", { credentials: 'include' });
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
        doctor_advice: item.doctor_advice || "",
        transcript: item.transcript || "",
        patient_id: item.patient_id,  // 回診需要
        patient: { first_name: item.first_name, last_name: item.last_name },
        isEditing: false,
        tempAdvice: item.doctor_advice || "",
      })));
    } catch (error) {
      console.error("取得預約記錄失敗:", error);
      alert(`取得預約記錄失敗: ${error.message}`);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentAdvice = async (appointmentId, advice) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/advice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_advice: advice })
      });
      if (!res.ok) throw new Error("API 儲存建議失敗");
      setAppointments(prev =>
        prev.map(a =>
          a.appointment_id === appointmentId
            ? { ...a, doctor_advice: advice, tempAdvice: advice, isEditing: false }
            : a
        )
      );
      setEditingInTable(null);
    } catch (error) {
      alert("儲存建議失敗，請稍後再試。");
    }
  };

  // ── 逐字稿邏輯 ──────────────────────────────────────────────
  const openTranscriptModal = async (appointment) => {
    setTranscriptAppointment(appointment);
    setTranscriptText(appointment.transcript || "");
    setShowTranscriptModal(true);

    if (!appointment.transcript) {
      setTranscriptLoading(true);
      try {
        const res = await fetch(`/api/appointments/${appointment.appointment_id}/transcript`, {
          credentials: 'include'
        });
        const data = await res.json();
        setTranscriptText(data.transcript || "");
      } catch (e) {
        console.error("取得逐字稿失敗:", e);
      } finally {
        setTranscriptLoading(false);
      }
    }
  };

  const saveTranscript = async () => {
    if (!transcriptAppointment) return;
    setIsSavingTranscript(true);
    try {
      const res = await fetch(`/api/appointments/${transcriptAppointment.appointment_id}/transcript`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transcript: transcriptText }),
      });
      if (res.ok) {
        setAppointments(prev =>
          prev.map(a =>
            a.appointment_id === transcriptAppointment.appointment_id
              ? { ...a, transcript: transcriptText }
              : a
          )
        );
        setShowTranscriptModal(false);
        setTranscriptAppointment(null);
      } else {
        alert("儲存失敗，請稍後再試。");
      }
    } catch (e) {
      alert("儲存發生錯誤。");
    } finally {
      setIsSavingTranscript(false);
    }
  };

  // ── 回診邏輯 ─────────────────────────────────────────────────
  const openFollowUpModal = (appointment) => {
    setFollowUpAppointment(appointment);
    setFollowUpWeeks("2");
    setFollowUpNote("");
    setShowFollowUpModal(true);
  };

  const handleSendFollowUp = async () => {
    if (!followUpAppointment) return;
    setIsSendingFollowUp(true);
    try {
      console.log("followUpAppointment:", followUpAppointment);
      // 直接打 Flask 5000，不走 Next.js route（避免 HTML 404）
      const res = await fetch("http://localhost:5000/api/doctor/followup-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          appointment_id: followUpAppointment.appointment_id,
          patient_id: followUpAppointment.patient_id,
          suggested_weeks: parseInt(followUpWeeks),
          note: followUpNote.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFollowUpSentIds(prev => new Set([...prev, followUpAppointment.appointment_id]));
        setShowFollowUpModal(false);
        alert(`✅ 已透過 LINE 通知 ${followUpAppointment.patient.first_name}${followUpAppointment.patient.last_name} 填寫回診偏好時段`);
      } else {
        alert(data.message || "發送失敗，請稍後再試");
      }
    } catch (e) {
      console.error("回診發送錯誤:", e);
      alert("發送失敗，請確認伺服器連線正常");
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  // ── 週摘要邏輯 ──────────────────────────────────────────────
  const generateWeeklySummary = async () => {
    if (!summaryWeekStart || !summaryWeekEnd) { alert("請先選擇週期範圍"); return; }
    setIsGeneratingSummary(true);
    setWeeklySummary("");
    try {
      const res = await fetch('/api/doctor/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ week_start: summaryWeekStart, week_end: summaryWeekEnd }),
      });
      const data = await res.json();
      if (res.ok) {
        setWeeklySummary(data.summary || "（無摘要內容）");
      } else {
        alert(`摘要生成失敗：${data.message}`);
      }
    } catch (e) {
      alert("摘要生成發生錯誤，請稍後再試。");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // ── 工具函式 ─────────────────────────────────────────────────
  const getStatusColor = (status) => {
    switch (status) {
      case '已確認': return 'bg-blue-100 text-blue-800 border-blue-300';
      case '已完成': return 'bg-green-100 text-green-800 border-green-300';
      case '已取消': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  };

  const formatTime = (timeString) => timeString.slice(0, 5);

  const calculateRefund = (appointmentDate, appointmentTime) => {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    const diffMs = appointmentDateTime - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const isSameDay = appointmentDateTime.toDateString() === now.toDateString();
    if (isSameDay) return { percentage: 20, message: "若您於當天取消，將僅退回 20% 款項" };
    if (diffDays <= 2) return { percentage: 50, message: "若您於2天內取消，將僅退回 50% 款項" };
    return { percentage: 100, message: "若您於超過2天前取消，將全額退款" };
  };

  const isAppointmentExpired = (appointmentDate, appointmentTime) => {
    return new Date(`${appointmentDate}T${appointmentTime}`) < new Date();
  };

  const handleCancelClick = (appointment) => {
    if (isAppointmentExpired(appointment.appointment_date, appointment.appointment_time)) {
      alert("此預約時間已過期，無法取消。");
      return;
    }
    const refund = calculateRefund(appointment.appointment_date, appointment.appointment_time);
    setRefundInfo(refund);
    setSelectedAppointment(appointment);
    if (window.confirm(`${refund.message}\n\n確定要取消預約嗎?`)) {
      setShowCancelModal(true);
    }
  };

  const handleSubmitCancel = async () => {
    if (!selectedAppointment) { alert("未選擇預約，請重新操作"); return; }
    if (!cancelReason.trim()) { alert("請輸入取消原因"); return; }
    setIsCancelling(true);
    try {
      const res = await fetch("/api/cancel_appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ appointment_id: selectedAppointment.appointment_id, cancellation_reason: cancelReason }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setAppointments(prev =>
          prev.map(a =>
            a.appointment_id === selectedAppointment.appointment_id
              ? { ...a, status: "已取消", cancellation_reason: cancelReason }
              : a
          )
        );
        setShowCancelModal(false);
        setCancelReason("");
        setSelectedAppointment(null);
        fetchAppointments();
      } else {
        alert(data.message || "取消失敗，請稍後再試");
      }
    } catch (error) {
      alert("取消失敗，請稍後再試");
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => filter === 'all' || apt.status === filter);

  if (loading) {
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
    <>
      <div className="relative min-h-screen flex flex-col bg-gray-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition"
            aria-label="開啟選單"
          >
            <Menu size={24} />
          </button>
        )}

        {isOpen && !isDesktop && (
          <div
            className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
            aria-label="關閉選單"
          />
        )}

        <DoctorSidebar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          approvalStatus={approvalStatus}
        />

        <div className={`flex-1 flex flex-col transition-all duration-300 ${isOpen && isDesktop ? "lg:ml-64" : "ml-0"}`}>
          <Navbar />

          <div className="flex-1 p-4 sm:p-6">
            {/* 篩選列 */}
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {['all', '已確認', '已完成', '已取消'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm font-medium transition-all ${
                        filter === status
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'all' ? '全部' : status}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowWeeklySummaryModal(true); setWeeklySummary(""); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition shadow-sm"
                  >
                    <Sparkles size={16} />
                    <span className="hidden sm:inline">週摘要</span>
                  </button>

                  <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("card")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-medium transition-all ${
                        viewMode === "card" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      <LayoutGrid size={18} />
                      <span className="hidden sm:inline text-sm">卡片式</span>
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-medium transition-all ${
                        viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      <List size={18} />
                      <span className="hidden sm:inline text-sm">橫列式</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 預約列表 */}
            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">目前沒有符合條件的預約紀錄</p>
              </div>
            ) : viewMode === "card" ? (
              /* ── 卡片式視圖 ── */
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
                {filteredAppointments.map((appointment) => (
                  <div key={appointment.appointment_id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className="p-4 sm:p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>

                      <div className="flex items-center mb-4">
                        <div className="bg-blue-100 rounded-full p-3 mr-4 shrink-0">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                          {appointment.patient.first_name}{appointment.patient.last_name} 患者
                        </h3>
                      </div>

                      <div className="space-y-2 bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center text-gray-700">
                          <Calendar className="w-5 h-5 mr-3 text-blue-600 shrink-0" />
                          <span className="font-medium text-sm sm:text-base">{formatDate(appointment.appointment_date)}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <Clock className="w-5 h-5 mr-3 text-blue-600 shrink-0" />
                          <span className="font-medium text-sm sm:text-base">{formatTime(appointment.appointment_time)}</span>
                        </div>
                      </div>

                      {appointment.status === '已取消' && appointment.cancellation_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-sm text-red-800">
                            <span className="font-semibold">取消原因：</span>
                            <span className="text-red-700 ml-1">{appointment.cancellation_reason}</span>
                          </p>
                        </div>
                      )}

                      {appointment.status === '已完成' && (
                        <div className="mt-4 space-y-3">
                          {/* 逐字稿 + 回診按鈕並排 */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => openTranscriptModal(appointment)}
                              className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition"
                            >
                              <FileText size={14} />
                              {appointment.transcript ? '逐字稿' : '逐字稿（待生成）'}
                            </button>
                            <button
                              onClick={() => openFollowUpModal(appointment)}
                              disabled={followUpSentIds.has(appointment.appointment_id)}
                              className={`flex items-center justify-center gap-1.5 flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                                followUpSentIds.has(appointment.appointment_id)
                                  ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                                  : 'bg-orange-500 hover:bg-orange-600 text-white'
                              }`}
                            >
                              <CalendarPlus size={14} />
                              {followUpSentIds.has(appointment.appointment_id) ? '已通知回診' : '建議回診'}
                            </button>
                          </div>

                          {/* 醫師建議 */}
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-2">醫生建議與處方：</h4>
                            {(appointment.isEditing || !appointment.doctor_advice) ? (
                              <div>
                                <textarea
                                  className="text-gray-700 w-full p-3 border rounded-lg text-sm"
                                  rows="4"
                                  placeholder="請輸入給予患者的建議與處方..."
                                  value={appointment.tempAdvice}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setAppointments(prev =>
                                      prev.map(a =>
                                        a.appointment_id === appointment.appointment_id
                                          ? { ...a, tempAdvice: value }
                                          : a
                                      )
                                    );
                                  }}
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                                    onClick={() => updateAppointmentAdvice(appointment.appointment_id, appointment.tempAdvice)}
                                  >
                                    儲存
                                  </button>
                                  {appointment.doctor_advice && appointment.isEditing && (
                                    <button
                                      className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition text-sm"
                                      onClick={() => {
                                        setAppointments(prev =>
                                          prev.map(a =>
                                            a.appointment_id === appointment.appointment_id
                                              ? { ...a, isEditing: false, tempAdvice: a.doctor_advice }
                                              : a
                                          )
                                        );
                                      }}
                                    >
                                      取消
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 relative">
                                <p className="text-gray-700 whitespace-pre-line text-sm sm:text-base pb-8">
                                  {appointment.doctor_advice}
                                </p>
                                <button
                                  className="absolute bottom-2 right-2 text-sm px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition shadow-md"
                                  onClick={() => {
                                    setAppointments(prev =>
                                      prev.map(a =>
                                        a.appointment_id === appointment.appointment_id
                                          ? { ...a, isEditing: true }
                                          : a
                                      )
                                    );
                                  }}
                                >
                                  編輯
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {appointment.status === '已確認' && (
                        isAppointmentExpired(appointment.appointment_date, appointment.appointment_time) ? (
                          <div className="w-full bg-gray-100 text-gray-500 font-medium py-2 rounded-lg mt-4 text-sm text-center border border-gray-300">
                            預約時間已過期
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCancelClick(appointment)}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg transition mt-4 text-sm"
                          >
                            取消預約
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ── 表格式視圖 ── */
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">狀態</th>
                        <th className="px-3 sm:px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">患者姓名</th>
                        <th className="px-3 sm:px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">日期</th>
                        <th className="px-3 sm:px-6 py-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">時間</th>
                        <th className="px-3 sm:px-6 py-4 text-left text-sm font-semibold text-gray-700">
                          <span className="text-blue-600">醫生建議</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-red-600">取消原因</span>
                        </th>
                        <th className="px-3 sm:px-6 py-4 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAppointments.map((appointment) => (
                        <tr key={appointment.appointment_id} className="hover:bg-gray-50 transition">
                          <td className="px-3 sm:px-6 py-4">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            <div className="font-medium text-gray-800 text-sm whitespace-nowrap">
                              {appointment.patient.first_name}{appointment.patient.last_name}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-gray-700 text-sm whitespace-nowrap">
                            {formatDate(appointment.appointment_date)}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-gray-700 text-sm font-medium whitespace-nowrap">
                            {formatTime(appointment.appointment_time)}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-sm max-w-[200px] sm:max-w-md">
                            {appointment.status === '已取消' && appointment.cancellation_reason && (
                              <span className="text-red-600 text-sm">{appointment.cancellation_reason}</span>
                            )}
                            {appointment.status === '已完成' && (
                              editingInTable === appointment.appointment_id ? (
                                <div className="space-y-2">
                                  <textarea
                                    className="w-full p-2 border rounded text-gray-700 text-sm"
                                    rows="3"
                                    placeholder="請輸入醫生建議..."
                                    value={appointment.tempAdvice}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setAppointments(prev =>
                                        prev.map(a =>
                                          a.appointment_id === appointment.appointment_id
                                            ? { ...a, tempAdvice: value }
                                            : a
                                        )
                                      );
                                    }}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                      onClick={() => updateAppointmentAdvice(appointment.appointment_id, appointment.tempAdvice)}
                                    >
                                      儲存
                                    </button>
                                    <button
                                      className="px-3 py-1 bg-gray-300 rounded text-xs hover:bg-gray-400"
                                      onClick={() => {
                                        setEditingInTable(null);
                                        setAppointments(prev =>
                                          prev.map(a =>
                                            a.appointment_id === appointment.appointment_id
                                              ? { ...a, tempAdvice: a.doctor_advice }
                                              : a
                                          )
                                        );
                                      }}
                                    >
                                      取消
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-blue-600 text-sm">
                                  {appointment.doctor_advice || '尚未填寫'}
                                </span>
                              )
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4 text-center whitespace-nowrap">
                            <div className="flex flex-col gap-1.5 items-center">
                              {appointment.status === '已完成' && (
                                <>
                                  {editingInTable !== appointment.appointment_id && (
                                    <button
                                      onClick={() => setEditingInTable(appointment.appointment_id)}
                                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition w-full"
                                    >
                                      {appointment.doctor_advice ? '編輯建議' : '新增建議'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openTranscriptModal(appointment)}
                                    className="flex items-center justify-center gap-1 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition w-full"
                                  >
                                    <FileText size={12} />
                                    逐字稿
                                  </button>
                                  <button
                                    onClick={() => openFollowUpModal(appointment)}
                                    disabled={followUpSentIds.has(appointment.appointment_id)}
                                    className={`flex items-center justify-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition w-full ${
                                      followUpSentIds.has(appointment.appointment_id)
                                        ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                                    }`}
                                  >
                                    <CalendarPlus size={12} />
                                    {followUpSentIds.has(appointment.appointment_id) ? '已通知' : '建議回診'}
                                  </button>
                                </>
                              )}
                              {appointment.status === '已確認' && (
                                isAppointmentExpired(appointment.appointment_date, appointment.appointment_time) ? (
                                  <span className="text-gray-400 text-xs border border-gray-300 bg-gray-100 px-3 py-1.5 rounded-lg">
                                    已過期
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleCancelClick(appointment)}
                                    className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                                  >
                                    取消
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <footer className="bg-gray-800 text-white py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-gray-400 text-sm">© 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。</p>
            </div>
          </footer>
        </div>
      </div>

      {/* ── 取消預約彈窗 ── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">請說明取消原因</h3>
              <button onClick={() => { setShowCancelModal(false); setCancelReason(""); }} className="text-gray-500 hover:text-gray-700 transition">
                <X size={24} />
              </button>
            </div>
            {refundInfo && (
              <p className="text-sm text-blue-600 font-medium mb-3">{refundInfo.message}</p>
            )}
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="請輸入取消原因..."
              className="text-gray-700 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm mb-4"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 rounded-lg transition text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSubmitCancel}
                disabled={isCancelling}
                className={`flex-1 font-medium py-2.5 rounded-lg transition text-sm ${isCancelling ? "bg-red-300 text-white cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"}`}
              >
                {isCancelling ? "取消中..." : "確定取消預約"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 逐字稿彈窗 ── */}
      {showTranscriptModal && transcriptAppointment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="text-teal-500" size={20} />
                  看診逐字稿
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {transcriptAppointment.patient.first_name}{transcriptAppointment.patient.last_name} ·{" "}
                  {formatDate(transcriptAppointment.appointment_date)} {formatTime(transcriptAppointment.appointment_time)}
                </p>
              </div>
              <button onClick={() => { setShowTranscriptModal(false); setTranscriptAppointment(null); }} className="text-gray-400 hover:text-gray-600 transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-hidden flex flex-col">
              {transcriptLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw size={24} className="animate-spin text-teal-400 mr-2" />
                  <span className="text-gray-500 text-sm">載入逐字稿中...</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-gray-500 font-medium">逐字稿內容（可直接編輯）</p>
                    <span className="text-xs text-gray-400">{transcriptText.length} 字</span>
                  </div>
                  <textarea
                    className="flex-1 w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-sm resize-none focus:ring-2 focus:ring-teal-400 focus:border-transparent min-h-[250px]"
                    placeholder={transcriptText === "" ? "此看診尚無逐字稿。\n\n逐字稿會在視訊看診結束後由 Whisper AI 自動生成並儲存至此。" : ""}
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                  />
                  {transcriptText === "" && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ 此看診尚無逐字稿，可能是看診前未開啟音訊錄製功能。
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="p-5 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => { setShowTranscriptModal(false); setTranscriptAppointment(null); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition text-sm"
              >
                關閉
              </button>
              <button
                onClick={saveTranscript}
                disabled={isSavingTranscript}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-medium py-2.5 rounded-lg transition text-sm disabled:opacity-50"
              >
                {isSavingTranscript ? "儲存中..." : "儲存修改"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 建議回診彈窗 ── */}
      {showFollowUpModal && followUpAppointment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CalendarPlus className="text-orange-500" size={20} />
                建議回診通知
              </h3>
              <button onClick={() => setShowFollowUpModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* 患者資訊 */}
              <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                <div className="bg-blue-100 rounded-full p-2 shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {followUpAppointment.patient.first_name}{followUpAppointment.patient.last_name} 患者
                  </p>
                  <p className="text-xs text-gray-500">
                    上次看診：{formatDate(followUpAppointment.appointment_date)}
                  </p>
                </div>
              </div>

              {/* 建議幾週後回診 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">建議回診時間</label>
                <div className="flex gap-2 flex-wrap">
                  {["1", "2", "4", "8", "12"].map((w) => (
                    <button
                      key={w}
                      onClick={() => setFollowUpWeeks(w)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                        followUpWeeks === w
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:text-orange-600'
                      }`}
                    >
                      {w} 週後
                    </button>
                  ))}
                </div>
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  給患者的備註 <span className="text-gray-400 font-normal">（選填）</span>
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-sm resize-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  rows="3"
                  placeholder="例如：請記得空腹抽血、帶上藥袋..."
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                />
              </div>

              {/* 說明文字 */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs text-orange-700">
                  📲 系統將透過 LINE 詢問患者偏好時段（早診 / 午診 / 晚診），機構收到後安排回診預約。
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSendFollowUp}
                disabled={isSendingFollowUp}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSendingFollowUp
                  ? <><RefreshCw size={15} className="animate-spin" /> 發送中...</>
                  : <><CalendarPlus size={15} /> 發送 LINE 通知</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 週摘要彈窗 ── */}
      {showWeeklySummaryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="text-purple-500" size={20} />
                AI 週摘要生成
              </h3>
              <button
                onClick={() => { setShowWeeklySummaryModal(false); setWeeklySummary(""); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5 border-b border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">選擇週期範圍</p>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">開始日期</label>
                  <input
                    type="date"
                    value={summaryWeekStart}
                    onChange={(e) => setSummaryWeekStart(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">結束日期</label>
                  <input
                    type="date"
                    value={summaryWeekEnd}
                    onChange={(e) => setSummaryWeekEnd(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={generateWeeklySummary}
                  disabled={isGeneratingSummary}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {isGeneratingSummary
                    ? <><RefreshCw size={15} className="animate-spin" /> 生成中...</>
                    : <><Sparkles size={15} /> 生成摘要</>
                  }
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">使用 GPT-4o 分析本週已完成看診的逐字稿與醫師建議</p>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              {isGeneratingSummary ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <RefreshCw size={32} className="animate-spin mb-3 text-purple-400" />
                  <p className="text-sm">GPT-4o 正在分析看診紀錄，請稍候...</p>
                </div>
              ) : weeklySummary ? (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{weeklySummary}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Sparkles size={40} className="mb-3 text-gray-300" />
                  <p className="text-sm">選擇週期範圍後，點擊「生成摘要」</p>
                  <p className="text-xs mt-1 text-gray-300">AI 會自動分析看診逐字稿與醫師建議</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => { setShowWeeklySummaryModal(false); setWeeklySummary(""); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition text-sm"
              >
                關閉
              </button>
              {weeklySummary && (
                <button
                  onClick={() => { navigator.clipboard.writeText(weeklySummary); alert("已複製到剪貼簿！"); }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition text-sm"
                >
                  複製摘要
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}