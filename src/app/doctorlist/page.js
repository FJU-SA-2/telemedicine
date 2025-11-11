"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Menu, Filter, CheckCircle, ArrowLeft } from "lucide-react";

// 🟢 預約模態窗口
function BookingModal({ doctor, onClose, onConfirm }) {
  const [selectedDate, setSelectedDate] = useState("2025-10-05");
  const [selectedTime, setSelectedTime] = useState("09:00");

  const weekDates = [
    { day: "週日", date: 5, fullDate: "2025-10-05" },
    { day: "週一", date: 6, fullDate: "2025-10-06" },
    { day: "週二", date: 7, fullDate: "2025-10-07" },
    { day: "週三", date: 8, fullDate: "2025-10-08" },
    { day: "週四", date: 9, fullDate: "2025-10-09" },
    { day: "週五", date: 10, fullDate: "2025-10-10" },
    { day: "週六", date: 11, fullDate: "2025-10-11" },
  ];

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  const getDayName = (fullDate) => {
    const dateObj = weekDates.find((d) => d.fullDate === fullDate);
    return dateObj ? dateObj.day : "";
  };

  const doctorFullName = `${doctor.first_name}${doctor.last_name}`;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto">
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-black hover:text-gray-600"
          >
            ×
          </button>

          <div className="flex items-center gap-3 mb-6">
           {doctor.photo_url ? ( 
            <img
              src={`http://localhost:5000${doctor.photo_url}`}
              alt={`${doctor.first_name}${doctor.last_name} 頭像`}
              className="w-16 h-16 rounded-full object-cover border"
            />
          ) : (
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {doctor.last_name?.charAt(0) || "醫"}
            </div>
          )}
            <div>
              <h3 className="font-bold text-base">{doctorFullName}</h3>
              <p className="text-sm text-black">{doctor.specialty}</p>
            </div>
          </div>

          {/* 日期選擇 */}
          <div className="mb-5">
            <h4 className="text-sm font-medium text-black-700 mb-3">選擇日期</h4>
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((item) => (
                <button
                  key={item.fullDate}
                  onClick={() => setSelectedDate(item.fullDate)}
                  className={`py-2 px-1 rounded-lg text-center transition ${selectedDate === item.fullDate
                      ? "bg-blue-500 text-black"
                      : "bg-white border border-gray-200 text-black-700 hover:border-blue-300"
                    }`}
                >
                  <div className="text-xs mb-1">{item.day}</div>
                  <div className="text-base font-medium">{item.date}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 時間選擇 */}
          <div className="mb-5">
            <h4 className="text-sm font-medium text-black-700 mb-3">選擇時段</h4>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition ${selectedTime === time
                      ? "bg-blue-500 text-black"
                      : "bg-white border border-gray-200 text-black-700 hover:border-blue-300"
                    }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* 預約確認 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-5">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">預約資訊確認</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p>醫師：{doctorFullName} ({doctor.specialty})</p>
              <p>
                日期：{selectedDate.split("-")[1]}月{selectedDate.split("-")[2]}日{" "}
                {getDayName(selectedDate)}
              </p>
              <p>時間：{selectedTime}</p>
              <p>方式：視訊診療</p>
            </div>
          </div>

          <button
            onClick={() => onConfirm({ doctor, date: selectedDate, time: selectedTime })}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition"
          >
            確認預約
          </button>
        </div>
      </div>
    </div>
  );
}

