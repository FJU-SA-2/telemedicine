"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Menu, Calendar, Clock, Filter, CheckCircle, X, Search } from "lucide-react";

// 模擬資料
const mockDoctors = [
  { doctor_id: 1, first_name: "建宏", last_name: "陳", gender: "male", specialty: "心臟內科", practice_hospital: "台大醫院", phone_number: "02-12345678" },
  { doctor_id: 2, first_name: "怡君", last_name: "林", gender: "female", specialty: "皮膚科", practice_hospital: "榮總醫院", phone_number: "02-23456789" },
  { doctor_id: 3, first_name: "志明", last_name: "李", gender: "male", specialty: "骨科", practice_hospital: "長庚醫院", phone_number: "02-34567890" },
  { doctor_id: 4, first_name: "美玲", last_name: "王", gender: "female", specialty: "心臟內科", practice_hospital: "台大醫院", phone_number: "02-45678901" },
  { doctor_id: 5, first_name: "大成", last_name: "張", gender: "male", specialty: "神經內科", practice_hospital: "榮總醫院", phone_number: "02-56789012" }
];

const mockSchedules = [
  { schedule_id: 1, doctor_id: 1, schedule_date: "2025-10-11", time_slot: "09:00:00", is_available: 1 },
  { schedule_id: 2, doctor_id: 1, schedule_date: "2025-10-11", time_slot: "10:00:00", is_available: 1 },
  { schedule_id: 3, doctor_id: 1, schedule_date: "2025-10-11", time_slot: "11:00:00", is_available: 0 },
  { schedule_id: 4, doctor_id: 1, schedule_date: "2025-10-12", time_slot: "09:00:00", is_available: 1 },
  { schedule_id: 5, doctor_id: 1, schedule_date: "2025-10-12", time_slot: "14:00:00", is_available: 1 },
  { schedule_id: 6, doctor_id: 2, schedule_date: "2025-10-11", time_slot: "14:00:00", is_available: 1 },
  { schedule_id: 7, doctor_id: 2, schedule_date: "2025-10-11", time_slot: "15:00:00", is_available: 1 },
  { schedule_id: 8, doctor_id: 2, schedule_date: "2025-10-11", time_slot: "16:00:00", is_available: 0 },
  { schedule_id: 9, doctor_id: 2, schedule_date: "2025-10-13", time_slot: "10:00:00", is_available: 1 },
  { schedule_id: 10, doctor_id: 3, schedule_date: "2025-10-11", time_slot: "09:00:00", is_available: 1 },
  { schedule_id: 11, doctor_id: 3, schedule_date: "2025-10-12", time_slot: "10:00:00", is_available: 1 },
  { schedule_id: 12, doctor_id: 3, schedule_date: "2025-10-12", time_slot: "11:00:00", is_available: 1 },
  { schedule_id: 13, doctor_id: 3, schedule_date: "2025-10-13", time_slot: "14:00:00", is_available: 1 },
  { schedule_id: 14, doctor_id: 4, schedule_date: "2025-10-11", time_slot: "13:00:00", is_available: 1 },
  { schedule_id: 15, doctor_id: 4, schedule_date: "2025-10-12", time_slot: "09:00:00", is_available: 1 },
  { schedule_id: 16, doctor_id: 4, schedule_date: "2025-10-12", time_slot: "10:00:00", is_available: 0 },
  { schedule_id: 17, doctor_id: 5, schedule_date: "2025-10-13", time_slot: "09:00:00", is_available: 1 },
  { schedule_id: 18, doctor_id: 5, schedule_date: "2025-10-13", time_slot: "10:00:00", is_available: 1 },
  { schedule_id: 19, doctor_id: 5, schedule_date: "2025-10-14", time_slot: "14:00:00", is_available: 1 }
];

