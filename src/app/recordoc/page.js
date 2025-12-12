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
  const [viewMode, setViewMode] = useState("card"); // 新增：視圖模式
  const [editingInTable, setEditingInTable] = useState(null); // 新增：表格中正在編輯的項目
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    async function fetchApprovalStatus() {
      try {
        const res = await fetch("/api/me", {
          credentials: 'include'
        });
        const data = await res.json();
        
        console.log("📡 API 回應:", data);
        console.log("📡 approval_status:", data.user?.approval_status);
        
        if (data.authenticated && data.user && data.user.role === 'doctor') {
          const status = data.user.approval_status;
          setApprovalStatus(status);
          console.log("✅ 已設定 approvalStatus 為:", status);
        }
      } catch (error) {
        console.error("❌ Failed to fetch approval status:", error);
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
      
      if (!res.ok) throw new Error("API 取得資料失敗");
      const data = await res.json();

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
      console.error(error);
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
      setEditingInTable(null); // 關閉表格編輯模式
      console.log(`✅ 預約 ID ${appointmentId} 建議已成功更新`);

    } catch (error) {
      console.error("❌ 儲存醫生建議失敗:", error);
      alert("儲存建議失敗,請稍後再試。");
    }
  };

  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
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
    <div className="relative min-h-screen bg-gray-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 bg-white rounded-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      <DoctorSidebar 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        approvalStatus={approvalStatus}  
      />
      
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />

        <div className="p-6">
          {/* 篩選器與視圖切換 */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* 狀態篩選 */}
              <div className="flex flex-wrap gap-2">
                {['all', '已確認', '已完成', '已取消'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                    viewMode === "card"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <LayoutGrid size={18} />
                  <span className="hidden sm:inline">卡片式</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                    viewMode === "table"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <List size={18} />
                  <span className="hidden sm:inline">橫列式</span>
                </button>
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
            /* 卡片式視圖 */
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
                          {appointment.patient.first_name}{appointment.patient.last_name} 患者
                        </h3>
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
                    </div>

                    {appointment.status === '已取消' && appointment.cancellation_reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">
                          <span className="font-semibold">取消原因：</span>
                          <span className="text-red-700 font-normal ml-1">{appointment.cancellation_reason}</span>
                        </p>
                      </div>
                    )}

                    {appointment.status === '已完成' && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-800 mb-2">醫生建議與處方：</h4>

                        {(appointment.isEditing || !appointment.doctor_advice) && (
                          <div>
                            <textarea
                              className="w-full p-3 border rounded-lg"
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
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                onClick={() => 
                                  updateAppointmentAdvice(appointment.appointment_id, appointment.tempAdvice)
                                }
                              >
                                儲存
                              </button>

                              {appointment.doctor_advice && appointment.isEditing && (
                                <button
                                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
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
                            <p className="text-gray-700 whitespace-pre-line text-base pb-8">
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
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg transition mt-4"
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">狀態</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">患者姓名</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">日期</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">時間</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        <span className="text-blue-600">醫生建議</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-red-600">取消原因</span>
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAppointments.map((appointment) => (
                      <tr key={appointment.appointment_id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">
                            {appointment.patient.first_name}{appointment.patient.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-sm">
                          {formatDate(appointment.appointment_date)}
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-sm font-medium">
                          {formatTime(appointment.appointment_time)}
                        </td>
                        <td className="px-6 py-4 text-sm max-w-md">
                          {appointment.status === '已取消' && appointment.cancellation_reason && (
                            <span className="text-red-600">{appointment.cancellation_reason}</span>
                          )}
                          {appointment.status === '已完成' && (
                            editingInTable === appointment.appointment_id ? (
                              <div className="space-y-2">
                                <textarea
                                  className="w-full p-2 border rounded text-gray-700"
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
                              <span className="text-blue-600">
                                {appointment.doctor_advice || '尚未填寫'}
                              </span>
                            )
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {appointment.status === '已完成' && editingInTable !== appointment.appointment_id && (
                            <button
                              onClick={() => setEditingInTable(appointment.appointment_id)}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                            >
                              {appointment.doctor_advice ? '編輯' : '新增'}
                            </button>
                          )}
                          {appointment.status === '已確認' && (
                            <button
                              onClick={() => handleCancelClick(appointment)}
                              className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
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
        <div className="bg-gray-800 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400">
              © 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。
            </p>
          </div>
        </div>
      </div>

      {/* 取消預約彈窗 */}
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