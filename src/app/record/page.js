"use client";
import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Stethoscope, RefreshCw } from 'lucide-react';

export default function AppointmentRecords() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // 模擬從 API 獲取資料
  useEffect(() => {
    fetchAppointments();
  }, []);

 const fetchAppointments = async () => {
  setLoading(true);
  try {
    const res = await fetch("/api/appointments"); // 你的 API
    if (!res.ok) throw new Error("API 取得資料失敗");
    const data = await res.json();

    const formattedData = data.map((item) => ({
      appointment_id: item.appointment_id,
      appointment_date: item.appointment_date,
      appointment_time: item.appointment_time,
      status: item.status,
      doctor: {
        first_name: item.doctor_name.slice(-1), // 後端直接傳姓名時拆分
        last_name: item.doctor_name.slice(0, -1),
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
      case '待確認':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
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

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">我的預約紀錄</h1>
          <p className="text-gray-600">查看和管理您的醫療預約</p>
        </div>

        {/* 篩選器 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('待確認')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === '待確認'
                  ? 'bg-yellow-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              待確認
            </button>
            <button
              onClick={() => setFilter('已確認')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === '已確認'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              已確認
            </button>
            <button
              onClick={() => setFilter('已完成')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === '已完成'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              已完成
            </button>
            <button
              onClick={() => setFilter('已取消')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === '已取消'
                  ? 'bg-gray-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              已取消
            </button>
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

                  {/* 醫師資訊 */}
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 rounded-full p-3 mr-4">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {appointment.doctor.last_name}{appointment.doctor.first_name} 醫師
                      </h3>
                      <div className="flex items-center text-gray-600 mt-1">
                        <Stethoscope className="w-4 h-4 mr-1" />
                        <span className="text-sm">{appointment.doctor.specialty}</span>
                      </div>
                    </div>
                  </div>

                  {/* 預約時間 */}
                  <div className="space-y-2 bg-gray-50 rounded-lg p-4">
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
                </div>

                {/* 底部操作區 */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    預約編號: #{appointment.appointment_id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}