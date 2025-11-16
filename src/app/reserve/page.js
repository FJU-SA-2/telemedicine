"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import BookingModal from "./BookingModal";
import SuccessPage from "./SuccessPage";
import { Menu, Calendar, Search, Clock, CircleAlert, X } from "lucide-react";
import FloatingChat from "../components/FloatingChat";

function BookingPage({ doctors, schedules, setSchedules }) {
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [showAlert, setShowAlert] = useState(true);

  // ✅ 新增:檢查時段是否過期的函數
  const isTimeSlotExpired = (dateStr, timeStr) => {
    const now = new Date();
    const slotDateTime = new Date(`${dateStr}T${timeStr}`);
    return slotDateTime < now;
  };

  // ✅ 修改:過濾掉過期的排程
  const validSchedules = schedules.filter(
    s => s.is_available === 1 && !isTimeSlotExpired(s.schedule_date, s.time_slot)
  );

  // 只取得有可預約時段的醫師
  const doctorsWithSchedules = new Set(
    validSchedules.map(s => s.doctor_id)
  );

  // 只顯示有可預約醫師的科別
  const availableSpecialties = [...new Set(
    doctors
      .filter(d => doctorsWithSchedules.has(d.doctor_id))
      .map(d => d.specialty)
  )].sort();

  const filteredDoctors = doctors.filter(doctor => {
    if (!doctorsWithSchedules.has(doctor.doctor_id)) return false;
    if (selectedSpecialty !== "all" && doctor.specialty !== selectedSpecialty) return false;

    if (selectedDate) {
      const hasAvailableSlot = validSchedules.some(
        s => s.doctor_id === doctor.doctor_id &&
          s.schedule_date === selectedDate
      );
      if (!hasAvailableSlot) return false;
    }

    if (searchName) {
      const fullName = doctor.first_name + doctor.last_name;
      if (!fullName.includes(searchName)) return false;
    }

    return true;
  });

  // ✅ 修改:只計算未過期的日期
  const getDoctorAvailableDates = (doctorId) => {
    const dates = validSchedules
      .filter(s => s.doctor_id === doctorId)
      .map(s => s.schedule_date);
    return [...new Set(dates)].sort();
  };

  // ✅ 修改:只計算未過期的時段
  const getDoctorAvailableSlots = (doctorId) => {
    return validSchedules.filter(s => s.doctor_id === doctorId).length;
  };

  const handleBooking = async (bookingData) => {
    try {
      // 先取得登入使用者資訊
      const meRes = await fetch("/api/me");
      if (!meRes.ok) {
        alert("請先登入!");
        return;
      }
      const meData = await meRes.json();
      const patientId = meData.user?.patient_id;

      if (!patientId) {
        alert("您不是病患,無法預約!");
        return;
      }

      // 發送預約請求到後端 API
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: bookingData.doctor.doctor_id,
          appointment_date: bookingData.date,
          appointment_time: bookingData.time,
          symptoms: bookingData.symptoms,
          payment_method: bookingData.paymentMethod,
          appointment_type: bookingData.appointmentType,
          amount: 500
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "預約失敗,請稍後再試");
        return;
      }

      // 預約成功,更新本地排程狀態
      setSchedules(prevSchedules =>
        prevSchedules.map(s =>
          s.doctor_id === bookingData.doctor.doctor_id &&
            s.schedule_date === bookingData.date &&
            s.time_slot === bookingData.time
            ? { ...s, is_available: 0 }
            : s
        )
      );

      setBookingInfo({
        ...bookingData,
        appointment_id: result.appointment_id
      });
      setShowModal(false);
      setShowSuccess(true);

    } catch (error) {
      console.error("預約錯誤:", error);
      alert("預約失敗,請檢查網路連線後再試");
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setBookingInfo(null);
    setSelectedDoctor(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 篩選區 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">篩選條件</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">選擇科別</label>
            <select
              value={selectedSpecialty}
              onChange={e => setSelectedSpecialty(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-800 font-medium"
            >
              <option value="all">所有科別 ({availableSpecialties.length})</option>
              {availableSpecialties.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">選擇日期(選填)</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">搜尋醫師姓名</label>
            <div className="relative">
              <input
                type="text"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                placeholder="輸入醫師姓名"
                className="w-full px-4 py-2.5 pl-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-800"
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            </div>
          </div>
        </div>
      </div>
      
      {/* 重要提醒區塊 */}
      {showAlert && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 relative">
          <button
            onClick={() => setShowAlert(false)}
            className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-3">
            <CircleAlert className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <p className="font-bold text-red-700">
                【重要提醒】
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-1">
                本平台提供之「心理諮商」與「精神科線上諮詢」服務屬於非醫療性質,
                僅提供心理支持、情緒陪伴、生活適應建議與健康相關資訊。
                諮詢內容不包含醫療診斷、開立藥物處方、醫療證明或任何醫療行為。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 醫生列表 */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            可預約醫師
            <span className="ml-2 text-blue-600">({filteredDoctors.length})</span>
          </h2>
          {(selectedSpecialty !== "all" || selectedDate || searchName) && (
            <button
              onClick={() => {
                setSelectedSpecialty("all");
                setSelectedDate("");
                setSearchName("");
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              清除篩選
            </button>
          )}
        </div>

        {filteredDoctors.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">目前沒有符合條件的醫師</p>
            <p className="text-sm">請嘗試調整篩選條件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDoctors.map(doctor => {
              const availableDates = getDoctorAvailableDates(doctor.doctor_id);
              const availableSlots = getDoctorAvailableSlots(doctor.doctor_id);

              return (
                <div
                  key={doctor.doctor_id}
                  className="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br from-white to-gray-50"
                  onClick={() => { setSelectedDoctor(doctor); setShowModal(true); }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
                      {doctor.last_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-800 truncate">
                        {doctor.first_name + doctor.last_name} 醫師
                      </h3>
                      <p className="text-sm text-blue-600 font-semibold">{doctor.specialty}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{doctor.practice_hospital}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} className="text-green-600" />
                      <span className="font-medium">{availableDates.length} 天可預約</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} className="text-orange-600" />
                      <span className="font-medium">{availableSlots} 個時段可選</span>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-md hover:shadow-lg">
                    立即預約
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          schedules={schedules}
          onClose={() => { setShowModal(false); setSelectedDoctor(null); }}
          onConfirm={handleBooking}
        />
      )}

      {showSuccess && bookingInfo && (
        <SuccessPage
          bookingInfo={bookingInfo}
          onClose={handleCloseSuccess}
        />
      )}
    </div>
  );
}

// 主頁面
export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function fetchData() {
    try {
      setLoading(true);

      const resDoctors = await fetch("/api/doctors");
      const doctorsData = await resDoctors.json();
      setDoctors(doctorsData);

      const resSchedules = await fetch("/api/schedules");
      const schedulesData = await resSchedules.json();

      const formattedSchedules = schedulesData.map(s => ({
        ...s,
        doctor_id: Number(s.doctor_id),
        schedule_date: s.schedule_date.split("T")[0],
        time_slot: s.time_slot.substring(0, 5),
        is_available: Number(s.is_available)
      }));

      setSchedules(formattedSchedules);
      setLoading(false);
    } catch (err) {
      console.error("載入資料錯誤:", err);
      setLoading(false);
    }
  }
  
  // 只執行一次
  fetchData();

}, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">載入中...</p>
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

      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />
        <BookingPage doctors={doctors} schedules={schedules} setSchedules={setSchedules} />
      </div>
      <FloatingChat />
    </div>
  );
}