"use client";
import { useState, useEffect } from "react";
import { Menu, Filter, CheckCircle, ArrowLeft, Calendar, Clock, X, ArrowRight, CreditCard, FileText, CircleAlert } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

// ✅ 醫師詳細資料頁面
function DoctorDetailsPage({ doctor, onBack, onBookNow }) {
  const doctorFullName = `${doctor.first_name}${doctor.last_name}`;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto">
        <div className="flex gap-6 mb-8">
          <div className="relative">
            <button
              onClick={onBack}
              className="absolute -top-6 -left-7 p-1 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center z-10"
            >
              <ArrowLeft size={24} />
            </button>
            {doctor.photo_url ? ( 
              <img
                src={doctor.photo_url}
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
            <h1 className="text-black font-bold mb-2 text-2xl">{doctorFullName}</h1>
            <p className="text-blue-600 text-lg mb-1">{doctor.specialty}</p>
            <p className="text-gray-600">{doctor.practice_hospital}</p>
          </div>
        </div>

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

        <button
          onClick={onBookNow}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition mt-8"
        >
          立即預約
        </button>
      </div>
    </div>
  );
}

// ✅ 醫師列表頁面（新增收藏功能）
function DoctorListPage({ onSelectDoctor }) {
  const [doctors, setDoctors] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
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
          console.error(`取得最愛醫生失敗,狀態碼: ${res.status} ${res.statusText}`);
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

    fetchDoctors();
    fetchFavorites();
  }, []);

  const specialties = doctors.length > 0
    ? ["所有科別", ...new Set(doctors.map((d) => d.specialty))]
    : ["所有科別"];

  const filteredDoctors = doctors.filter((doctor) => {
    const specialtyMatch =
      !selectedSpecialty ||
      selectedSpecialty === "所有科別" ||
      doctor.specialty === selectedSpecialty;
    return specialtyMatch;
  });

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
        console.error("⚠️ API 沒有回傳JSON,操作中止。");
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {showFavoriteToast && (
        <div className="fixed top-20 right-6 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <CheckCircle size={20} />
          <span>{favoriteMessage}</span>
        </div>
      )}

      <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold">篩選條件</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇科別
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
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
              className="bg-white rounded-lg shadow p-6 relative hover:shadow-lg transition"
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
                    src={doctor.photo_url}
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
                onClick={() => onSelectDoctor(doctor)}
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

// 其他分頁
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

// ✅ 主應用入口
export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("doctors");
  const [currentView, setCurrentView] = useState("list"); // list, detail
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);

  // 載入排程資料
  useEffect(() => {
    async function fetchSchedules() {
      try {
        const response = await fetch("/api/schedules");
        const schedulesData = await response.json();
        
        const formattedSchedules = (Array.isArray(schedulesData) ? schedulesData : []).map(s => ({
          ...s,
          doctor_id: Number(s.doctor_id),
          schedule_date: s.schedule_date.split("T")[0],
          time_slot: s.time_slot.substring(0, 5),
          is_available: Number(s.is_available),
          schedule_id: s.schedule_id
        }));
        
        setSchedules(formattedSchedules);
      } catch (error) {
        console.error("載入排程錯誤:", error);
        setSchedules([]);
      }
    }

    fetchSchedules();
  }, []);

  // 處理醫師選擇 - 顯示詳細資料
  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setCurrentView("detail");
  };

  // 處理返回列表
  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedDoctor(null);
  };

  // 處理點擊立即預約 - 使用 Next.js 路由跳轉
  const handleBookNow = () => {
    // 使用 window.location 或 Next.js router 跳轉到預約頁面
    window.location.href = '/reserve';
  };

  return (
    <div className="relative">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 fixed top-2 left-4 text-gray-800 z-50 bg-white rounded-lg shadow hover:shadow-lg transition"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // 當切換分頁時重置視圖
          if (tab === "doctors") {
            setCurrentView("list");
            setSelectedDoctor(null);
          }
        }}
      />

      <div
        className={`transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Navbar />
        
        {activeTab === "home" && <HomePage />}
        
        {/* 醫生列表分頁 */}
        {activeTab === "doctors" && (
          <>
            {currentView === "list" && (
              <DoctorListPage onSelectDoctor={handleSelectDoctor} />
            )}
            
            {currentView === "detail" && selectedDoctor && (
              <DoctorDetailsPage
                doctor={selectedDoctor}
                onBack={handleBackToList}
                onBookNow={handleBookNow}
              />
            )}
          </>
        )}
        
        {/* 線上預約分頁 */}
        {activeTab === "reserve" && (
          <BookingPage 
            schedules={schedules}
            setSchedules={setSchedules}
          />
        )}
        
        {activeTab === "settings" && <SettingsPage />}
      </div>
    </div>
  );
}