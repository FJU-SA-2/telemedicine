"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import BookingModal from "./BookingModal";
import SuccessPage from "./SuccessPage";
import { Menu, Calendar, Search, Clock, CircleAlert, X } from "lucide-react";
import FloatingChat from "../components/FloatingChat";
import LockedPageOverlay from "../components/LockedPageOverlay"; // ✅ 新增


function BookingPage({ doctors, schedules, setSchedules }) {
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [showAlert, setShowAlert] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState("all");
  const [selectedPaymentType, setSelectedPaymentType] = useState("all");
  const availableHospitals = [...new Set(doctors.map(d => d.practice_hospital))].filter(Boolean);
  const paymentTypes = [...new Set(doctors.map(d => d.consultation_type))].filter(Boolean);

  const isTimeSlotExpired = (dateStr, timeStr) => {
    const now = new Date();
    const slotDateTime = new Date(`${dateStr}T${timeStr}`);
    return slotDateTime < now;
  };

  const validSchedules = schedules.filter(
    s => s.is_available === 1 && !isTimeSlotExpired(s.schedule_date, s.time_slot)
  );

  const doctorsWithSchedules = new Set(
    validSchedules.map(s => s.doctor_id)
  );

  const availableSpecialties = [...new Set(
    doctors
      .filter(d => doctorsWithSchedules.has(d.doctor_id))
      .map(d => d.specialty)
  )].sort();

  const filteredDoctors = doctors.filter(doctor => {
    if (!doctorsWithSchedules.has(doctor.doctor_id)) return false;
    if (selectedSpecialty !== "all" && doctor.specialty !== selectedSpecialty) return false;
    if (selectedHospital !== "all" && doctor.practice_hospital !== selectedHospital) return false;
    if (selectedPaymentType !== "all" && doctor.consultation_type !== selectedPaymentType) return false;

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

  const getDoctorAvailableDates = (doctorId) => {
    const dates = validSchedules
      .filter(s => s.doctor_id === doctorId)
      .map(s => s.schedule_date);
    return [...new Set(dates)].sort();
  };

  const getDoctorAvailableSlots = (doctorId) => {
    return validSchedules.filter(s => s.doctor_id === doctorId).length;
  };

  const handleBooking = async (bookingData) => {
    try {
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
          amount: 250
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "預約失敗,請稍後再試");
        return;
      }

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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">

        {/* 搜尋欄 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            placeholder="搜尋醫師姓名..."
            className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
          />
          {searchName && (
            <button onClick={() => setSearchName("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* 科別 + 院所 */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-0.5">科別</label>
            <select
              value={selectedSpecialty}
              onChange={e => setSelectedSpecialty(e.target.value)}
              className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
                selectedSpecialty !== "all" ? "border-blue-400 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 bg-gray-50 text-gray-600"
              }`}
            >
              <option value="all">所有科別</option>
              {availableSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-0.5">院所</label>
            <select
              value={selectedHospital}
              onChange={e => setSelectedHospital(e.target.value)}
              className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
                selectedHospital !== "all" ? "border-blue-400 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 bg-gray-50 text-gray-600"
              }`}
            >
              <option value="all">所有院所</option>
              {availableHospitals.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>

        {/* 日期 + 自費健保 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-0.5">日期(選填)</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl text-xs sm:text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-0.5">自費/健保</label>
            <select
              value={selectedPaymentType}
              onChange={e => setSelectedPaymentType(e.target.value)}
              className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
                selectedPaymentType !== "all" ? "border-blue-400 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 bg-gray-50 text-gray-600"
              }`}
            >
              <option value="all">全部</option>
              {paymentTypes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* 清除篩選 */}
        {(selectedSpecialty !== "all" || selectedDate || searchName || selectedHospital !== "all" || selectedPaymentType !== "all") && (
          <button
            onClick={() => { setSelectedSpecialty("all"); setSelectedDate(""); setSearchName(""); setSelectedHospital("all"); setSelectedPaymentType("all"); }}
            className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition"
          >
            <X size={12} /> 清除所有篩選
          </button>
        )}
      </div>
      
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

export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ 新增：登入狀態管理
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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
    
    fetchData();
  }, []);

  // ✅ 修改：只在認證檢查時顯示載入
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 fixed top-3 left-3 text-gray-800 z-30 hover:bg-white rounded-lg transition "
          aria-label="開啟選單"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className={`flex-1 min-w-0 overflow-x-hidden transition-all duration-300 ${isOpen ? "md:ml-64" : "ml-0"}`}>
        <Navbar />
        
        <div className="relative min-h-screen">
          {loading ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">載入中...</p>
              </div>
            </div>
          ) : (
            <BookingPage doctors={doctors} schedules={schedules} setSchedules={setSchedules} />
          )}
          
          {!user && <LockedPageOverlay pageName="線上預約" icon={Calendar} />}
        </div>
      </div>

      {/* Footer */}
      <div className={`transition-all duration-300 ${isOpen ? "md:ml-64" : "ml-0"} bg-gray-800 text-white py-8`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 MedOnGo. 讓醫療服務更便捷、更貼心。
          </p>
        </div>
      </div>
      <FloatingChat />
    </div>
  );
}