// 🟢 醫師詳細資料頁面
function DoctorDetailsPage({ doctor, onBack, onBooking }) {
  const [showModal, setShowModal] = useState(false);

  const handleBookingClick = () => {
    setShowModal(true);
  };

  const handleConfirm = (bookingData) => {
    setShowModal(false);
    onBooking(bookingData);
  };

  const doctorFullName = `${doctor.first_name}${doctor.last_name}`;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto">
        {/* 醫師基本信息 */}
        <div className="flex gap-6 mb-8">
          <div className="relative">
            {/* 返回按鈕 */}
            <button
              onClick={onBack}
              className="absolute -top-6 -left-7 p-1 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center z-10"
            >
              <ArrowLeft size={24} />
            </button>
            {doctor.photo_url ? ( 
              <img
                src={`http://localhost:5000${doctor.photo_url}`}
                alt={`${doctor.first_name}${doctor.last_name} 頭像`}
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {doctor.last_name?.charAt(0) || "醫師"}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-black font-bold mb-2">{doctorFullName}</h1>
            <p className="text-blue-600 text-lg mb-1">{doctor.specialty}</p>
            <p className="text-gray-600">{doctor.practice_hospital}</p>
          </div>
        </div>

        {/* 詳細資料 */}
        <div className="space-y-6 border-t border-gray-200 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">簡介</h3>
            <p className="text-gray-600 leading-relaxed">
              {doctor.description || "暫無介紹"}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">專業經歷</h3>
            <p className="text-gray-600 leading-relaxed">
              {doctor.experience || "暫無相關資訊"}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">學位與認證</h3>
            <p className="text-gray-600 leading-relaxed">
              {doctor.qualifications || "暫無相關資訊"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">掛號費</p>
              <p className="text-2xl font-bold text-blue-600">
                ${doctor.consultation_fee || "暫無"}
              </p>
            </div>
            
          </div>
        </div>

        {/* 預約按鈕 */}
        <button
          onClick={handleBookingClick}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition mt-8"
        >
          立即預約
        </button>
      </div>

      {showModal && (
        <BookingModal
          doctor={doctor}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

// 🟢 預約主頁面
function BookingPage({ onSelectDoctor, selectedDoctor, activeTab }) {
  const [doctors, setDoctors] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFavoriteToast, setShowFavoriteToast] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState("");

  const userId = 1; // 模擬登入使用者 ID

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const response = await fetch("/api/doctors");
        const text = await response.text();
        const data = text ? JSON.parse(text) : [];
        setDoctors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("無法取得醫生資料:", error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    }

    async function fetchFavorites() {
      try {
        const res = await fetch(`/api/favorites?user_id=${userId}`);

        if (!res.ok) {
          console.error(`取得最愛醫生失敗，狀態碼: ${res.status} ${res.statusText}`);
          setFavorites([]);
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setFavorites(data.map((id) => Number(id)));
        } else if (typeof data === 'object' && data.favorites && Array.isArray(data.favorites)) {
          setFavorites(data.favorites.map((id) => Number(id)));
        } else {
          console.warn("最愛醫生資料格式不正確:", data);
          setFavorites([]);
        }
      } catch (err) {
        console.error("無法取得最愛醫生資料:", err.message);
        setFavorites([]);
      }
    }

    if (activeTab === "reserve" || activeTab === "doctorlist") {
    fetchDoctors();
    fetchFavorites();
  }
}, [activeTab]);

  const specialties =
    doctors.length > 0
      ? ["所有科別", ...new Set(doctors.map((d) => d.specialty))]
      : ["所有科別"];

  const filteredDoctors = doctors.filter((doctor) => {
    const specialtyMatch =
      !selectedSpecialty ||
      selectedSpecialty === "所有科別" ||
      doctor.specialty === selectedSpecialty;
    return specialtyMatch;
  });

  const handleViewMore = (doctor) => {
    onSelectDoctor(doctor);
  };

  const handleBooking = (bookingData) => {
    console.log("預約資料:", bookingData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const toggleFavorite = async (doctorId) => {
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, doctor_id: doctorId }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        console.error("⚠️ API 沒有回傳JSON，操作中止。");
        return;
      }

      if (!data || typeof data.isFavorite === "undefined") {
        console.error("⚠️ API 回傳格式不正確:", data);
        return;
      }

      setFavorites((prev) =>
        data.isFavorite
          ? [...prev, doctorId]
          : prev.filter((id) => id !== doctorId)
      );

      // 顯示收藏提示
      setFavoriteMessage(data.isFavorite ? "已加入收藏" : "已取消收藏");
      setShowFavoriteToast(true);
      setTimeout(() => setShowFavoriteToast(false), 3000);
    } catch (err) {
      console.error("收藏操作失敗", err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  if (selectedDoctor) {
    return (
      <DoctorDetailsPage
        doctor={selectedDoctor}
        onBack={() => onSelectDoctor(null)}
        onBooking={handleBooking}
      />
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {showSuccess && (
        <div className="fixed top-20 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle size={20} />
          <span>預約成功!</span>
        </div>
      )}

      {showFavoriteToast && (
        <div className="fixed top-20 right-6 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle size={20} />
          <span>{favoriteMessage}</span>
        </div>
      )}

      {/* 篩選區塊 */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold">篩選條件</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-black-700 mb-2">
              選擇科別
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black-700"
            >
              <option value="">所有科別</option>
              {specialties
                .filter((s) => s !== "所有科別")
                .map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* 醫師列表 */}
      <div className="mb-4">
        <h2 className="text-xl font-bold">
          搜尋結果 ({filteredDoctors.length} 位醫師)
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => {
          const fullName = `${doctor.first_name}${doctor.last_name}`;
          return (
            <div
              key={doctor.doctor_id}
              className="bg-white rounded-lg shadow p-6 relative"
            >
              {/* 收藏按鈕 */}
              <div
                onClick={() => toggleFavorite(doctor.doctor_id)}
                className="absolute top-3 right-3 text-yellow-400 text-xl cursor-pointer select-none"
              >
                {favorites.includes(doctor.doctor_id) ? "★" : "☆"}
              </div>

              <div className="flex items-start gap-4 mb-4">
               {doctor.photo_url ? (
                 <img
                  src={`http://localhost:5000${doctor.photo_url}`}
                  alt={`${doctor.first_name}${doctor.last_name} 頭像`}
                  className="w-16 h-16 rounded-full object-cover border"
                  />
             ) : (
               <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                 {doctor.last_name?.charAt(0) || "醫"}
               </div>
               )}

                <div className="flex-1">
                  <h3 className="font-bold text-lg">{fullName}</h3>
                  <p className="text-blue-600 text-sm">{doctor.specialty}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {doctor.practice_hospital}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleViewMore(doctor)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                查看更多
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 🟢 其他分頁
function HomePage() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">首頁</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">歡迎使用遠端醫療系統</p>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">設定</h2>
      <p className="text-gray-600">功能開發中...</p>
    </div>
  );
}

// 🟢 主應用入口
export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("reserve");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

   return (
    <div className="relative">
      {/* 打開按鈕 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray z-50"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div
        className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"
          }`}
      >
        <Navbar />
        {activeTab === "home" && <HomePage />}
        {activeTab === "reserve" && (
          <BookingPage
            onSelectDoctor={setSelectedDoctor}
            selectedDoctor={selectedDoctor}
            activeTab={activeTab}
          />
        )}
        {activeTab === "doctorlist" && (
          <BookingPage
            onSelectDoctor={setSelectedDoctor}
            selectedDoctor={selectedDoctor}
            activeTab={activeTab}
          />
        )}
        {activeTab === "settings" && <SettingsPage />}
      </div>
    </div>
  );
}