// 🟢 統一的預約彈窗組件（與右邊檔案格式一致）
function BookingModal({ doctor, onClose, onConfirm }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [symptoms, setSymptoms] = useState("");

  // 獲取該醫生的可用日期
  const availableDates = mockSchedules
    .filter(s => s.doctor_id === doctor.doctor_id && s.is_available === 1)
    .map(s => s.schedule_date);
  const uniqueDates = [...new Set(availableDates)].sort();

  // 生成一週的日期選項（用於顯示）
  const weekDates = uniqueDates.slice(0, 7).map(dateStr => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
    return {
      day: dayNames[date.getDay()],
      date: date.getDate(),
      fullDate: dateStr
    };
  });

  // 獲取選定日期的時間段
  const timeSlots = selectedDate
    ? mockSchedules
        .filter(s => s.doctor_id === doctor.doctor_id && s.schedule_date === selectedDate)
        .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
    : [];

  const getDayName = (fullDate) => {
    const dateObj = weekDates.find((d) => d.fullDate === fullDate);
    return dateObj ? dateObj.day : "";
  };

  const doctorFullName = `${doctor.last_name}${doctor.first_name}`;

  const handleConfirm = () => {
    if (selectedDate && selectedTime && symptoms.trim()) {
      onConfirm({ doctor, date: selectedDate, time: selectedTime, symptoms });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto">
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl"
          >
            ×
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
              {doctor.last_name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-800">{doctorFullName}</h3>
              <p className="text-sm text-gray-600">{doctor.specialty}</p>
            </div>
          </div>

          {/* 日期選擇 */}
          <div className="mb-5">
            <h4 className="text-sm font-medium text-gray-700 mb-3">選擇日期</h4>
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((item) => (
                <button
                  key={item.fullDate}
                  onClick={() => {
                    setSelectedDate(item.fullDate);
                    setSelectedTime("");
                  }}
                  className={`py-2 px-1 rounded-lg text-center transition ${
                    selectedDate === item.fullDate
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300"
                  }`}
                >
                  <div className="text-xs mb-1">{item.day}</div>
                  <div className="text-base font-medium">{item.date}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 時間選擇 */}
          {selectedDate && (
            <div className="mb-5">
              <h4 className="text-sm font-medium text-gray-700 mb-3">選擇時段</h4>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.schedule_id}
                    onClick={() => slot.is_available === 1 && setSelectedTime(slot.time_slot)}
                    disabled={slot.is_available === 0}
                    className={`py-2.5 rounded-lg text-sm font-medium transition ${
                      selectedTime === slot.time_slot
                        ? "bg-blue-500 text-white"
                        : slot.is_available === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {slot.time_slot.substring(0, 5)}
                    {slot.is_available === 0 && <div className="text-xs">已滿</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 症狀描述 */}
          <div className="mb-5">
            <h4 className="text-sm font-medium text-gray-700 mb-2">症狀描述 *</h4>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="請簡述您的症狀或就診原因..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          {/* 預約確認 */}
          {selectedDate && selectedTime && (
            <div className="bg-blue-50 rounded-lg p-4 mb-5">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">預約資訊確認</h4>
              <div className="space-y-1 text-sm text-gray-700">
                <p>醫師：{doctorFullName} ({doctor.specialty})</p>
                <p>
                  日期：{selectedDate.split("-")[1]}月{selectedDate.split("-")[2]}日{" "}
                  {getDayName(selectedDate)}
                </p>
                <p>時間：{selectedTime.substring(0, 5)}</p>
                <p>方式：視訊診療</p>
              </div>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime || !symptoms.trim()}
            className={`w-full py-3 rounded-lg font-medium transition ${
              selectedDate && selectedTime && symptoms.trim()
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            確認預約
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const specialties = ["all", ...new Set(mockDoctors.map(d => d.specialty))];
  const doctorsWithSchedules = new Set(mockSchedules.map(s => s.doctor_id));

  const filteredDoctors = mockDoctors.filter(doctor => {
    if (!doctorsWithSchedules.has(doctor.doctor_id)) return false;
    if (selectedSpecialty !== "all" && doctor.specialty !== selectedSpecialty) return false;
    if (selectedDate) {
      const hasAvailableSlot = mockSchedules.some(
        s => s.doctor_id === doctor.doctor_id && 
             s.schedule_date === selectedDate && 
             s.is_available === 1
      );
      if (!hasAvailableSlot) return false;
    }
    if (searchName) {
      const fullName = doctor.last_name + doctor.first_name;
      if (!fullName.includes(searchName)) return false;
    }
    return true;
  });

  const getDoctorAvailableDates = (doctorId) => {
    const dates = mockSchedules
      .filter(s => s.doctor_id === doctorId && s.is_available === 1)
      .map(s => s.schedule_date);
    return [...new Set(dates)].sort();
  };

  const openBookingModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

  const handleBooking = (bookingData) => {
    console.log("預約資料:", bookingData);
    
    // 更新排班狀態
    const scheduleIndex = mockSchedules.findIndex(
      s => s.doctor_id === bookingData.doctor.doctor_id && 
           s.schedule_date === bookingData.date && 
           s.time_slot === bookingData.time
    );
    if (scheduleIndex !== -1) {
      mockSchedules[scheduleIndex].is_available = 0;
    }

    setShowModal(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedDoctor(null);
    }, 3000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 成功提示 */}
      {showSuccess && (
        <div className="fixed top-24 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-pulse">
          <CheckCircle size={24} />
          <span className="font-semibold">預約成功！</span>
        </div>
      )}

      {/* 篩選區 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇科別
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="text-gray-800 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">所有科別</option>
              {specialties.filter(s => s !== "all").map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇日期（選填）
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="text-gray-800 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              搜尋醫師姓名
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="輸入醫師姓名"
                className="text-gray-800 w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>
        </div>

        {(selectedSpecialty !== "all" || selectedDate || searchName) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span>篩選結果：</span>
            <span className="font-semibold text-blue-600">{filteredDoctors.length} 位醫師</span>
            <button
              onClick={() => {
                setSelectedSpecialty("all");
                setSelectedDate("");
                setSearchName("");
              }}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              清除篩選
            </button>
          </div>
        )}
      </div>

      {/* 醫生列表 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-gray-800 text-xl font-bold mb-4">可預約醫師</h2>
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p>目前沒有符合條件的醫師</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map(doctor => {
              const availableDatesCount = getDoctorAvailableDates(doctor.doctor_id).length;
              return (
                <div
                  key={doctor.doctor_id}
                  className="border rounded-lg p-4 hover:border-blue-300 hover:shadow-lg transition cursor-pointer"
                  onClick={() => openBookingModal(doctor)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {doctor.last_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">
                        {doctor.last_name + doctor.first_name} 醫師
                      </h3>
                      <p className="text-sm text-blue-600 font-medium">{doctor.specialty}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {doctor.practice_hospital}
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                        <Calendar size={14} />
                        <span>{availableDatesCount} 天有可預約時段</span>
                      </div>
                    </div>
                  </div>
                  <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                    立即預約
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 預約彈窗 - 使用統一格式 */}
      {showModal && selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          onClose={() => setShowModal(false)}
          onConfirm={handleBooking}
        />
      )}
    </div>
  );
}

export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
          {/* 只在 Sidebar 關閉時顯示打開按鈕 */}
          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              className="p-3 fixed top-2 left-4 text-gray-800 z-50"
            >
              <Menu size={24} />
            </button>
          )}
    
          {/* 側邊欄 */}
          <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <Navbar />
        <BookingPage />
      </div>
    </div>
  );
}