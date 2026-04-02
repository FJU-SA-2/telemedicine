"use client";
import { useState, useEffect } from "react";
import { Calendar, Clock, User, Stethoscope, RefreshCw, Menu, X, LayoutGrid, List } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import LockedPageOverlay from "../components/LockedPageOverlay";
import FloatingChat from "../components/FloatingChat";

export default function AppointmentRecords() {
  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("card"); 
  
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [refundInfo, setRefundInfo] = useState({ percentage: 0, message: "" });

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('檢查登入狀態失敗:', err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/record", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("API 取得資料失敗");
      const data = await res.json();

      const formattedData = data.map((item) => ({
        appointment_id: item.appointment_id,
        appointment_date: item.appointment_date,
        appointment_time: item.appointment_time,
        status: item.status,
        cancellation_reason: item.cancellation_reason || null,
        doctor_advice: item.doctor_advice || null,
        doctor: {
          first_name: item.first_name,
          last_name: item.last_name,
          specialty: item.doctor_specialty,
        },
      }));

      setAppointments(formattedData);
    } catch (error) {
      console.error(error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "已確認":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "已完成":
        return "bg-green-100 text-green-800 border-green-300";
      case "已取消":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (timeString) => {
    return timeString.slice(0, 5);
  };

  const calculateRefund = (appointmentDate, appointmentTime) => {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    const diffMs = appointmentDateTime - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    const isSameDay = appointmentDateTime.toDateString() === now.toDateString();

    if (isSameDay) {
      return { percentage: 20, message: "若您於當天取消，將僅退回 20% 款項" };
    } else if (diffDays <= 2) {
      return { percentage: 50, message: "若您於2天內取消，將僅退回 50% 款項" };
    } else {
      return { percentage: 100, message: "若您於超過2天前取消，將全額退款" };
    }
  };

  const handleCancelClick = (appointment) => {
    const refund = calculateRefund(appointment.appointment_date, appointment.appointment_time);
    setRefundInfo(refund);
    setSelectedAppointment(appointment);
    
    const confirmed = window.confirm(
      `${refund.message}\n\n確定要取消預約嗎？`
    );
    
    if (confirmed) {
      setShowCancelModal(true);
    }
  };

  const handleSubmitCancel = async () => {
    if (!cancelReason.trim()) {
      alert("請輸入取消原因");
      return;
    }

    try {
      const res = await fetch("/api/cancel_appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          appointment_id: selectedAppointment.appointment_id,
          cancellation_reason: cancelReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);

        setAppointments((prev) =>
          prev.map((a) =>
            a.appointment_id === selectedAppointment.appointment_id
              ? { ...a, status: "已取消", cancellation_reason: cancelReason }
              : a
          )
        );

        setShowCancelModal(false);
        setCancelReason("");
        setSelectedAppointment(null);
      } else {
        alert(data.message || "取消失敗，請稍後再試");
      }
    } catch (error) {
      console.error("取消失敗：", error);
      alert("取消失敗，請稍後再試");
    }
  };

  const filteredAppointments = appointments.filter(
    (apt) => filter === "all" || apt.status === filter
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">載入預約紀錄中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className={`flex-1 min-w-0 overflow-x-hidden transition-all duration-300 ${isOpen ? "md:ml-64" : "ml-0"}`}>
        <Navbar />

        <div className="relative min-h-screen p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center">
                <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">載入預約紀錄中...</p>
              </div>
            </div>
          ) : (
            <>
              {/* 篩選器與視圖切換 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* 狀態篩選 */}
                  <div className="flex flex-wrap gap-2">
                    {["all", "已確認", "已完成", "已取消"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                          filter === status
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {status === "all" ? "全部" : status}
                      </button>
                    ))}
                  </div>

                  {/* 視圖切換按鈕 */}
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("card")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        viewMode === "card"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      <LayoutGrid size={16} />
                      <span className="hidden sm:inline">卡片式</span>
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        viewMode === "table"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      <List size={16} />
                      <span className="hidden sm:inline">橫列式</span>
                    </button>
                  </div>
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">目前沒有符合條件的預約紀錄</p>
                </div>
              ) : viewMode === "card" ? (
                /* 卡片式視圖 */
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.appointment_id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden"
                    >
                      <div className="p-4 sm:p-5">
                        {/* 狀態 badge */}
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>

                        {/* 醫師資訊 */}
                        <div className="flex items-center mb-3">
                          <div className="bg-blue-100 rounded-full p-2.5 mr-3 flex-shrink-0">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 leading-tight">
                              {appointment.doctor.first_name}{appointment.doctor.last_name} 醫師
                            </h3>
                            <div className="flex items-center text-gray-500 mt-0.5">
                              <Stethoscope className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">{appointment.doctor.specialty}</span>
                            </div>
                          </div>
                        </div>

                        {/* 日期時間 */}
                        <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1.5">
                          <div className="flex items-center text-gray-700">
                            <Calendar className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium">{formatDate(appointment.appointment_date)}</span>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <Clock className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium">{formatTime(appointment.appointment_time)}</span>
                          </div>
                        </div>

                        {appointment.status === "已確認" && (
                          <button
                            onClick={() => handleCancelClick(appointment)}
                            className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-xl transition"
                          >
                            取消預約
                          </button>
                        )}

                        {appointment.status === "已取消" && appointment.cancellation_reason && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
                            <p className="text-xs text-red-800">
                              <span className="font-semibold">取消原因：</span>
                              {appointment.cancellation_reason}
                            </p>
                          </div>
                        )}

                        {appointment.status === "已完成" && appointment.doctor_advice && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-2">
                            <p className="text-xs text-blue-800">
                              <span className="font-semibold">醫生建議：</span>
                              {appointment.doctor_advice}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* 橫列式視圖 — 手機可橫向捲動 */
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {["狀態", "醫師", "科別", "日期", "時間", "備註", "操作"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredAppointments.map((appointment) => (
                          <tr key={appointment.appointment_id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-800">
                                {appointment.doctor.first_name}{appointment.doctor.last_name}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                              {appointment.doctor.specialty}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                              {formatDate(appointment.appointment_date)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-700">
                              {formatTime(appointment.appointment_time)}
                            </td>
                            <td className="px-4 py-3 text-xs max-w-[160px]">
                              {appointment.status === "已取消" && appointment.cancellation_reason && (
                                <span className="text-red-600 line-clamp-2">{appointment.cancellation_reason}</span>
                              )}
                              {appointment.status === "已完成" && appointment.doctor_advice && (
                                <span className="text-blue-600 line-clamp-2">{appointment.doctor_advice}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {appointment.status === "已確認" && (
                                <button
                                  onClick={() => handleCancelClick(appointment)}
                                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                                >
                                  取消
                                </button>
                              )}
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
          
          {!user && <LockedPageOverlay pageName="預約紀錄" icon={Calendar} />}
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 w-full max-w-md border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">請說明取消原因</h3>
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={22} />
              </button>
            </div>
            <p className="text-sm text-blue-600 font-medium mb-3">{refundInfo.message}</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="請輸入取消原因..."
              className="text-gray-700 w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm mb-4"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-2.5 rounded-xl transition"
              >
                返回
              </button>
              <button
                onClick={handleSubmitCancel}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-xl transition"
              >
                確定取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`transition-all duration-300 ${isOpen ? "md:ml-64" : "ml-0"} bg-gray-800 text-white py-8`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">© 2025 MedOnGo. 讓醫療服務更便捷、更貼心。</p>
        </div>
      </div>
      <FloatingChat />
    </div>
  );
}