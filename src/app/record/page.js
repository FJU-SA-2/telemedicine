"use client";
import { useState, useEffect } from "react";
import { Calendar, Clock, User, Stethoscope, RefreshCw, Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function AppointmentRecords() {
  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/record", {
        credentials: "include", // 允許跨域 Cookie/Session
      });

      if (!res.ok) throw new Error("API 取得資料失敗");
      const data = await res.json();

      const formattedData = data.map((item) => ({
        appointment_id: item.appointment_id,
        appointment_date: item.appointment_date,
        appointment_time: item.appointment_time,
        status: item.status,
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

  // 狀態顏色
  const getStatusColor = (status) => {
    switch (status) {
      case "待確認":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
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

  // 日期格式化
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  // 時間格式化
  const formatTime = (timeString) => {
    return timeString.slice(0, 5);
  };

  // 計算可否取消（距離看診日是否超過兩天）
  const canCancel = (appointmentDate, appointmentTime) => {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    const diffDays = (appointmentDateTime - now) / (1000 * 60 * 60 * 24);
    return diffDays > 2;
  };

  // 取消預約函式
  const handleCancel = async (appointment) => {
    const confirmed = window.confirm("確定要取消嗎？");
    if (!confirmed) return;

    try {
      const res = await fetch("/api/cancel_appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ appointment_id: appointment.appointment_id }),
      });

      const data = await res.json();
      if (data.success) {
        if (appointment.status === "待確認") {
          alert("取消成功");
        } else if (appointment.status === "已確認") {
          alert("取消成功，將於三日內退款");
        } else {
          alert("取消成功");
        }

        // 即時更新畫面上的狀態（不重新整理頁面）
        setAppointments((prev) =>
          prev.map((a) =>
            a.appointment_id === appointment.appointment_id
              ? { ...a, status: "已取消" }
              : a
          )
        );
      } else {
        alert(data.message || "取消失敗，請稍後再試");
      }
    } catch (error) {
      console.error("取消失敗：", error);
      alert("取消失敗，請稍後再試");
    }
  };

  // 篩選預約
  const filteredAppointments = appointments.filter(
    (apt) => filter === "all" || apt.status === filter
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
    <div className="relative min-h-screen bg-gray-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-30 bg-white rounded-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* 主內容 */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />

        {/* 篩選器 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {["all", "待確認", "已確認", "已完成", "已取消"].map((status) => (
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
                        {appointment.doctor.first_name}
                        {appointment.doctor.last_name} 醫師
                      </h3>
                      <div className="flex items-center text-gray-600 mt-1">
                        <Stethoscope className="w-4 h-4 mr-1" />
                        <span className="text-sm">{appointment.doctor.specialty}</span>
                      </div>
                    </div>
                  </div>

                  {/* 預約時間 */}
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

                  {/* ✅ 取消按鈕（僅距離看診 > 2 天且狀態為待確認或已確認時顯示） */}
                  {["待確認", "已確認"].includes(appointment.status) &&
                    canCancel(appointment.appointment_date, appointment.appointment_time) && (
                      <button
                        onClick={() => handleCancel(appointment)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg transition"
                      >
                        取消預約
                      </button>
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
