"use client";
import { useState, useEffect } from 'react';
import { Calendar, Clock, User, RefreshCw, Menu } from 'lucide-react';
import DoctorSidebar from "../components/DoctorSidebar";
import Navbar from "../components/Navbar";

export default function AppointmentRecords() {
  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("home");

  // ... (fetchApprovalStatus 相關的 useEffect 保持不變)
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
        // **新增：用於編輯狀態控制**
        isEditing: false, 
        tempAdvice: item.doctor_advice || "", // 將初始建議存入暫存，用於編輯
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
      // 1. 呼叫 API 儲存建議
      const res = await fetch(`/api/appointments/${appointmentId}/advice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_advice: advice })
      });

      if (!res.ok) throw new Error("API 儲存建議失敗");

      // 2. API 成功後，直接更新本地狀態
      setAppointments(prev =>
        prev.map(a =>
          a.appointment_id === appointmentId
            ? { 
                ...a, 
                doctor_advice: advice, // 更新實際顯示的建議
                tempAdvice: advice,    // 更新暫存的建議
                isEditing: false       // 關閉編輯模式
              }
            : a
        )
      );
      console.log(`✅ 預約 ID ${appointmentId} 建議已成功更新`);

    } catch (error) {
      console.error("❌ 儲存醫生建議失敗:", error);
      // 可以在這裡添加錯誤提示給使用者
      alert("儲存建議失敗，請稍後再試。");
    }
  };

  // ... (getStatusColor, formatDate, formatTime 保持不變)
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
    <div className="relative">
      {/* 打開側邊欄按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition"
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

        {/* 篩選器 (保持不變) */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all',  '已確認', '已完成', '已取消'].map((status) => (
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
        </div>

        {/* 預約列表 */}
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
                  {/* 狀態標籤 (保持不變) */}
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  {/* 患者資訊 (保持不變) */}
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

                  {/* 預約時間 (保持不變) */}
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

                  {/* 顯示取消原因（已取消狀態且有原因時）(保持不變) */}
                  {appointment.status === '已取消' && appointment.cancellation_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">
                        <span className="font-semibold">取消原因：</span>
                        <span className="text-red-700 font-normal ml-1">{appointment.cancellation_reason}</span>
                      </p>
                    </div>
                  )}

                 {/* 醫生建議（只在已完成時顯示） **重點調整區塊** */}
                  {appointment.status === '已完成' && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-800 mb-2">醫生建議與處方：</h4>

                      {/* 編輯 / 新增模式：當 isEditing 為 true 或 doctor_advice 為空時顯示 (保持不變) */}
                      {(appointment.isEditing || !appointment.doctor_advice) && (
                        <div>
                          <textarea
                            className="w-full p-3 border rounded-lg"
                            rows="4"
                            placeholder="請輸入給予患者的建議與處方..."
                            // 綁定到 tempAdvice
                            value={appointment.tempAdvice} 
                            onChange={(e) => {
                              const value = e.target.value;
                              // 更新 tempAdvice
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
                              // 點擊儲存時，呼叫新的 updateAppointmentAdvice 函數
                              onClick={() => 
                                updateAppointmentAdvice(appointment.appointment_id, appointment.tempAdvice)
                              }
                            >
                              儲存
                            </button>

                            {/* 只有在有舊建議且處於編輯模式時才顯示取消按鈕 */}
                            {appointment.doctor_advice && appointment.isEditing && (
                              <button
                                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                                onClick={() => {
                                  // 取消編輯：重置 tempAdvice 為 doctor_advice 並關閉 isEditing
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
                      
                      {/* 顯示模式：當 isEditing 為 false 且有 doctor_advice 時顯示 **樣式調整重點** */}
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

                   
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}