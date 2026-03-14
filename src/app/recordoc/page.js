"use client";
import { useState, useEffect } from 'react';
import { Calendar, Clock, User, RefreshCw, Menu, LayoutGrid, List, X } from 'lucide-react';
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

  // 偵測螢幕寬度，桌機才用推擠式 sidebar
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // 手機/平板開啟 sidebar 時鎖定 body 捲動
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
        const res = await fetch("/api/me", {
          credentials: 'include'
        });
        const data = await res.json();
        
        if (data.authenticated && data.user && data.user.role === 'doctor') {
          const status = data.user.approval_status;
          setApprovalStatus(status);
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
      const res = await fetch("/api/recordoc", {
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `API 取得資料失敗 (狀態碼: ${res.status})`);
      }
      
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("API 返回的資料不是陣列:", data);
        setAppointments([]);
        return;
      }

      const formattedData = data.map((item) => ({
        appointment_id: item.appointment_id,
        appointment_date: item.appointment_date,
        appointment_time: item.appointment_time,
        status: item.status,
        cancellation_reason: item.cancellation_reason || null,
        doctor_advice: item.doctor_advice || "",
        patient: {
          first_name: item.first_name,
          last_name: item.last_name,
        },
        isEditing: false, 
        tempAdvice: item.doctor_advice || "",
      }));

      setAppointments(formattedData);
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
            ? { 
                ...a, 
                doctor_advice: advice,
                tempAdvice: advice,
                isEditing: false
              }
            : a
        )
      );
      setEditingInTable(null);
      console.log(`✅ 預約 ID ${appointmentId} 建議已成功更新`);

    } catch (error) {
      console.error("❌ 儲存醫生建議失敗:", error);
      alert("儲存建議失敗,請稍後再試。");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '已確認':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case '已完成':
        return 'bg-green-100 text-green-800 border-green-300';
      case '已取消':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
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
      return { percentage: 20, message: "若您於當天取消,將僅退回 20% 款項" };
    } else if (diffDays <= 2) {
      return { percentage: 50, message: "若您於2天內取消,將僅退回 50% 款項" };
    } else {
      return { percentage: 100, message: "若您於超過2天前取消,將全額退款" };
    }
  };

  const handleCancelClick = (appointment) => {
    const refund = calculateRefund(appointment.appointment_date, appointment.appointment_time);
    setRefundInfo(refund);
    setSelectedAppointment(appointment);
    
    const confirmed = window.confirm(
      `${refund.message}\n\n確定要取消預約嗎?`
    );
    
    if (confirmed) {
      setShowCancelModal(true);
    }
  };

  const handleSubmitCancel = async () => {
    if (!selectedAppointment) {
      alert("未選擇預約,請重新操作");
      return;
    }

    if (!cancelReason.trim()) {
      alert("請輸入取消原因");
      return;
    }

    setIsCancelling(true);

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
        fetchAppointments();
      } else {
        alert(data.message || "取消失敗,請稍後再試");
      }
    } catch (error) {
      console.error("取消失敗:", error);
      alert("取消失敗,請稍後再試");
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
                    className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition "
                    aria-label="開啟選單"
                >
                    <Menu size={24} />
                </button>
            )}

      {/* Sidebar 遮罩：手機/平板且 sidebar 開啟時顯示 */}
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
      
      {/* 主內容區：桌機時 sidebar 推擠，手機/平板時不推擠 */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isOpen && isDesktop ? "lg:ml-64" : "ml-0"
        }`}
      >
        <Navbar />

        <div className="flex-1 p-4 sm:p-6">
          {/* 篩選器與視圖切換 */}
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* 狀態篩選 */}
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

              {/* 視圖切換按鈕 */}
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("card")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-medium transition-all ${
                    viewMode === "card"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <LayoutGrid size={18} />
                  <span className="hidden sm:inline text-sm">卡片式</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-medium transition-all ${
                    viewMode === "table"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <List size={18} />
                  <span className="hidden sm:inline text-sm">橫列式</span>
                </button>
              </div>
            </div>
          </div>

          {/* 預約列表 - 根據 viewMode 顯示不同視圖 */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">目前沒有符合條件的預約紀錄</p>
            </div>
          ) : viewMode === "card" ? (
            /* 卡片式視圖 */
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.appointment_id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                >
                  <div className="p-4 sm:p-6">
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
                      <div className="bg-blue-100 rounded-full p-3 mr-4 shrink-0">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                          {appointment.patient.first_name}{appointment.patient.last_name} 患者
                        </h3>
                      </div>
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
                          <span className="font-semibold">取消原因:</span>
                          <span className="text-red-700 font-normal ml-1">{appointment.cancellation_reason}</span>
                        </p>
                      </div>
                    )}

                    {appointment.status === '已完成' && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-800 mb-2">醫生建議與處方:</h4>

                        {(appointment.isEditing || !appointment.doctor_advice) && (
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
                                onClick={() => 
                                  updateAppointmentAdvice(appointment.appointment_id, appointment.tempAdvice)
                                }
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
                        )}
                        
                        {appointment.doctor_advice && !appointment.isEditing && (
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
                    )}

                    {appointment.status === '已確認' && (
                      <button
                        onClick={() => handleCancelClick(appointment)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg transition mt-4 text-sm"
                      >
                        取消預約
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 表格式視圖 */
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
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusColor(
                              appointment.status
                            )}`}
                          >
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
                          {appointment.status === '已完成' && editingInTable !== appointment.appointment_id && (
                            <button
                              onClick={() => setEditingInTable(appointment.appointment_id)}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition"
                            >
                              {appointment.doctor_advice ? '編輯' : '新增'}
                            </button>
                          )}
                          {appointment.status === '已確認' && (
                            <button
                              onClick={() => handleCancelClick(appointment)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition"
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
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。
            </p>
          </div>
        </footer>
      </div>
    </div>

    {/* 取消預約彈窗 */}
    {showCancelModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">請說明取消原因</h3>
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
            {refundInfo && (
              <p className="text-sm text-blue-600 font-medium mb-3">{refundInfo.message}</p>
            )}
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="請輸入取消原因..."
              className="text-gray-700 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              rows="4"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCancelModal(false);
                setCancelReason("");
              }}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 rounded-lg transition text-sm"
            >
              取消
            </button>
            <button
              onClick={handleSubmitCancel}
              disabled={isCancelling}
              className={`flex-1 font-medium py-2.5 rounded-lg transition text-sm ${
                isCancelling
                  ? "bg-red-300 text-white cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {isCancelling ? "取消中..." : "確定取消預約"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}