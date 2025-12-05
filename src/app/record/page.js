"use client";
import { useState, useEffect } from "react";
import { Calendar, Clock, User, Stethoscope, RefreshCw, Menu, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import LockedPageOverlay from "../components/LockedPageOverlay"; // ✅ 新增
import { Video } from 'lucide-react';

export default function AppointmentRecords() {
  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  
  // ✅ 新增：登入狀態管理
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [refundInfo, setRefundInfo] = useState({ percentage: 0, message: "" });

  // ✅ 新增：檢查登入狀態
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
    // ✅ 只有登入時才載入資料
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
              ? { ...a, status: "已取消", cancel_reason: cancelReason }
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

  // ✅ 只在認證檢查時顯示載入
  if (authLoading) {
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
    <div className="relative min-h-screen bg-gray-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />

        {/* ✅ 主內容區域 */}
        <div className="relative min-h-screen p-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 text-lg">載入預約紀錄中...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  {["all", "已確認", "已完成", "已取消"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-4 py-2 rounded-full font-medium transition-all ${
                        filter === status
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {status === "all" ? "全部" : status}
                    </button>
                  ))}
                </div>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">目前沒有符合條件的預約紀錄</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.appointment_id}
                      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </div>

                        <div className="flex items-center mb-4">
                          <div className="bg-blue-100 rounded-full p-3 mr-4">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">
                              {appointment.doctor.first_name}
                              {appointment.doctor.last_name} 醫師
                            </h3>
                            <div className="flex items-center text-gray-600 mt-1">
                              <Stethoscope className="w-4 h-4 mr-1" />
                              <span className="text-sm">{appointment.doctor.specialty}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center text-gray-700">
                            <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                            <span className="font-medium">
                              {formatDate(appointment.appointment_date)}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <Clock className="w-5 h-5 mr-3 text-blue-600" />
                            <span className="font-medium">
                              {formatTime(appointment.appointment_time)}
                            </span>
                          </div>
                        </div>

                        {appointment.status === "已確認" && (
                          <button
                            onClick={() => handleCancelClick(appointment)}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg transition"
                          >
                            取消預約
                          </button>
                        )}

                        {appointment.status === "已取消" && appointment.cancellation_reason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                            <p className="text-sm text-red-800 mb-1">
                              <span className="font-semibold">取消原因：</span>
                              <span className="text-red-700 font-normal">{appointment.cancellation_reason}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* ✅ 未登入時顯示鎖定覆蓋層 */}
          {!user && <LockedPageOverlay pageName="預約紀錄" icon={Calendar} />}
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">請說明取消原因</h3>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-blue-600 font-medium mb-3">{refundInfo.message}</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="請輸入取消原因..."
                className="text-gray-700 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="4"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleSubmitCancel}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition"
              >
                確定取消預約
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}