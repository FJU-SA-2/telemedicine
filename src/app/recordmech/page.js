"use client";
import { useState, useEffect } from 'react';
import { Calendar, Clock, User, RefreshCw, Menu, LayoutGrid, List, Stethoscope } from 'lucide-react';
import Mech_Sidebar from "../components/Mech_Sidebar";
import Navbar from "../components/Navbar";

export default function MechAppointmentRecords() {
  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState("home");
  const [viewMode, setViewMode] = useState("card");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recordmech", {
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
          first_name: item.patient_first_name,
          last_name: item.patient_last_name,
        },
        doctor: {
          first_name: item.doctor_first_name,
          last_name: item.doctor_last_name,
          specialty: item.specialty || "未填寫",
        },
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

  const filteredAppointments = appointments.filter(
    (apt) => filter === 'all' || apt.status === filter
  );

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
    <div className="relative min-h-screen flex flex-col bg-gray-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 hover:bg-white rounded-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      <Mech_Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />

        <div className="flex-1 p-6">
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
                    {/* 狀態標籤 */}
                    <div className="flex justify-between items-start mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </div>

                    {/* 患者資訊 */}
                    <div className="flex items-center mb-3">
                      <div className="bg-blue-100 rounded-full p-3 mr-4">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">患者</p>
                        <h3 className="text-lg font-bold text-gray-800">
                          {appointment.patient.first_name}{appointment.patient.last_name}
                        </h3>
                      </div>
                    </div>

                    {/* 醫生資訊 */}
                    <div className="flex items-center mb-4">
                      <div className="bg-green-100 rounded-full p-3 mr-4">
                        <Stethoscope className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">醫生</p>
                        <h3 className="text-lg font-bold text-gray-800">
                          {appointment.doctor.first_name}{appointment.doctor.last_name} 醫師
                        </h3>
                        <p className="text-sm text-green-700 font-medium">{appointment.doctor.specialty}</p>
                      </div>
                    </div>

                    {/* 日期時間 */}
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

                    {/* 取消原因 */}
                    {appointment.status === '已取消' && appointment.cancellation_reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">
                          <span className="font-semibold">取消原因：</span>
                          <span className="text-red-700 font-normal ml-1">{appointment.cancellation_reason}</span>
                        </p>
                      </div>
                    )}

                    {/* 醫生建議（唯讀） */}
                    {appointment.status === '已完成' && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-800 mb-2">醫生建議與處方：</h4>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-gray-700 whitespace-pre-line text-base">
                            {appointment.doctor_advice || '尚未填寫'}
                          </p>
                        </div>
                      </div>
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
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">醫生姓名</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">看診科別</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">日期</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">時間</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        <span className="text-blue-600">醫生建議</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-red-600">取消原因</span>
                      </th>
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
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">
                            {appointment.doctor.first_name}{appointment.doctor.last_name} 醫師
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-green-700 font-medium text-sm">
                            {appointment.doctor.specialty}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-sm">
                          {formatDate(appointment.appointment_date)}
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-sm font-medium">
                          {formatTime(appointment.appointment_time)}
                        </td>
                        <td className="px-6 py-4 text-sm max-w-xs">
                          {appointment.status === '已取消' && appointment.cancellation_reason && (
                            <span className="text-red-600">{appointment.cancellation_reason}</span>
                          )}
                          {appointment.status === '已完成' && (
                            <span className="text-blue-600">
                              {appointment.doctor_advice || '尚未填寫'}
                            </span>
                          )}
                          {appointment.status === '已確認' && (
                            <span className="text-gray-400">-</span>
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
            <p className="text-gray-400">
              © 2025 MedOnGo 醫師平台. 讓醫療服務更便捷、更專業。
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}